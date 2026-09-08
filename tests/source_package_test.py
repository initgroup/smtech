# -*- coding: utf-8 -*-
"""Source artifact and local HTTP checks. Uses only the Python standard library."""
from pathlib import Path
from zipfile import ZipFile
from io import BytesIO
import hashlib
import importlib.util
import json
import threading
import unittest
import os
import shutil
import subprocess
import tempfile
from urllib.request import urlopen

BASE = Path(__file__).resolve().parents[1]


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, str(path))
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


package = module('package_source', BASE / 'tools' / 'package_source.py')
server = module('serve', BASE / 'tools' / 'serve.py')


class SourcePackageTests(unittest.TestCase):
    def test_archive_matches_latest_source_and_is_reproducible(self):
        content = package.OUTPUT.read_bytes()
        self.assertEqual(content, package.archive_bytes())
        with ZipFile(BytesIO(content)) as archive:
            self.assertIsNone(archive.testzip())
            self.assertEqual(len(archive.namelist()), len(set(archive.namelist())))
            for name, entry in package.entries().items():
                self.assertEqual(archive.read(name), entry['data'])
            for name in archive.namelist():
                parts = Path(name).parts
                self.assertFalse(set(parts) & {'local', 'deliverables', '.git', '.venv', 'node_modules'})
                self.assertFalse(name.endswith('.zip'))
                self.assertFalse(name.startswith('/') or '..' in parts)
            for entry in json.loads(archive.read(package.MANIFEST).decode('utf-8'))['files']:
                value = archive.read(entry['path'])
                self.assertEqual(len(value), entry['bytes'])
                self.assertEqual(hashlib.sha256(value).hexdigest(), entry['sha256'])

    def test_upload_commits_and_pushes_exact_git_blobs_and_rejects_stale_zip(self):
        fixture_root = Path(tempfile.mkdtemp(prefix='git-source-', dir=str(BASE / 'tmp')))
        repo = fixture_root / 'smtech'
        repo.mkdir()
        (repo / 'tools').mkdir()
        (repo / 'prototype/region/rms/downloads').mkdir(parents=True)
        shutil.copyfile(str(BASE / 'tools/package_source.py'), str(repo / 'tools/package_source.py'))
        shutil.copyfile(str(BASE / 'git-upload.ps1'), str(repo / 'git-upload.ps1'))
        (repo / 'content.txt').write_bytes(b'Git source\r\n')
        (repo / '.gitattributes').write_text('*.txt text eol=lf\n', encoding='utf-8')
        (repo / 'local').mkdir()
        (repo / 'local/private.txt').write_text('must stay local', encoding='utf-8')
        remote = fixture_root / 'remote.git'
        env = dict(os.environ, GIT_AUTHOR_NAME='Source ZIP Test', GIT_COMMITTER_NAME='Source ZIP Test',
                   GIT_AUTHOR_EMAIL='test@example.invalid', GIT_COMMITTER_EMAIL='test@example.invalid')
        def run(args, success=True):
            proc = subprocess.run(args, cwd=str(repo), env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
            if success:
                self.assertEqual(proc.returncode, 0, proc.stdout.decode('utf-8', 'replace')[-2500:])
            return proc
        run(['git', 'init', '--bare', str(remote)])
        command = ['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '.\\git-upload.ps1', '-RemoteUrl', str(remote), '-Push']
        run(command)
        head = run(['git', 'rev-parse', 'HEAD']).stdout.strip()
        self.assertEqual(run(['git', '--git-dir=' + str(remote), 'rev-parse', 'refs/heads/main']).stdout.strip(), head)
        payload = run(['git', 'show', 'HEAD:' + package.ARCHIVE_PATH]).stdout
        with ZipFile(BytesIO(payload)) as archive:
            self.assertEqual(archive.read('content.txt'), b'Git source\n')
            self.assertNotIn('local/private.txt', archive.namelist())
            self.assertEqual(json.loads(archive.read(package.MANIFEST).decode('utf-8'))['source'], 'git')
        run(command)
        self.assertEqual(run(['git', 'rev-parse', 'HEAD']).stdout.strip(), head, 'No-change run must not create another commit')
        (repo / 'content.txt').write_bytes(b'new unstaged source\r\n')
        python = str(BASE / '.venv/Scripts/python.exe')
        run([python, 'tools/package_source.py', '--index'])
        self.assertEqual((repo / package.ARCHIVE_PATH).read_bytes(), payload, 'Archive must use staged bytes, not worktree bytes')
        run(['git', 'add', 'content.txt'])
        self.assertNotEqual(run([python, 'tools/package_source.py', '--verify-index'], success=False).returncode, 0)

    def test_http_source_download_and_entrypoint(self):
        class QuietHandler(server.Handler):
            def log_message(self, *args):
                pass
        http = server.ThreadingHTTPServer(('127.0.0.1', 0), QuietHandler)
        thread = threading.Thread(target=http.serve_forever)
        thread.daemon = True
        thread.start()
        base_url = 'http://127.0.0.1:{}/region/rms/'.format(http.server_port)
        try:
            with urlopen(base_url, timeout=5) as response:
                self.assertEqual(response.status, 200)
                self.assertIn(b'downloads/smtech-source.zip', response.read())
            with urlopen(base_url + 'downloads/smtech-source.zip', timeout=10) as response:
                self.assertEqual(response.status, 200)
                self.assertEqual(response.read(), package.OUTPUT.read_bytes())
            for file in ['data/seed.json', 'static/js/rms-enhance/core.js',
                         'static/js/rms-enhance/views.js', 'static/js/rms-enhance/app.js',
                         'static/css/rms-demo-shell.css', 'static/css/rms-enhance.css']:
                with urlopen(base_url + file, timeout=5) as response:
                    self.assertEqual(response.status, 200)
                    self.assertGreater(len(response.read()), 0)
        finally:
            http.shutdown()
            http.server_close()
            thread.join(timeout=5)


if __name__ == '__main__':
    unittest.main()
