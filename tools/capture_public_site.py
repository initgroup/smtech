#!/usr/bin/env python3
"""Archive observed public RMS HTML/static dependencies. GET only; no script execution.

Python 3.6+ standard library. Requests are sequential (maximum concurrency: 1).
Usage: python tools/capture_public_site.py [--page OBSERVED_PUBLIC_URL] [--limit 150]
Only links from downloaded documents are eligible, except the fixed entry URL.
"""
from __future__ import print_function
import argparse
import collections
import datetime
import hashlib
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ENTRY = 'https://www.smtech.go.kr/region/rms'
ROOT = Path(__file__).resolve().parents[1] / 'reference' / 'public-site'
ORIGIN = urllib.parse.urlsplit(ENTRY).netloc
STATIC = re.compile(r'\.(?:css|js|png|jpe?g|gif|svg|ico|webp|woff2?|ttf|eot|otf)(?:[;?#]|$)', re.I)
ENDPOINT = re.compile(r'''["']([^"'\s<>]+\.(?:do|jsp|json|html|pdf|hwp|xlsx?)(?:\?[^"'\s<>]*)?)["']''', re.I)

def now():
    return datetime.datetime.utcnow().replace(microsecond=0).isoformat() + 'Z'

def normalized(value, base):
    value = value.strip()
    if not value or value.startswith(('#', 'javascript:', 'data:', 'mailto:', 'tel:', 'about:')):
        return None
    result = urllib.parse.urljoin(base, value)
    split = urllib.parse.urlsplit(result)
    if split.scheme not in ('https', 'http'):
        return None
    path = re.sub(r';JSESSIONID[^=/;?]*=[^/;?]*', '', split.path, flags=re.I)
    query = split.query
    if '/static/' in path:
        query = urllib.parse.urlencode([(k, v) for k, v in urllib.parse.parse_qsl(query) if k != 'v'])
    return urllib.parse.urlunsplit((split.scheme, split.netloc, path, query, ''))

def redact_sessions(value):
    if isinstance(value, str):
        return re.sub(r';JSESSIONID[^=/;?\s\"\']*=[^/;?\s\"\'<>]*', '', value, flags=re.I)
    if isinstance(value, list):
        return [redact_sessions(item) for item in value]
    if isinstance(value, dict):
        return {key: redact_sessions(item) for key, item in value.items()}
    return value

class Document(HTMLParser):
    def __init__(self, url):
        HTMLParser.__init__(self, convert_charrefs=True)
        self.url = url
        self.assets = []
        self.links = []
        self.forms = []
        self.ids = []
        self.classes = collections.Counter()
        self.scripts = []
        self.styles = []
        self.inline_scripts = []
        self.inline_styles = []
        self.events = []
        self._script = None
        self._style = None
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            self.ids.append(a['id'])
        for cls in a.get('class', '').split():
            self.classes[cls] += 1
        for k, v in attrs:
            if k.startswith('on') and v:
                self.events.append({'element': tag, 'event': k, 'code': v})
        if tag == 'script':
            self._script = [] if not a.get('src') else None
            if a.get('src'):
                self.scripts.append(a['src'])
                self.assets.append((a['src'], 'script'))
        if tag == 'style':
            self._style = []
        if tag == 'link' and a.get('href'):
            self.styles.append(a)
            if 'stylesheet' in a.get('rel', '').lower() or STATIC.search(a['href']):
                self.assets.append((a['href'], 'stylesheet' if 'stylesheet' in a.get('rel', '').lower() else 'asset'))
        if tag in ('img', 'input', 'source') and a.get('src'):
            self.assets.append((a['src'], 'image'))
        if tag == 'a' and a.get('href'):
            self.links.append(a)
        if tag == 'form':
            self.forms.append(a)
        if a.get('style'):
            self.inline_styles.append(a['style'])
    def handle_data(self, data):
        if self._script is not None:
            self._script.append(data)
        if self._style is not None:
            self._style.append(data)
    def handle_endtag(self, tag):
        if tag == 'script' and self._script is not None:
            self.inline_scripts.append(''.join(self._script))
            self._script = None
        if tag == 'style' and self._style is not None:
            self.inline_styles.append(''.join(self._style))
            self._style = None
    def report(self):
        return {'url': self.url, 'script_sources': self.scripts, 'stylesheets': self.styles,
                'forms': self.forms, 'ids': self.ids, 'classes': dict(self.classes),
                'links': self.links, 'inline_scripts': self.inline_scripts,
                'inline_styles': self.inline_styles, 'inline_events': self.events}

