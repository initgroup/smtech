# -*- coding: utf-8 -*-
"""Versioned developer-only delivery. Positive file list; no demo sources. Python stdlib only."""
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
from io import BytesIO
import argparse, hashlib, json, subprocess
from datetime import datetime, timezone, timedelta
BASE = Path(__file__).resolve().parents[1]
CONFIG_PATH = BASE / 'tools/project-config.json'
CONFIG = json.loads(CONFIG_PATH.read_text(encoding='utf-8')) if CONFIG_PATH.exists() else {}
WEB = CONFIG.get('webRoot', 'prototype/region/rms').rstrip('/') + '/'
ARCHIVE_PATH = CONFIG.get('archive', WEB + 'downloads/smtech-source.zip')
MANIFEST = 'release-manifest.json'
HISTORY = CONFIG.get('history', 'releases/history.json')

def sha(data): return hashlib.sha256(data).hexdigest()
def encode(value): return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
def safe(name):
    p = PurePosixPath(name)
    if not name or p.is_absolute() or '..' in p.parts or '\\' in name or ':' in name: raise ValueError('Unsafe path: '+name)
    return p

def excluded(name):
    return (any(p in {'__pycache__','node_modules','tmp','local','.git','.venv','venv','.vs','.idea'} for p in PurePosixPath(name).parts)
        or (PurePosixPath(name).name.startswith('.env') and PurePosixPath(name).name != '.env.example')
        or name.endswith(('.zip','.pyc','.log','.sha256')) or '/downloads/' in name
        or name.startswith(('releases/baselines/','releases/records/'))
        or name in {WEB+'demo/generated/releases.js', HISTORY})

