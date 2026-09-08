"""Serve only prototype/ on loopback; no production requests or write endpoints."""
from http.server import SimpleHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn
from pathlib import Path
import argparse

ROOT = Path(__file__).resolve().parents[1] / 'prototype'

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
        if self.path in ('/', '/region/rms'):
            self.send_response(302)
            self.send_header('Location', '/region/rms/')
            self.end_headers()
            return
        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8080)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    print(f'RMS prototype: http://127.0.0.1:{args.port}/region/rms/', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
