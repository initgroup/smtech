# -*- coding: utf-8 -*-
"""Git preflight and index-only removal of ignored files. Never removes working files."""
from pathlib import Path
import argparse,json,subprocess
BASE=Path(__file__).resolve().parents[1]
def git(base,*args):return subprocess.check_output(['git',*args],cwd=str(base),stderr=subprocess.PIPE)
def check(base=BASE):
    top=Path(git(base,'rev-parse','--show-toplevel').decode('utf-8').strip()).resolve()
    if top!=base.resolve():raise ValueError('Run from the project repository root, not an enclosing repository.')
    branch=git(base,'symbolic-ref','--quiet','--short','HEAD').decode('utf-8').strip()
    if not branch:raise ValueError('Check out a branch before committing or pushing.')
    conflicts=git(base,'diff','--name-only','--diff-filter=U','-z')
    if conflicts:raise ValueError('Resolve merge conflicts before preparing a release.')
    for marker in ['MERGE_HEAD','CHERRY_PICK_HEAD','REVERT_HEAD','rebase-merge','rebase-apply']:
        location=Path(git(base,'rev-parse','--git-path',marker).decode('utf-8').strip())
        if not location.is_absolute():location=base/location
        if location.exists():raise ValueError('Finish or abort the current Git operation before deploying: '+marker)
    ignored=[n.decode('utf-8') for n in git(base,'ls-files','--cached','--ignored','--exclude-standard','-z').split(b'\0') if n]
    return {'branch':branch,'ignoredTracked':ignored}
def prune(base=BASE):
    state=check(base);names=state['ignoredTracked']
    for at in range(0,len(names),20):
        subprocess.check_call(['git','rm','--cached','--ignore-unmatch','--',*[':(literal)'+n for n in names[at:at+20]]],cwd=str(base),stdout=subprocess.DEVNULL)
    if check(base)['ignoredTracked']:raise ValueError('Ignored files remain in the Git index.')
    return len(names)
def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--prune-index',action='store_true');a=p.parse_args()
    try:
        if a.prune_index:print(json.dumps({'untrackedFromIndex':prune(),'workingFilesPreserved':True}))
        else:
            state=check();print(json.dumps({'branch':state['branch'],'ignoredTrackedCount':len(state['ignoredTracked']),'readOnly':True}))
    except (ValueError,subprocess.CalledProcessError) as error:
        p.exit(1,'Git preflight failed: '+str(error)+'\n')
if __name__=='__main__':main()
