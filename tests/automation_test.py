# -*- coding: utf-8 -*-
"""Real PowerShell/Git tests in disposable repositories only. No external remote."""
from pathlib import Path
import importlib.util,json,os,shutil,subprocess,sys,tempfile,unittest
ROOT=Path(__file__).resolve().parents[1]
POWERSHELL=shutil.which('powershell.exe')
spec=importlib.util.spec_from_file_location('git_guard',ROOT/'tools/git_guard.py');guard=importlib.util.module_from_spec(spec);spec.loader.exec_module(guard)
def put(base,name,text):
    file=base/name;file.parent.mkdir(parents=True,exist_ok=True);file.write_text(text,encoding='utf-8')
@unittest.skipUnless(POWERSHELL and shutil.which('git') and shutil.which('node'),'Windows PowerShell/Git/Node required')
class AutomationTest(unittest.TestCase):
    def setUp(self):
        scratch=ROOT/'tmp';scratch.mkdir(exist_ok=True);self.temp=tempfile.TemporaryDirectory(prefix='git automation ',dir=str(scratch));self.base=Path(self.temp.name).resolve();self.assertEqual(self.base.parent,scratch.resolve())
        for name in ['start.ps1','git-upload.ps1','tools/project-common.ps1','tools/package_source.py','tools/git_guard.py','tools/serve.py']:
            file=self.base/name;file.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(str(ROOT/name),str(file))
        config=json.loads((ROOT/'tools/project-config.json').read_text(encoding='utf-8'));config.update(webRoot='public/site',archive='public/site/downloads/smtech-source.zip',serveRoot='public',servePath='/site/',pythonCandidates=[sys.executable])
        put(self.base,'tools/project-config.json',json.dumps(config));put(self.base,'tools/build.cjs',"console.log('fixture build passed');\n")
        put(self.base,'releases/developer-package.json',json.dumps({'trees':[{'source':'public/site/static','target':'web/static'}],'files':[{'source':'public/site/application.html','target':'web/index.html'}],'watch':['public/site','tools','releases/developer-package.json','releases/next.json','start.ps1','git-upload.ps1','.gitignore','.gitattributes']}))
        put(self.base,'releases/history.json',json.dumps({'releases':[{'version':'1.0.0','legacy':True,'date':'2026-10-08','title':'Legacy','changes':['Legacy'],'migration':'Use clean ZIP'}]}));put(self.base,'releases/next.json',json.dumps({'title':'Automation','changes':['Test release'],'migration':'Merge changes'}))
        put(self.base,'public/site/application.html','<main>Business</main>\n');put(self.base,'public/site/static/app.js','window.business=true;\n');put(self.base,'.gitattributes','* -text\n*.js text eol=lf\n*.json text eol=lf\n*.ps1 text eol=lf\n')
        self.git('init','-q');self.git('config','user.name','Automation Fixture');self.git('config','user.email','fixture@example.invalid');self.git('config','core.autocrlf','false')
        # Dummy private files were tracked before ignore rules existed.
        put(self.base,'.env','DUMMY=fixture-only\n');put(self.base,'local/private.txt','fixture only\n');self.git('add','.');self.git('commit','-qm','fixture initial')
        put(self.base,'.gitignore','.env\nlocal/\ntmp/\n__pycache__/\n*.pyc\n')
    def tearDown(self):
        # Windows Git object files can be readonly; cleanup is confined to this verified tmp root.
        for file in self.base.rglob('*'):
            if file.is_file():file.chmod(0o600)
        self.temp.cleanup()
    def git(self,*args):return subprocess.check_output(['git',*args],cwd=str(self.base),stderr=subprocess.PIPE)
    def ps(self,script,*args):
        return subprocess.run([POWERSHELL,'-NoProfile','-ExecutionPolicy','Bypass','-File',str(self.base/script),*args],cwd=str(ROOT/'tmp'),stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=30)
    def okay(self,result):self.assertEqual(result.returncode,0,(result.stdout+result.stderr).decode('utf-8','replace'))
    def test_check_and_prepare_modes_preserve_index_commits_and_remotes(self):
        index=self.git('ls-files','--stage','-z');head=self.git('rev-parse','HEAD');history=(self.base/'releases/history.json').read_bytes()
        self.okay(self.ps('git-upload.ps1','-Check'));self.assertEqual(history,(self.base/'releases/history.json').read_bytes())
        self.assertFalse((self.base/'public/site/downloads/smtech-source.zip').exists())
        self.okay(self.ps('git-upload.ps1','-PrepareOnly'));self.assertEqual(index,self.git('ls-files','--stage','-z'));self.assertEqual(head,self.git('rev-parse','HEAD'));self.assertEqual(self.git('remote'),b'')
        self.assertTrue((self.base/'public/site/downloads/smtech-source.zip').is_file());self.assertTrue((self.base/'.env').is_file())
    def test_commit_push_new_files_and_repeated_run_use_the_configured_local_remote(self):
        remote=self.base/'tmp/remote.git';remote.parent.mkdir();subprocess.check_call(['git','init','--bare','-q',str(remote)])
        self.git('remote','add','origin',str(remote));self.okay(self.ps('git-upload.ps1','-Push'))
        head=self.git('rev-parse','HEAD');history=(self.base/'releases/history.json').read_bytes();self.assertEqual(guard.check(self.base)['ignoredTracked'],[])
        self.assertTrue((self.base/'.env').is_file());self.assertTrue((self.base/'local/private.txt').is_file())
        self.okay(self.ps('git-upload.ps1'));self.assertEqual(head,self.git('rev-parse','HEAD'));self.assertEqual(history,(self.base/'releases/history.json').read_bytes())
        put(self.base,'public/site/static/new-feature.js','window.nextFeature=true;\n');self.okay(self.ps('git-upload.ps1','-Push'))
        latest=json.loads((self.base/'releases/history.json').read_text(encoding='utf-8'))['releases'][0];self.assertEqual(latest['version'],'1.1.1')
        branch=self.git('symbolic-ref','--short','HEAD').decode().strip();remote_head=subprocess.check_output(['git','--git-dir',str(remote),'rev-parse',branch]);self.assertEqual(remote_head,self.git('rev-parse','HEAD'))
    def test_missing_version_sidecar_blocks_staged_verification(self):
        self.okay(self.ps('git-upload.ps1'))
        self.git('rm','--cached','public/site/downloads/releases/rms-developer-v1.1.0.zip.sha256')
        result=subprocess.run([sys.executable,'tools/package_source.py','--verify-index'],cwd=str(self.base),stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        self.assertNotEqual(result.returncode,0);self.assertIn(b'Missing release artifact',result.stderr)
    def test_crlf_text_and_new_ignore_rules_match_staged_delivery(self):
        (self.base/'public/site/static/app.js').write_bytes(b'window.business=true;\r\n');put(self.base,'tools/.env','DUMMY=do-not-package\n');self.git('add','-f','tools/.env')
        self.okay(self.ps('git-upload.ps1'));self.assertTrue((self.base/'tools/.env').is_file());self.assertNotIn(b'tools/.env',self.git('ls-files','-z'))
    def test_detached_head_and_remote_mismatch_fail_before_build_or_staging(self):
        self.git('remote','add','origin','fixture-original');before=self.git('ls-files','--stage','-z')
        result=self.ps('git-upload.ps1','-Check','-RemoteUrl','fixture-other');self.assertNotEqual(result.returncode,0);self.assertEqual(before,self.git('ls-files','--stage','-z'))
        self.git('checkout','--detach','-q');result=self.ps('git-upload.ps1','-Check');self.assertNotEqual(result.returncode,0)
        self.assertFalse((self.base/'public/site/downloads/smtech-source.zip').exists())
    def test_changed_attributes_refresh_cached_original_css_without_altering_bytes(self):
        attrs=(self.base/'.gitattributes').read_text(encoding='utf-8')
        put(self.base,'.gitattributes',attrs+'*.css text eol=lf\n')
        original=b'body { color: blue; }\r\n/* original bytes */\r\n'
        file=self.base/'public/site/static/original.css';file.write_bytes(original)
        self.git('add','.gitattributes','public/site/static/original.css');self.git('commit','-qm','fixture old text attributes')
        self.assertEqual(self.git('show','HEAD:public/site/static/original.css'),original.replace(b'\r\n',b'\n'))
        # The working file still has CRLF and its stat entry is cached as clean under the old attributes.
        put(self.base,'.gitattributes',attrs+'*.css text eol=lf\npublic/site/static/original.css -text -eol\n')
        self.okay(self.ps('git-upload.ps1'))
        self.assertEqual(file.read_bytes(),original)
        self.assertEqual(self.git('show','HEAD:public/site/static/original.css'),original)
        from zipfile import ZipFile
        with ZipFile(self.base/'public/site/downloads/smtech-source.zip') as z:self.assertEqual(z.read('web/static/original.css'),original)
    def test_start_preflight_uses_configured_paths_and_python_outside_project(self):
        self.okay(self.ps('start.ps1','-Check','-Port','8097'));self.okay(self.ps('start.ps1','-NoBuild','-Check'))
        self.assertFalse((self.base/'public/site/downloads/smtech-source.zip').exists())
if __name__=='__main__':unittest.main()
