# -*- coding: utf-8 -*-
"""Publisher delta delivery and read-only integration review. Python standard library only.
@change RMS-PUB-20261008-01: never extract/apply changes into a target workspace.
"""
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
from io import BytesIO
import argparse
import difflib
import hashlib
import json

BASE = Path(__file__).resolve().parents[1]
POLICY = BASE / 'releases/ownership.json'
MANIFEST = '_publisher_manifest.json'
CHANGES = '_publisher_changes.json'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def safe_name(name):
    p = PurePosixPath(name)
    if not name or p.is_absolute() or '..' in p.parts or '\\' in name or ':' in name:
        raise ValueError('Unsafe package path: ' + name)
    return p


def rule_for(name, policy):
    safe_name(name)
    if name.startswith('releases/baselines/') or any(name.startswith(p) for p in policy['protectedPrefixes']):
        return None
    for rule in policy['rules']:
        if name.startswith(rule['prefix']):
            return rule
    return None


def current_files(base=BASE, policy=None):
    policy = policy or json.loads(POLICY.read_text(encoding='utf-8'))
    files = {}
    # Walk only owned roots. Runtime archives, internal paths and reference assets never enter a delta.
    roots = ['prototype/region/rms', 'handoff/jsp-examples', 'handoff/integration-examples', 'docs', 'tools', 'tests', 'releases']
    candidates = [base / 'README.md', base / '.gitattributes', base / '.gitignore']
    for directory in roots:
        folder = base / directory
        if folder.exists():
            candidates.extend(folder.rglob('*'))
    for file in candidates:
        if not file.is_file():
            continue
        name = file.relative_to(base).as_posix()
        if any(p in {'__pycache__', 'node_modules', '.git', 'tmp'} for p in PurePosixPath(name).parts) or file.suffix in {'.zip', '.pyc'}:
            continue
        rule = rule_for(name, policy)
        if not rule:
            continue
        if file.resolve() != file.absolute():
            raise ValueError('Symlink/reparse source: ' + name)
        files[name] = {'data': file.read_bytes(), 'owner': rule['owner'], 'review': rule['review']}
    return files


def read_baseline(file):
    if file is None:
        return {}, {}
    file = Path(file)
    if file.suffix.lower() == '.zip':
        with ZipFile(file) as archive:
            name = MANIFEST if MANIFEST in archive.namelist() else '_smtech_source_manifest.json'
            manifest = json.loads(archive.read(name).decode('utf-8'))
            records = {row['path']: row for row in manifest['files']}
            content = {}
            for path, row in records.items():
                safe_name(path)
                if path in archive.namelist():
                    value = archive.read(path)
                    if sha(value) != row['sha256']:
                        raise ValueError('Baseline hash mismatch: ' + path)
                    content[path] = value
            return records, content
    manifest = json.loads(file.read_text(encoding='utf-8'))
    return {row['path']: row for row in manifest['files']}, {}


def manifest_for(files, release):
    return {'release': release, 'format': 'rms-publisher', 'version': 1,
            'files': [{'path': name, 'sha256': sha(row['data']), 'bytes': len(row['data']),
                       'owner': row['owner'], 'review': row['review']} for name, row in sorted(files.items())]}


def changes_for(files, old, policy):
    result = []
    for name in sorted(set(files) | {p for p in old if rule_for(p, policy)}):
        before = old.get(name, {}).get('sha256')
        after = sha(files[name]['data']) if name in files else None
        if before == after:
            continue
        rule = rule_for(name, policy)
        result.append({'path': name, 'change': 'delete' if after is None else 'modify' if before else 'add',
                       'beforeSha256': before, 'afterSha256': after, 'owner': rule['owner'], 'review': rule['review']})
    return result


