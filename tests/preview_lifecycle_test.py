"""Run only a loopback preview subprocess owned by this test."""
import json
import socket
import subprocess
import sys
import time
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
ROOT = Path(__file__).resolve().parents[1]

class PreviewLifecycleTest(unittest.TestCase):
    def test_only_valid_local_token_stops_own_preview_and_cleans_state(self):
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        state_file = ROOT / 'tmp' / ('rms-preview-%s.json' % port)
        process = subprocess.Popen([sys.executable, '-u', str(ROOT / 'tools/serve.py'), '--port', str(port)], cwd=str(ROOT / 'tmp'), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        try:
            for _ in range(100):
                if state_file.exists(): break
                if process.poll() is not None: self.fail('Preview startup failed')
                time.sleep(0.02)
            state = json.loads(state_file.read_text(encoding='utf-8'))
            self.assertEqual(Path(state['root']).resolve(), ROOT.resolve())
            self.assertEqual(state['pid'], process.pid)
            origin = 'http://127.0.0.1:%s' % port
            with urlopen(origin + '/region/rms/') as response:
                self.assertEqual(response.status, 200)
            with self.assertRaises(HTTPError) as denied:
                urlopen(Request(origin + '/__rms_preview__/stop', data=b'', headers={'X-RMS-Preview-Token': 'wrong'}))
            self.assertEqual(denied.exception.code, 403)
            self.assertIsNone(process.poll())
            with urlopen(Request(origin + '/__rms_preview__/stop', data=b'', headers={'X-RMS-Preview-Token': state['token']})) as response:
                self.assertEqual(json.loads(response.read().decode('utf-8')), {'stopping': True})
            self.assertEqual(process.wait(timeout=5), 0)
            self.assertFalse(state_file.exists())
        finally:
            if process.poll() is None:
                process.terminate()
                process.wait(timeout=5)
            process.communicate()
            if state_file.exists(): state_file.unlink()

if __name__ == '__main__': unittest.main()