def css_refs(source):
    refs = re.findall(r'url\(\s*[\'"]?([^\'"\)\s]+)', source, re.I)
    refs += re.findall(r'@import\s+[\'"]([^\'"]+)', source, re.I)
    return refs

def local_file(url, content_type):
    parsed = urllib.parse.urlsplit(url)
    parts = [re.sub(r'[<>:"\\|?*]', '_', urllib.parse.unquote(p)) for p in parsed.path.split('/') if p and p not in ('.', '..')]
    if not parts:
        parts = ['index']
    if 'html' in content_type and not re.search(r'\.(?:html?|jsp)$', parts[-1], re.I):
        parts[-1] += '.html'
    if parsed.query:
        base, ext = os.path.splitext(parts[-1])
        parts[-1] = base + '__q_' + hashlib.sha256(parsed.query.encode('utf-8')).hexdigest()[:10] + ext
    return ROOT / 'original' / parsed.netloc / Path(*parts)

def decode(data, content_type):
    charset = re.search(r'charset=([^;\s]+)', content_type, re.I)
    encodings = [charset.group(1).strip('\'"')] if charset else []
    encodings += ['utf-8-sig', 'cp949']
    for enc in encodings:
        try:
            return data.decode(enc)
        except (LookupError, UnicodeDecodeError):
            pass
    return data.decode('utf-8', 'replace')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--page', action='append', default=[])
    parser.add_argument('--limit', type=int, default=150)
    parser.add_argument('--offline', action='store_true', help='Rebuild analysis only from the archive; make no HTTP requests')
    args = parser.parse_args()
    ROOT.mkdir(parents=True, exist_ok=True)
    manifest_path = ROOT / 'manifest.json'
    prior = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {'resources': []}
    resources = prior['resources']
    # Migrate only this archive's own paths when normalization rules are updated.
    for item in resources:
        item.setdefault('content_type', None)
        item.setdefault('bytes', 0)
        item.setdefault('sha256', None)
        item.setdefault('local_path', None)
        item['url'] = normalized(item['url'], ENTRY)
        if item.get('referrer'):
            item['referrer'] = normalized(item['referrer'], ENTRY)
        if item.get('final_url'):
            item['final_url'] = normalized(item['final_url'], ENTRY)
        if item.get('local_path'):
            old_path = (ROOT / item['local_path']).resolve()
            new_path = local_file(item['url'], item.get('content_type', '')).resolve()
            expected_root = str(ROOT.resolve()) + os.sep
            if not str(old_path).startswith(expected_root) or not str(new_path).startswith(expected_root):
                raise SystemExit('Archive path escaped expected directory')
            if old_path.exists() and old_path != new_path:
                new_path.parent.mkdir(parents=True, exist_ok=True)
                old_path.rename(new_path)
            item['local_path'] = new_path.relative_to(ROOT.resolve()).as_posix()
    indexed = {item['url']: item for item in resources}
    queue = collections.deque([(ENTRY, 'entry', None)])
    seen = set()
    observed = set([ENTRY])
    audit = {'entry_url': ENTRY, 'analyzed_at_utc': now(), 'documents': [], 'source_endpoints': [], 'external_references': [], 'css_dependencies': [], 'skipped_resources': []}
    request_count = 0

    def enqueue(value, base, kind):
        url = normalized(value, base)
        if not url:
            return
        observed.add(url)
        if urllib.parse.urlsplit(url).netloc != ORIGIN:
            audit['external_references'].append({'source': base, 'url': url, 'kind': kind})
            return
        if url not in seen:
            queue.append((url, kind, base))

    selected_pages = collections.deque(args.page)
    while queue or selected_pages:
        if not queue:
            page = selected_pages.popleft()
            url = normalized(page, ENTRY)
            if url not in observed:
                raise SystemExit('Refusing URL not observed in downloaded source: ' + str(url))
            enqueue(url, ENTRY, 'selected-public-page')
            if not queue:
                break
        url, kind, referrer = queue.popleft()
        if url in seen:
            continue
        seen.add(url)
        item = indexed.get(url)
        if item and item.get('local_path') and (ROOT / item['local_path']).exists():
            data = (ROOT / item['local_path']).read_bytes()
            content_type = item.get('content_type', '')
        else:
            if item and item.get('error'):
                continue
            if args.offline or len(resources) >= min(args.limit, 150):
                audit['skipped_resources'].append({'url': url, 'kind': kind, 'reason': 'offline mode' if args.offline else '150 unique URL limit'})
                continue
            request_count += 1
            started = now()
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; RMS-Public-Source-Review/1.0)', 'Accept': '*/*'})
            item = {'url': url, 'kind': kind, 'referrer': referrer, 'captured_at_utc': started,
                    'content_type': None, 'bytes': 0, 'sha256': None, 'local_path': None}
            try:
                response = urllib.request.urlopen(req, timeout=35)
                data = response.read(15 * 1024 * 1024 + 1)
                if len(data) > 15 * 1024 * 1024:
                    raise ValueError('File exceeded 15 MiB archival limit')
                content_type = response.headers.get('Content-Type', '')
                path = local_file(url, content_type)
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(data)
                item.update({'status': response.status, 'final_url': normalized(response.geturl(), url), 'content_type': content_type,
                             'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
                             'local_path': path.relative_to(ROOT).as_posix()})
            except Exception as error:
                item.update({'status': getattr(error, 'code', None), 'error': str(error)})
                data = b''
                content_type = ''
            if url in indexed:
                resources.remove(indexed[url])
            resources.append(item)
            indexed[url] = item
            manifest_path.write_text(json.dumps({'entry_url': ENTRY, 'updated_at_utc': now(), 'method': 'GET', 'max_concurrency': 1,
                                                  'url_normalization': 'Anonymous JSESSIONID path parameters and static cache-busting v query are omitted; archived response bytes are unchanged.',
                                                  'resources': resources}, ensure_ascii=False, indent=2), encoding='utf-8')
            print('{} {} {}'.format(item.get('status'), kind, url), flush=True)
            time.sleep(0.10)
        source = decode(data, content_type) if any(t in content_type.lower() for t in ('text/', 'javascript', 'json')) else ''
        if 'html' in content_type.lower():
            doc = Document(url)
            doc.feed(source)
            audit['documents'].append(doc.report())
            for value, asset_kind in sorted(doc.assets, key=lambda a: 0 if a[1] in ('script', 'stylesheet') else 1):
                enqueue(value, url, asset_kind)
            for link in doc.links:
                resolved = normalized(link['href'], url)
                if resolved:
                    observed.add(resolved)
                # This route/parameter pairing is explicitly implemented in index.js.
                if url == ENTRY and link.get('name') == 'btn_detail' and link.get('sbjtid') and link.get('pblancid'):
                    observed.add(ENTRY + '/biz/pblancManage/pblancManage/pblancDetailPop.do?' + urllib.parse.urlencode({'sbjtId': link['sbjtid'], 'pblancId': link['pblancid']}))
            for form in doc.forms:
                resolved = normalized(form.get('action', ''), url)
                if resolved:
                    observed.add(resolved)
            for style in doc.inline_styles:
                for dep in css_refs(style):
                    enqueue(dep, url, 'inline-style-asset')
        if 'css' in content_type.lower() or urllib.parse.urlsplit(url).path.lower().endswith('.css'):
            for dep in css_refs(source):
                audit['css_dependencies'].append({'stylesheet': url, 'reference': dep, 'url': normalized(dep, url)})
                enqueue(dep, url, 'css-dependency')
        if source:
            for value in sorted(set(ENDPOINT.findall(source))):
                # RMS common helpers prepend CONST_CONTEXT_PATH to /biz and /cmmn URLs.
                contextual = '/region/rms' + value if value.startswith(('/biz/', '/cmmn/', '/combiz/', '/static/')) else value
                resolved = normalized(contextual, url)
                if resolved:
                    observed.add(resolved)
                    audit['source_endpoints'].append({'source': url, 'literal': value, 'url': resolved, 'requested': False})
    audit['observed_urls'] = sorted(observed)
    audit['resource_count'] = len(resources)
    audit['successful_resource_count'] = sum(1 for r in resources if r.get('status') == 200)
    audit['source_endpoints'] = [dict(item, requested=item['url'] in indexed) for item in audit['source_endpoints']]
    manifest_path.write_text(json.dumps({'entry_url': ENTRY, 'updated_at_utc': now(), 'method': 'GET', 'max_concurrency': 1,
                                          'url_normalization': 'Anonymous JSESSIONID path parameters and static cache-busting v query are omitted; archived response bytes are unchanged.',
                                          'resources': resources}, ensure_ascii=False, indent=2), encoding='utf-8')
    (ROOT / 'source-audit.json').write_text(json.dumps(redact_sessions(audit), ensure_ascii=False, indent=2), encoding='utf-8')
    print('Saved {} resources, {} documents; {} new requests'.format(len(resources), len(audit['documents']), request_count))

if __name__ == '__main__':
    main()