def build(baseline, output, base=BASE):
    policy = json.loads((base / 'releases/ownership.json').read_text(encoding='utf-8'))
    files = current_files(base, policy)
    old, old_data = read_baseline(baseline)
    changes = changes_for(files, old, policy)
    report = {'release': policy['release'], 'baseline': Path(baseline).name if baseline else 'initial delivery',
              'instructions': 'Review before applying. Protected paths excluded. Deletions are instructions only.', 'changes': changes}
    payload = {r['path']: files[r['path']]['data'] for r in changes if r['change'] != 'delete'}
    manifest = manifest_for(files, policy['release'])
    payload[MANIFEST] = json.dumps(manifest, ensure_ascii=False, indent=2).encode('utf-8')
    payload[CHANGES] = json.dumps(report, ensure_ascii=False, indent=2).encode('utf-8')
    diffs = []
    for row in changes:
        name = row['path']
        if row['beforeSha256'] and name not in old_data:
            continue  # Hash-only baseline: never fabricate the previous source.
        try:
            before = old_data.get(name, b'').decode('utf-8').splitlines(True)
            after = files.get(name, {}).get('data', b'').decode('utf-8').splitlines(True)
        except UnicodeDecodeError:
            continue
        diffs.extend(difflib.unified_diff(before, after, 'before/' + name, 'after/' + name))
    payload['_publisher_changes.diff'] = ''.join(diffs).encode('utf-8')
    payload['_READ_FIRST.txt'] = ('Do not overwrite the intranet source tree.\n'
        '1. Review _publisher_changes.json and _publisher_changes.diff.\n'
        '2. Run: python tools/package_publisher.py --review DELIVERY.zip --target STAGING_ROOT\n'
        '3. Merge shared HTML/JSP shell and contract files manually.\n'
        '4. Review deletion entries; this ZIP never deletes files automatically.\n'
        '5. Keep this ZIP/manifest as the baseline for the next delivery.\n'
        'See docs/06-publisher-workflow.md for Korean instructions.\n').encode('utf-8')
    buffer = BytesIO()
    with ZipFile(buffer, 'w', ZIP_DEFLATED) as archive:
        for name, data in sorted(payload.items()):
            safe_name(name)
            info = ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, data)
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(buffer.getvalue())
    with ZipFile(output) as archive:
        if archive.testzip() is not None:
            raise ValueError('ZIP CRC error')
        for row in changes:
            if row['afterSha256'] and sha(archive.read(row['path'])) != row['afterSha256']:
                raise ValueError('Delivery hash mismatch: ' + row['path'])
    output.with_suffix('.manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    output.with_suffix('.changes.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Publisher delta: {} changed paths, {} bytes: {}'.format(len(changes), output.stat().st_size, output.name))
    return report


def review(delivery, target):
    target = Path(target).resolve()
    with ZipFile(delivery) as archive:
        report = json.loads(archive.read(CHANGES).decode('utf-8'))
        results = []
        for row in report['changes']:
            name = row['path']
            safe_name(name)
            if name.startswith('integration/'):
                raise ValueError('Protected integration path in package')
            file = target.joinpath(*PurePosixPath(name).parts)
            try:
                file.resolve().relative_to(target)
            except ValueError:
                raise ValueError('Target escapes workspace: ' + name)
            if row['afterSha256'] and sha(archive.read(name)) != row['afterSha256']:
                raise ValueError('Delivery hash mismatch: ' + name)
            found = sha(file.read_bytes()) if file.is_file() else None
            if found == row['afterSha256']:
                status = 'already-current'
            elif found == row['beforeSha256']:
                status = 'ready-for-review'
            elif found is None:
                status = 'missing-local-file'
            else:
                status = 'conflict-local-modification'
            results.append(dict(row, targetSha256=found, status=status))
    return {'target': str(target), 'readOnly': True, 'results': results}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline', help='Previous full source ZIP, publisher ZIP or manifest JSON')
    parser.add_argument('--output', default='deliverables/RMS-PUB-20261008-01-publisher.zip')
    parser.add_argument('--review', help='Review a publisher ZIP against a local staging tree; never write into it')
    parser.add_argument('--target', help='Staging root preserving delivered prototype/... paths')
    parser.add_argument('--report', help='Optional review JSON path outside the target source')
    args = parser.parse_args()
    if args.review:
        if not args.target:
            parser.error('--review requires --target')
        result = review(args.review, args.target)
        text = json.dumps(result, ensure_ascii=False, indent=2)
        if args.report:
            path = Path(args.report)
            target = Path(args.target).resolve()
            try:
                path.resolve().relative_to(target)
            except ValueError:
                pass
            else:
                parser.error('Keep --report outside the read-only target tree')
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding='utf-8')
        counts = {}
        for row in result['results']:
            counts[row['status']] = counts.get(row['status'], 0) + 1
        print(json.dumps({'readOnly': True, 'counts': counts}, ensure_ascii=False))
    else:
        build(args.baseline, args.output)


if __name__ == '__main__':
    main()
