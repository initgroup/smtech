# -*- coding: utf-8 -*-
"""Build developer ZIP deltas and review local conflicts. Never modifies the target tree."""
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import argparse, difflib, hashlib, json

def sha(data): return hashlib.sha256(data).hexdigest()
def safe(name):
    p=PurePosixPath(name)
    if not name or p.is_absolute() or '..' in p.parts or '\\' in name or ':' in name: raise ValueError('Unsafe path: '+name)
    return p

def read(file):
    with ZipFile(file) as z:
        if len(z.namelist())!=len(set(z.namelist())): raise ValueError('Duplicate ZIP entries')
        m=json.loads(z.read('release-manifest.json'))
        if m.get('format')!='rms-developer': raise ValueError('Use a v1.1.0+ developer ZIP as the baseline')
        files={}
        for row in m['files']:
            safe(row['path']);data=z.read(row['path'])
            if sha(data)!=row['sha256']: raise ValueError('Source hash mismatch: '+row['path'])
            files[row['path']]=data
        # Carry the new baseline manifest with the changed files, so subsequent reviews keep the delivered version/hashes.
        files['release-manifest.json']=z.read('release-manifest.json')
        return m,files

def build(baseline,current,output):
    old,previous=read(baseline);new,latest=read(current);changes=[];payload={};diff=[]
    for name in sorted(set(previous)|set(latest)):
        if name.startswith('web/integration/'): continue
        before=previous.get(name);after=latest.get(name)
        if before==after: continue
        change={'path':name,'change':'delete' if after is None else 'add' if before is None else 'modify','beforeSha256':sha(before) if before is not None else None,'afterSha256':sha(after) if after is not None else None,'manualMerge':name in {'web/index.html','web/asset-manifest.json'} or name.startswith('web/contracts/')}
        changes.append(change)
        if after is not None: payload[name]=after
        try: diff.extend(difflib.unified_diff((before or b'').decode('utf-8').splitlines(True),(after or b'').decode('utf-8').splitlines(True),'before/'+name,'after/'+name))
        except UnicodeDecodeError: pass
    report={'format':'rms-developer-delta','baselineVersion':old['version'],'version':new['version'],'readOnlyApply':True,'changes':changes}
    payload['_changes.json']=json.dumps(report,ensure_ascii=False,indent=2).encode('utf-8');payload['_changes.diff']=''.join(diff).encode('utf-8');payload['_먼저읽기.txt']='전체 덮어쓰기를 하지 마세요. _changes.json과 diff를 검토하고 내부 수정 파일을 수동 병합하세요. web/integration/은 제외됩니다. 삭제 항목은 지시 목록이며 자동 삭제하지 않습니다. delivery_delta.py --review로 충돌을 확인하세요.\n'.encode('utf-8')
    output=Path(output);output.parent.mkdir(parents=True,exist_ok=True)
    with ZipFile(output,'w',ZIP_DEFLATED) as z:
        for name,data in sorted(payload.items()):
            safe(name);info=ZipInfo(name,(2026,1,1,0,0,0));info.compress_type=ZIP_DEFLATED;info.external_attr=0o644<<16;z.writestr(info,data)
    print('Delta '+old['version']+' -> '+new['version']+': '+str(len(changes))+' paths')
    return report

def review(delivery,target):
    target=Path(target).resolve();results=[]
    with ZipFile(delivery) as z:
        report=json.loads(z.read('_changes.json'))
        if report.get('format')!='rms-developer-delta': raise ValueError('Unsupported delta')
        for row in report['changes']:
            name=row['path'];parts=safe(name)
            if name.startswith('web/integration/'): raise ValueError('Protected integration path')
            file=target.joinpath(*parts.parts)
            try: file.resolve().relative_to(target)
            except ValueError: raise ValueError('Target escapes root: '+name)
            if row['afterSha256'] and sha(z.read(name))!=row['afterSha256']: raise ValueError('Delta hash mismatch: '+name)
            found=sha(file.read_bytes()) if file.is_file() else None
            status='already-current' if found==row['afterSha256'] else 'ready-for-review' if found==row['beforeSha256'] else 'missing-local-file' if found is None else 'conflict-local-modification'
            results.append(dict(row,targetSha256=found,status=status))
    return {'readOnly':True,'target':str(target),'results':results}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--baseline');p.add_argument('--current');p.add_argument('--output');p.add_argument('--review');p.add_argument('--target');p.add_argument('--report');a=p.parse_args()
    if a.review:
        if not a.target: p.error('--review requires --target')
        result=review(a.review,a.target);text=json.dumps(result,ensure_ascii=False,indent=2)
        if a.report:
            report=Path(a.report)
            try: report.resolve().relative_to(Path(a.target).resolve())
            except ValueError: pass
            else: p.error('Report must be outside the read-only target')
            report.parent.mkdir(parents=True,exist_ok=True);report.write_text(text,encoding='utf-8')
        print(text)
    else:
        if not all([a.baseline,a.current,a.output]): p.error('Use --baseline --current --output')
        build(a.baseline,a.current,a.output)
if __name__=='__main__': main()
