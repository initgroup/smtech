# -*- coding: utf-8 -*-
"""Delta package safety and integration conflict tests; no live intranet modifications."""
from pathlib import Path
from zipfile import ZipFile
import hashlib
import importlib.util
import json
import tempfile
import unittest

BASE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('publisher', str(BASE / 'tools/legacy_publisher_delta.py'))
publisher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publisher)


def write(root, name, value):
    file = root / name
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(value, encoding='utf-8')
    return file


class PublisherTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='publisher-', dir=str(BASE / 'tmp'))
        self.base = Path(self.tmp.name) / 'source'
        self.target = Path(self.tmp.name) / 'target'
        self.base.mkdir()
        self.target.mkdir()
        self.policy = {'release': 'test', 'protectedPrefixes': ['integration/', 'local/'],
                       'rules': [{'prefix': 'prototype/region/rms/', 'owner': 'publisher', 'review': 'hash-compare'},
                                 {'prefix': 'README.md', 'owner': 'documentation', 'review': 'reference-only'}]}
        write(self.base, 'releases/ownership.json', json.dumps(self.policy))
        self.file = 'prototype/region/rms/templates/page.html'
        self.deleted = 'prototype/region/rms/static/js/rms-enhance/old.js'
        self.added = 'prototype/region/rms/static/css/rms-new.css'
        write(self.base, self.file, '<h1>new</h1>')
        write(self.base, self.added, '.rms-enhance { color: blue; }')
        write(self.base, 'integration/private.js', 'INTERNAL MUST NOT SHIP')
        self.baseline = Path(self.tmp.name) / 'before.json'
        self.baseline.write_text(json.dumps({'files': [{'path': self.file, 'sha256': publisher.sha(b'<h1>old</h1>')},
                                                     {'path': self.deleted, 'sha256': publisher.sha(b'old js')}]}), encoding='utf-8')
        self.output = Path(self.tmp.name) / 'changes.zip'

    def tearDown(self):
        self.tmp.cleanup()

    def test_changed_files_and_deletion_manifest_are_reproducible_and_exclude_internal_code(self):
        report = publisher.build(self.baseline, self.output, self.base)
        first = self.output.read_bytes()
        publisher.build(self.baseline, self.output, self.base)
        self.assertEqual(first, self.output.read_bytes())
        changes = {row['path']: row['change'] for row in report['changes']}
        self.assertEqual(changes, {self.file: 'modify', self.added: 'add', self.deleted: 'delete'})
        with ZipFile(self.output) as archive:
            self.assertNotIn(self.deleted, archive.namelist())
            self.assertNotIn('integration/private.js', archive.namelist())
            self.assertIsNone(archive.testzip())
            self.assertEqual(archive.read(self.file), b'<h1>new</h1>')

    def test_review_detects_internal_conflicts_without_writing_or_deleting_target_files(self):
        publisher.build(self.baseline, self.output, self.base)
        write(self.target, self.file, '<h1>internal backend edit</h1>')
        write(self.target, self.deleted, 'old js')
        before = {p.relative_to(self.target).as_posix(): p.read_bytes() for p in self.target.rglob('*') if p.is_file()}
        result = publisher.review(self.output, self.target)
        status = {r['path']: r['status'] for r in result['results']}
        self.assertEqual(status[self.file], 'conflict-local-modification')
        self.assertEqual(status[self.added], 'ready-for-review')
        self.assertEqual(status[self.deleted], 'ready-for-review')
        after = {p.relative_to(self.target).as_posix(): p.read_bytes() for p in self.target.rglob('*') if p.is_file()}
        self.assertEqual(before, after)
        write(self.target, self.file, '<h1>new</h1>')
        self.assertEqual(next(r['status'] for r in publisher.review(self.output, self.target)['results'] if r['path'] == self.file), 'already-current')

    def test_next_delta_contains_only_later_changes_and_unchanged_files_do_not_repeat(self):
        publisher.build(self.baseline, self.output, self.base)
        second = Path(self.tmp.name) / 'second.zip'
        report = publisher.build(self.output, second, self.base)
        self.assertEqual(report['changes'], [])
        write(self.base, self.file, '<h1>next</h1>')
        report = publisher.build(self.output, second, self.base)
        self.assertEqual([r['path'] for r in report['changes']], [self.file])
        with ZipFile(second) as archive:
            patch = archive.read('_publisher_changes.diff').decode('utf-8')
            self.assertIn('<h1>new</h1>', patch)
            self.assertIn('<h1>next</h1>', patch)

    def test_unsafe_paths_and_protected_roots_are_never_package_candidates(self):
        for name in ['../outside', '/absolute', 'C:/Windows/file', 'folder\\file']:
            with self.assertRaises(ValueError):
                publisher.safe_name(name)
        self.assertIsNone(publisher.rule_for('integration/local-adapter.js', self.policy))
        self.assertIsNone(publisher.rule_for('local/private.txt', self.policy))

    def test_real_policy_excludes_internal_and_generated_mirrors_but_marks_shell_and_contract_for_merge(self):
        policy = json.loads((BASE / 'releases/ownership.json').read_text(encoding='utf-8'))
        for name in ['integration/auth.js', 'handoff/static/js/rms-enhance/app.js', 'prototype/region/rms/downloads/smtech-source.zip']:
            self.assertIsNone(publisher.rule_for(name, policy))
        for name in ['prototype/region/rms/index.html', 'prototype/region/rms/contracts/commands.json']:
            self.assertEqual(publisher.rule_for(name, policy)['review'], 'manual-merge')


if __name__ == '__main__':
    unittest.main()
