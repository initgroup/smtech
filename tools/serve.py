"""Loopback-only static preview with token-protected local lifecycle control."""
from http.server import SimpleHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn
from pathlib import Path
import argparse
import json
import hmac
import os
import secrets
import threading

BASE = Path(__file__).resolve().parents[1]
CONFIG = json.loads((BASE/'tools/project-config.json').read_text(encoding='utf-8'))
ROOT = (BASE/CONFIG['serveRoot']).resolve()
ROOT.relative_to(BASE.resolve())
ENTRY = CONFIG['servePath']

class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def translate_path(self, path):
        # Python 3.6-compatible equivalent of SimpleHTTPRequestHandler(directory=...).
        from urllib.parse import unquote, urlsplit
        parts = unquote(urlsplit(path).path).split('/')
        target = ROOT
        for part in parts:
            if not part or part in ('.', '..') or ':' in part or '\\' in part:
                continue
            target = target / part
        return str(target)

    def do_GET(self):
        if self.path in ('/', ENTRY.rstrip('/')):
            self.send_response(302)
            self.send_header('Location', ENTRY)
            self.end_headers()
            return
        super().do_GET()

    def do_POST(self):
        if self.path != '/__rms_preview__/stop':
            self.send_error(404)
            return
        provided = self.headers.get('X-RMS-Preview-Token', '')
        if not hmac.compare_digest(provided, self.server.control_token):
            self.send_error(403)
            return
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(b'{"stopping":true}')
        # shutdown must run outside the serve_forever thread.
        threading.Thread(target=self.server.shutdown, daemon=True).start()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=CONFIG['defaultPort'])
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    actual_port = server.server_address[1]
    server.control_token = secrets.token_hex(32)
    state_dir = BASE / 'tmp'
    state_dir.mkdir(exist_ok=True)
    state_file = state_dir / ('rms-preview-' + str(actual_port) + '.json')
    state_file.write_text(json.dumps({'root': str(BASE.resolve()), 'port': actual_port,
        'pid': os.getpid(), 'token': server.control_token}), encoding='utf-8')
    print(f'RMS prototype: http://127.0.0.1:{actual_port}{ENTRY}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        try:
            state = json.loads(state_file.read_text(encoding='utf-8'))
            if state.get('token') == server.control_token:
                state_file.unlink()
        except (OSError, ValueError):
            pass
