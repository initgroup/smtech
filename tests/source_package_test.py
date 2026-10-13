# -*- coding: utf-8 -*-
import importlib.util, json, tempfile, unittest, subprocess
from pathlib import Path
from io import BytesIO
from zipfile import ZipFile
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('developer_package',ROOT/'tools/package_source.py');pkg=importlib.util.module_from_spec(spec);spec.loader.exec_module(pkg)

def put(base,name,value):
    p=base/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(value,encoding='utf-8')
def fixture(base):
    policy={'formatVersion':1,'trees':[{'source':'websrc','target':'web'}],'files':[],'watch':['websrc','demo','releases/developer-package.json','releases/next.json']}
    put(base,'releases/developer-package.json',json.dumps(policy));put(base,'releases/history.json',json.dumps({'formatVersion':1,'releases':[{'version':'1.0.0','date':'2026-10-08','legacy':True,'title':'Legacy','changes':['Legacy project'],'migration':'Use new web root'}]}));put(base,'releases/next.json',json.dumps({'title':'Clean delivery','changes':['Physical demo split'],'migration':'Merge owned files'}))
    put(base,'websrc/index.html','<main>Business</main>');put(base,'websrc/static/app.js','window.business = true;');put(base,'websrc/integration/config.js','window.server = true;');put(base,'demo/tools.js','window.RMSDemo = true;')