def read_sources(base=BASE, mode='worktree', ref=None):
    """Read working files or exactly one Git index/tree, never mix the two."""
    def git(*args): return subprocess.check_output(['git',*args],cwd=str(base))
    policy_name='releases/developer-package.json'
    if mode=='worktree': policy=json.loads((base/policy_name).read_text(encoding='utf-8'))
    else: policy=json.loads(git('show',(':'+policy_name) if mode=='index' else ref+':'+policy_name))
    roots=policy['watch']+[HISTORY]
    def wanted(name): return name==HISTORY or (not excluded(name) and any(name==r or name.startswith(r.rstrip('/')+'/') for r in roots))
    if mode=='worktree':
        files={}
        if (base/'.git').exists():
            # Match git add --all, including new ignore rules for previously tracked files.
            ignored=set(git('ls-files','--cached','--ignored','--exclude-standard','-z').split(b'\0'))
            names=[n.decode('utf-8') for n in git('ls-files','--cached','--others','--exclude-standard','-z').split(b'\0') if n and n not in ignored]
            candidates=[base/n for n in names if wanted(n)]
        else:
            candidates=[]
            for prefix in roots:
                folder=base/prefix
                candidates.extend(folder.rglob('*') if folder.is_dir() else [folder])
        for f in candidates:
            name=f.relative_to(base).as_posix()
            if not wanted(name) or not f.is_file():continue
            if f.resolve()!=f.absolute():raise ValueError('Linked source: '+name)
            files[name]=f.read_bytes()
        if files and (base/'.git').exists():
            # Respect declared Git text normalization; preserve original binary/CP949 samples.
            command=subprocess.run(['git','check-attr','-z','--stdin','text','eol'],input=('\0'.join(files)+'\0').encode('utf-8'),cwd=str(base),stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True)
            tokens=command.stdout.split(b'\0');attrs={}
            for at in range(0,len(tokens)-1,3):
                name,key,value=(part.decode('utf-8') for part in tokens[at:at+3]);attrs.setdefault(name,{})[key]=value
            for name,settings in attrs.items():
                if settings.get('text')=='set' or (settings.get('text')!='unset' and settings.get('eol')=='lf'):
                    files[name]=files[name].replace(b'\r\n',b'\n')
        return policy,files
    rows=git('ls-files','--stage','-z') if mode=='index' else git('ls-tree','-rz',ref)
    records=[]
    for row in rows.split(b'\0'):
        if not row: continue
        info,name=row.split(b'\t',1);name=name.decode('utf-8')
        if not wanted(name): continue
        fields=info.decode('ascii').split()
        if mode=='index':
            perm,oid,stage=fields
            if stage!='0': raise ValueError('Unresolved conflict: '+name)
        else:
            perm,kind,oid=fields
            if kind!='blob': raise ValueError('Unsupported source: '+name)
        if perm not in {'100644','100755'}: raise ValueError('Linked source: '+name)
        records.append((name,oid))
    unique=sorted({oid for _,oid in records});blobs={}
    if unique:
        process=subprocess.Popen(['git','cat-file','--batch'],cwd=str(base),stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        out,err=process.communicate(('\n'.join(unique)+'\n').encode('ascii'))
        if process.returncode: raise RuntimeError(err.decode('utf-8','replace'))
        at=0
        for oid in unique:
            end=out.index(b'\n',at);header=out[at:end].decode('ascii').split()
            if header[:2]!=[oid,'blob']: raise ValueError('Invalid Git blob')
            size=int(header[2]);blobs[oid]=out[end+1:end+1+size];at=end+size+2
    return policy,{name:blobs[oid] for name,oid in records}

def collect(policy,sources):
    result={}
    for tree in policy['trees']:
        prefix=tree['source'].rstrip('/')+'/'
        for name,data in sources.items():
            if name.startswith(prefix):
                target='/'.join(filter(None,[tree['target'],name[len(prefix):]]));safe(target)
                if target in result: raise ValueError('Duplicate target: '+target)
                result[target]=data
    for row in policy['files']:
        safe(row['target']);result[row['target']]=sources[row['source']]
    # Fail closed if an accidental move/reintroduction contaminates the allowed business tree.
    forbidden=('rms-demo','rms-sfr','data-sfr','RMSDemo','RMSCore','RMSRequirements','RMSSfrLayer','#guide','sfr-open','smtech.rms.prototype')
    for name,data in result.items():
        if any(p in {'demo','data'} for p in PurePosixPath(name).parts) and name.startswith('web/') and '/static/js/rms-enhance/data/' not in name:
            raise ValueError('Sample/demo directory in developer package: '+name)
        if name.endswith(('.html','.css','.js','.jsp','.jspf')):
            text=data.decode('utf-8')
            if any(token in text for token in forbidden) or __import__('re').search(r'\bSFR(?:-\d{2}|\b)',text): raise ValueError('Demo runtime leaked: '+name)
    return result

def fingerprint(sources):
    hashes={n:sha(d) for n,d in sorted(sources.items()) if n!=HISTORY}
    return sha(encode(hashes)),hashes

def public_history(history):
    keys=('version','releaseId','date','legacy','title','changes','migration','download','changedPaths')
    return {'formatVersion':1,'releases':[{k:r[k] for k in keys if k in r} for r in history['releases']]}

def history_markdown(history):
    text='# 개발자 소스 배포내역\n\n최신 배포부터 기록합니다. 이 목록은 이후 버전에도 누적됩니다.\n\n'
    for r in history['releases']:
        text+='## v'+r['version']+' · '+r['date']+' · '+r['title']+'\n\n'
        if r.get('legacy'): text+='**구형 전체 소스 — 시연 도구 포함. 내부 이식 기준으로 사용하지 마세요.**\n\n'
        text+='\n'.join('- '+v for v in r['changes'])+'\n\n이식 안내: '+r['migration']+'\n\n'
        if r.get('download'): text+='보관 파일: '+r['download'].split('/')[-1]+'\n\n'
    return text

def owner(name):
    if name.startswith('web/integration/'): return 'integration-protected'
    if name in {'web/index.html','web/asset-manifest.json'}: return 'shared-manual-merge'
    if name.startswith('web/contracts/'): return 'contract-manual-merge'
    if name.startswith('web/'): return 'publisher-hash-compare'
    return 'reference-only'

def zip_bytes(files):
    buffer=BytesIO()
    with ZipFile(buffer,'w',ZIP_DEFLATED) as z:
        # Root onboarding files appear first when the archive is opened.
        ordered=sorted(files,key=lambda n:(0 if '/' not in n else 1,n))
        for name in ordered:
            safe(name);info=ZipInfo(name,date_time=(2026,1,1,0,0,0));info.compress_type=ZIP_DEFLATED;info.create_system=3;info.external_attr=0o644<<16
            z.writestr(info,files[name])
    return buffer.getvalue()

def archive_bytes(policy,sources,history):
    current=history['releases'][0]
    if current.get('legacy'): raise ValueError('Create a developer release first')
    digest,hashes=fingerprint(sources)
    if digest!=current['sourceFingerprint']:
        expected=current.get('sourceFiles',{})
        paths=[name for name in sorted(set(expected)|set(hashes)) if expected.get(name)!=hashes.get(name)]
        details=', '.join(paths[:12])+(' ...' if len(paths)>12 else '')
        raise ValueError('Sources changed ('+str(len(paths))+' paths): '+details+'. Rebuild the release and reapply current Git attributes before staging.')
    files=collect(policy,sources)
    files['01_배포내역.md']=history_markdown(history).encode('utf-8')
    files['release-history.json']=encode(public_history(history))
    files[MANIFEST]=encode({'format':'rms-developer','formatVersion':1,'version':current['version'],'date':current['date'],'sourceFingerprint':digest,
        'deployRoot':'web/','excluded':['demo tools','SFR HTML/CSS/JS','mock store','JSON backup','XML samples'],
        'files':[{'path':n,'sha256':sha(d),'bytes':len(d),'owner':owner(n)} for n,d in sorted(files.items())]})
    return zip_bytes(files)

def verify(content,policy,sources,history):
    expected=archive_bytes(policy,sources,history)
    if content!=expected: raise ValueError('Developer ZIP differs from selected source snapshot')
    with ZipFile(BytesIO(content)) as z:
        if z.testzip(): raise ValueError('ZIP integrity failure')
        m=json.loads(z.read(MANIFEST))
        if set(z.namelist())!={r['path'] for r in m['files']}|{MANIFEST}: raise ValueError('Unexpected ZIP entry')
        for row in m['files']:
            if sha(z.read(row['path']))!=row['sha256']: raise ValueError('ZIP hash mismatch')
    return m

def build(base=BASE,version=None):
    policy,sources=read_sources(base)
    history=json.loads(sources[HISTORY]);digest,hashes=fingerprint(sources);latest=history['releases'][0]
    notes=json.loads(sources['releases/next.json']);notes_digest=sha(sources['releases/next.json'])
    if latest.get('sourceFingerprint')!=digest:
        if version is None:
            parts=[int(n) for n in latest['version'].split('.')];parts[2]+=1;version='.'.join(map(str,parts)) if not latest.get('legacy') else '1.1.0'
        if not __import__('re').fullmatch(r'\d+\.\d+\.\d+',version): raise ValueError('Version must be X.Y.Z')
        if tuple(map(int,version.split('.')))<=tuple(map(int,latest['version'].split('.'))): raise ValueError('Version must increase')
        previous=latest.get('sourceFiles',{});changed=[n for n in sorted(set(previous)|set(hashes)) if previous.get(n)!=hashes.get(n)]
        fresh=latest.get('notesDigest')!=notes_digest
        entry={'version':version,'date':datetime.now(timezone(timedelta(hours=9))).date().isoformat(),'title':notes['title'] if fresh else '추가 수정 배포 ('+str(len(changed))+'개 경로)',
            'changes':notes['changes'] if fresh else ['직전 버전 이후 변경 경로 '+str(len(changed))+'개. changedPaths와 SHA-256 목록을 비교하세요.'],
            'migration':notes['migration'],'download':'downloads/releases/rms-developer-v'+version+'.zip',
            'sourceFingerprint':digest,'sourceFiles':hashes,'notesDigest':notes_digest,'changedPaths':changed}
        history['releases'].insert(0,entry)
    current=history['releases'][0];content=archive_bytes(policy,sources,history);verify(content,policy,sources,history)
    archive=base/WEB/current['download'];archive.parent.mkdir(parents=True,exist_ok=True)
    if archive.exists() and archive.read_bytes()!=content: raise ValueError('Immutable archive already exists with different bytes: '+str(archive))
    archive.write_bytes(content)
    current['archiveSha256']=sha(content)
    (base/HISTORY).write_bytes(encode(history))
    output=base/ARCHIVE_PATH;output.parent.mkdir(parents=True,exist_ok=True);output.write_bytes(content)
    archive.with_suffix('.zip.sha256').write_bytes((sha(content)+'  '+archive.name+'\n').encode('ascii'))
    (base/'releases/RELEASES.md').write_bytes(history_markdown(history).encode('utf-8'))
    generated=base/WEB/'demo/generated/releases.js';generated.parent.mkdir(parents=True,exist_ok=True)
    generated.write_bytes(('/* GENERATED by tools/package_source.py. DEMO ONLY. */\nwindow.RMSReleaseHistory = '+json.dumps(public_history(history),ensure_ascii=False,indent=2)+';\n').encode('utf-8'))
    record=base/'releases/records'/('v'+current['version']+'.json');record.parent.mkdir(parents=True,exist_ok=True);record.write_bytes(encode(current))
    print('Developer ZIP v'+current['version']+': '+str(len(content))+' bytes; SHA-256 '+sha(content))
    return content,history

def verify_git_artifacts(base,mode,ref,history,content):
    """Verify alias, every retained clean release ZIP, and its sidecar from the same Git snapshot."""
    def blob(name):
        spec=(ref+':'+name) if mode=='ref' else ':'+name
        try:return subprocess.check_output(['git','show',spec],cwd=str(base),stderr=subprocess.PIPE)
        except subprocess.CalledProcessError:raise ValueError('Missing release artifact in '+mode+': '+name)
    if blob(ARCHIVE_PATH)!=content:raise ValueError('Latest ZIP alias differs from release content')
    for release in history['releases']:
        if release.get('legacy'):continue
        name=WEB+release['download'];archive=blob(name)
        if sha(archive)!=release['archiveSha256']:raise ValueError('Version ZIP hash differs: '+name)
        expected=(sha(archive)+'  '+PurePosixPath(name).name+'\n').encode('ascii')
        if blob(name+'.sha256').replace(b'\r\n',b'\n')!=expected:raise ValueError('Version ZIP sidecar differs: '+name)
    if blob(WEB+history['releases'][0]['download'])!=content:raise ValueError('Latest version ZIP differs from alias')

def main():
    parser=argparse.ArgumentParser(description=__doc__);m=parser.add_mutually_exclusive_group();m.add_argument('--index',action='store_true');m.add_argument('--verify-index',action='store_true');m.add_argument('--verify-ref');parser.add_argument('--version');args=parser.parse_args()
    if args.index or args.verify_index or args.verify_ref:
        mode='ref' if args.verify_ref else 'index';policy,sources=read_sources(BASE,mode,args.verify_ref);history=json.loads(sources[HISTORY]);content=archive_bytes(policy,sources,history)
        if args.index: (BASE/ARCHIVE_PATH).write_bytes(content)
        else:
            spec=(args.verify_ref+':'+ARCHIVE_PATH) if args.verify_ref else ':'+ARCHIVE_PATH
            content=subprocess.check_output(['git','show',spec],cwd=str(BASE))
        verify(content,policy,sources,history)
        if not args.index:verify_git_artifacts(BASE,mode,args.verify_ref,history,content)
        print('Verified developer delivery and retained artifacts against '+mode)
    else: build(version=args.version)
if __name__=='__main__': main()
