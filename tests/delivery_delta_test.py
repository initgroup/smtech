# -*- coding: utf-8 -*-
import importlib.util,json,tempfile,unittest
from pathlib import Path
from zipfile import ZipFile
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('delivery_delta',ROOT/'tools/delivery/delivery_delta.py');delta=importlib.util.module_from_spec(spec);spec.loader.exec_module(delta)
def package(path,version,files):
    manifest={'format':'rms-developer','version':version,'files':[{'path':n,'sha256':delta.sha(d)} for n,d in files.items()]}
    with ZipFile(path,'w') as z:
        for n,d in files.items():z.writestr(n,d)
        z.writestr('release-manifest.json',json.dumps(manifest))
class DeltaTest(unittest.TestCase):
    def test_changed_only_payload_protects_integration_and_reports_conflicts_without_writing(self):
        with tempfile.TemporaryDirectory() as folder:
            base=Path(folder);before={'web/index.html':b'old shell','web/static/a.js':b'old','web/static/remove.js':b'old','web/integration/config.js':b'internal old'};after={'web/index.html':b'new shell','web/static/a.js':b'new','web/static/add.js':b'new','web/integration/config.js':b'internal new'}
            package(base/'old.zip','1.1.0',before);package(base/'new.zip','1.1.1',after);report=delta.build(base/'old.zip',base/'new.zip',base/'delta.zip')
            names={r['path'] for r in report['changes']};self.assertNotIn('web/integration/config.js',names);self.assertEqual(len(names),5);self.assertIn('release-manifest.json',names)
            target=base/'target'
            for name,data in before.items():p=target/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
            (target/'web/static/a.js').write_bytes(b'internal edit');snapshot={p.relative_to(target):p.read_bytes() for p in target.rglob('*') if p.is_file()}
            review=delta.review(base/'delta.zip',target);statuses={r['path']:r for r in review['results']}
            self.assertEqual(statuses['web/static/a.js']['status'],'conflict-local-modification');self.assertTrue(statuses['web/index.html']['manualMerge']);self.assertEqual(statuses['web/static/remove.js']['change'],'delete')
            self.assertEqual(snapshot,{p.relative_to(target):p.read_bytes() for p in target.rglob('*') if p.is_file()})
    def test_hash_tampering_and_unsafe_paths_are_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            file=Path(folder)/'bad.zip';package(file,'1.1.0',{'../escape.js':b'x'})
            with self.assertRaisesRegex(ValueError,'Unsafe'):delta.read(file)
            package(file,'1.1.0',{'web/a.js':b'x'})
            with ZipFile(file,'a') as z:z.writestr('web/a.js',b'tampered')
            with self.assertRaisesRegex(ValueError,'Duplicate'):delta.read(file)
if __name__=='__main__':unittest.main()
