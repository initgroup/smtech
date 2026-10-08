# -*- coding: utf-8 -*-
"""Build, version and copy the clean developer ZIP; optionally generate a delta from a prior clean ZIP."""
from pathlib import Path
import argparse, json, shutil, subprocess, sys
BASE=Path(__file__).resolve().parents[1]
CONFIG=json.loads((BASE/'tools/project-config.json').read_text(encoding='utf-8'))
def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--baseline',help='Previous v1.1.0+ developer ZIP');p.add_argument('--version');a=p.parse_args()
    subprocess.check_call(['node',CONFIG['build']],cwd=str(BASE))
    command=[sys.executable,CONFIG['packager']]+(['--version',a.version] if a.version else [])
    subprocess.check_call(command,cwd=str(BASE))
    current=json.loads((BASE/CONFIG['history']).read_text(encoding='utf-8'))['releases'][0]
    source=BASE/CONFIG['webRoot']/current['download'];output=BASE/'deliverables';output.mkdir(exist_ok=True);target=output/source.name
    if target.exists() and target.read_bytes()!=source.read_bytes():raise ValueError('Existing version copy differs')
    shutil.copyfile(str(source),str(target))
    if a.baseline:subprocess.check_call([sys.executable,'tools/package_publisher.py','--baseline',a.baseline,'--current',str(source),'--output',str(output/('rms-developer-v'+current['version']+'-delta.zip'))],cwd=str(BASE))
    print('Developer handoff: '+str(target))
if __name__=='__main__':main()