class DeveloperPackageTest(unittest.TestCase):
    def test_real_allowed_sources_have_no_demo_and_all_entry_assets_exist(self):
        policy,sources=pkg.read_sources(ROOT);files=pkg.collect(policy,sources)
        self.assertIn('00_먼저읽기_개발자이식안내.md',files);self.assertIn('web/index.html',files)
        self.assertFalse(any('/demo/' in n or 'sfr' in n.lower() for n in files))
        self.assertFalse(any(n.endswith('.xml') or 'demo-store' in n for n in files))
        import re
        for asset in re.findall(r'(?:src|href)="([^"]+)"',files['web/index.html'].decode()):
            if not asset.startswith('#'): self.assertIn('web/'+asset,files,asset)
    def test_version_increments_only_on_change_and_preserves_old_archive(self):
        with tempfile.TemporaryDirectory() as folder:
            base=Path(folder);fixture(base);first,h=pkg.build(base);self.assertEqual(h['releases'][0]['version'],'1.1.0')
            again,h=pkg.build(base);self.assertEqual(again,first);self.assertEqual(len(h['releases']),2)
            old=base/pkg.WEB/'downloads/releases/rms-developer-v1.1.0.zip'
            put(base,'websrc/static/app.js','window.business = 2;');second,h=pkg.build(base)
            self.assertEqual(h['releases'][0]['version'],'1.1.1');self.assertNotEqual(first,second);self.assertEqual(old.read_bytes(),first)
            with ZipFile(BytesIO(second)) as z:
                self.assertIn('v1.1.0',z.read('01_배포내역.md').decode());self.assertEqual(json.loads(z.read(pkg.MANIFEST))['version'],'1.1.1')
    def test_demo_only_change_also_creates_release_but_never_enters_developer_zip(self):
        with tempfile.TemporaryDirectory() as folder:
            base=Path(folder);fixture(base);pkg.build(base);put(base,'demo/tools.js','window.RMSDemo = 2;');content,h=pkg.build(base)
            self.assertEqual(h['releases'][0]['version'],'1.1.1')
            with ZipFile(BytesIO(content)) as z: self.assertFalse(any('demo' in n for n in z.namelist()))
    def test_runtime_leak_fails_before_release_is_recorded(self):
        with tempfile.TemporaryDirectory() as folder:
            base=Path(folder);fixture(base);before=(base/pkg.HISTORY).read_bytes();put(base,'websrc/static/app.js','window.RMSRequirements = [];')
            with self.assertRaisesRegex(ValueError,'Demo runtime leaked'): pkg.build(base)
            self.assertEqual(before,(base/pkg.HISTORY).read_bytes());self.assertFalse((base/pkg.ARCHIVE_PATH).exists())
    def test_immutable_archive_and_explicit_version_guards(self):
        with tempfile.TemporaryDirectory() as folder:
            base=Path(folder);fixture(base);pkg.build(base);old=base/pkg.WEB/'downloads/releases/rms-developer-v1.1.0.zip';old.write_bytes(b'tampered')
            with self.assertRaisesRegex(ValueError,'Immutable'): pkg.build(base)
            put(base,'websrc/static/app.js','window.business=3;')
            with self.assertRaisesRegex(ValueError,'Version must increase'): pkg.build(base,version='1.0.0')
    def test_index_verification_uses_staged_blobs_and_rejects_staged_unreleased_changes(self):
        with tempfile.TemporaryDirectory() as folder:
            base=Path(folder);fixture(base);content,h=pkg.build(base)
            subprocess.run(['git','init','-q'],cwd=base,check=True);subprocess.run(['git','add','.'],cwd=base,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
            put(base,'websrc/static/app.js','unstaged-change');policy,sources=pkg.read_sources(base,'index');pkg.verify(content,policy,sources,json.loads(sources[pkg.HISTORY]))
            subprocess.run(['git','add','websrc/static/app.js'],cwd=base,check=True)
            policy,sources=pkg.read_sources(base,'index')
            with self.assertRaisesRegex(ValueError,'Sources changed'): pkg.verify(content,policy,sources,json.loads(sources[pkg.HISTORY]))
            for file in (base/'.git').rglob('*'):
                if file.is_file(): file.chmod(0o600)
    def test_three_design_archives_apply_css_and_preserve_shared_sources_and_rebuild_bytes(self):
        with tempfile.TemporaryDirectory() as folder:
            base=Path(folder);fixture(base)
            for design in (1,2,3):
                put(base,'websrc/static/css/themes/rms-design'+str(design)+'.css','body { color: color'+str(design)+'; }')
            put(base,'websrc/static/css/rms-selected-design.css','body { color: default; }')
            content,history=pkg.build(base);current=history['releases'][0]
            self.assertEqual([v['design'] for v in current['designArchives']],[1,2,3])
            with ZipFile(BytesIO(content)) as z:common={name:z.read(name) for name in z.namelist()}
            snapshots=[]
            for variant in current['designArchives']:
                design=variant['design'];archive=base/pkg.WEB/variant['download'];data=archive.read_bytes();snapshots.append(data)
                self.assertEqual(pkg.sha(data),variant['archiveSha256'])
                self.assertEqual((base/pkg.WEB/('downloads/smtech-source-design'+str(design)+'.zip')).read_bytes(),data)
                self.assertEqual(archive.with_suffix('.zip.sha256').read_text().split()[0],pkg.sha(data))
                self.assertEqual(data,pkg.design_archive_bytes(content,design))
                self.assertEqual(pkg.verify_manifest(data)['selectedDesign'],design)
                with ZipFile(BytesIO(data)) as z:
                    self.assertEqual(z.read('web/static/css/rms-selected-design.css'),common['web/static/css/themes/rms-design'+str(design)+'.css'])
                    for name,source in common.items():
                        if name not in {pkg.MANIFEST,'web/static/css/rms-selected-design.css'}:self.assertEqual(z.read(name),source,name)
                    self.assertNotIn(b'rms-demo-tools',z.read('web/index.html'))
            self.assertEqual(len(set(snapshots)),3)
            again,second=pkg.build(base);self.assertEqual(content,again);self.assertEqual(current,second['releases'][0])
            for variant,data in zip(current['designArchives'],snapshots):self.assertEqual((base/pkg.WEB/variant['download']).read_bytes(),data)
            archive=base/pkg.WEB/current['designArchives'][1]['download'];archive.write_bytes(b'tampered')
            with self.assertRaisesRegex(ValueError,'Immutable'):pkg.build(base)

    def test_design_alias_and_sidecar_are_verified_from_the_staged_snapshot(self):
        with tempfile.TemporaryDirectory() as folder:
            base=Path(folder);fixture(base)
            for design in (1,2,3):put(base,'websrc/static/css/themes/rms-design'+str(design)+'.css','body { color: color'+str(design)+'; }')
            put(base,'websrc/static/css/rms-selected-design.css','body {}')
            content,history=pkg.build(base)
            subprocess.run(['git','init','-q'],cwd=base,check=True)
            subprocess.run(['git','add','.'],cwd=base,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
            pkg.verify_git_artifacts(base,'index',None,history,content)
            alias=pkg.WEB+'downloads/smtech-source-design2.zip';(base/alias).write_bytes(b'tampered')
            subprocess.run(['git','add',alias],cwd=base,check=True)
            with self.assertRaisesRegex(ValueError,'Latest design ZIP alias differs'):pkg.verify_git_artifacts(base,'index',None,history,content)
            for file in (base/'.git').rglob('*'):
                if file.is_file():file.chmod(0o600)

if __name__=='__main__': unittest.main()
