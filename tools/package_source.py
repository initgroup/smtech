# -*- coding: utf-8 -*-
"""Full source ZIP. Uploads use staged Git blobs, previews use working files."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
from io import BytesIO
import argparse
import hashlib
import json
import subprocess

BASE = Path(__file__).resolve().parents[1]
WEB = BASE / 'prototype' / 'region' / 'rms'
ARCHIVE_PATH = 'prototype/region/rms/downloads/smtech-source.zip'
OUTPUT = BASE / ARCHIVE_PATH
MANIFEST = '_smtech_source_manifest.json'
FORBIDDEN = {'local', 'deliverables', '.git', '.venv', 'node_modules', 'tmp', '__pycache__'}


def git(*args):
    return subprocess.check_output(['git'] + list(args), cwd=str(BASE))


def check_name(name):
    if name == ARCHIVE_PATH:
        return False
    parts = Path(name).parts
    if (name == MANIFEST or name.endswith('.zip.tmp') or name.startswith('/')
            or '..' in parts or any(part.lower() in FORBIDDEN for part in parts)):
        raise ValueError('Excluded or reserved path is tracked: ' + name)
    return True


def read_blobs(oids):
    unique = sorted(set(oids))
    result = {}
    if not unique:
        return result
    process = subprocess.Popen(['git', 'cat-file', '--batch'], cwd=str(BASE),
                               stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    output, error = process.communicate(('\n'.join(unique) + '\n').encode('ascii'))
    if process.returncode:
        raise RuntimeError(error.decode('utf-8', 'replace'))
    offset = 0
    for oid in unique:
        end = output.index(b'\n', offset)
        header = output[offset:end].decode('ascii').split()
        if len(header) != 3 or header[0] != oid or header[1] != 'blob':
            raise ValueError('Expected Git blob: ' + oid)
        size = int(header[2])
        result[oid] = output[end + 1:end + 1 + size]
        offset = end + size + 2
    return result


def entries(source='worktree', ref=None):
    records = []
    if source == 'worktree':
        names = set(git('ls-files', '--cached', '--others', '--exclude-standard', '-z').decode('utf-8').split('\0'))
        result = {}
        for name in sorted(filter(None, names)):
            if not check_name(name):
                continue
            file = BASE / name
            if not file.exists():
                continue
            if not file.is_file() or file.resolve() != file.absolute():
                raise ValueError('Unsupported source path: ' + name)
            result[name] = {'data': file.read_bytes(), 'mode': '100644'}
        return result
    if source == 'index':
        for row in git('ls-files', '--stage', '-z').split(b'\0'):
            if not row:
                continue
            info, name = row.split(b'\t', 1)
            mode, oid, stage = info.decode('ascii').split()
            if stage != '0':
                raise ValueError('Resolve Git conflicts before packaging')
            records.append((name.decode('utf-8'), mode, oid))
    else:
        for row in git('ls-tree', '-rz', ref).split(b'\0'):
            if not row:
                continue
            info, name = row.split(b'\t', 1)
            mode, kind, oid = info.decode('ascii').split()
            if kind != 'blob':
                raise ValueError('Submodules must be packaged separately')
            records.append((name.decode('utf-8'), mode, oid))
    records = [(name, mode, oid) for name, mode, oid in records if check_name(name)]
    if any(mode not in ('100644', '100755') for _, mode, _ in records):
        raise ValueError('Only regular Git source files are supported')
    blobs = read_blobs(oid for _, _, oid in records)
    return {name: {'data': blobs[oid], 'mode': mode, 'gitBlob': oid} for name, mode, oid in records}


def manifest_for(files, source):
    records = []
    for name, entry in sorted(files.items()):
        item = {'path': name, 'mode': entry['mode'], 'bytes': len(entry['data']),
                'sha256': hashlib.sha256(entry['data']).hexdigest()}
        if 'gitBlob' in entry:
            item['gitBlob'] = entry['gitBlob']
        records.append(item)
    return {'source': 'working-tree-preview' if source == 'worktree' else 'git',
            'excluded': [ARCHIVE_PATH, '.git/'], 'files': records}


def archive_bytes(source='worktree', ref=None):
    files = entries(source, ref)
    manifest = json.dumps(manifest_for(files, source), ensure_ascii=False, indent=2).encode('utf-8')
    payload = dict(files)
    payload[MANIFEST] = {'data': manifest, 'mode': '100644'}
    buffer = BytesIO()
    with ZipFile(buffer, 'w', ZIP_DEFLATED) as archive:
        for name, entry in sorted(payload.items()):
            info = ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = (0o755 if entry['mode'] == '100755' else 0o644) << 16
            archive.writestr(info, entry['data'])
    return buffer.getvalue()


def verify_archive(content, source, ref=None):
    files = entries(source, ref)
    with ZipFile(BytesIO(content)) as archive:
        if set(archive.namelist()) != set(files) | {MANIFEST} or len(archive.namelist()) != len(files) + 1:
            raise ValueError('ZIP file list differs from Git source')
        if json.loads(archive.read(MANIFEST).decode('utf-8')) != manifest_for(files, source):
            raise ValueError('ZIP manifest differs from Git source')
        for name, entry in files.items():
            if archive.read(name) != entry['data']:
                raise ValueError('ZIP content differs from Git source: ' + name)
        if archive.testzip() is not None:
            raise ValueError('ZIP integrity error')
    print('Verified {} source files: {}'.format(len(files), source))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument('--index', action='store_true', help='Build from staged Git blobs')
    modes.add_argument('--verify-index', action='store_true', help='Verify staged ZIP against staged source')
    modes.add_argument('--verify-ref', metavar='REF', help='Verify ZIP and source from one Git commit')
    args = parser.parse_args()
    if args.verify_ref:
        ref = git('rev-parse', '--verify', args.verify_ref + '^{commit}').decode('ascii').strip()
        verify_archive(git('show', ref + ':' + ARCHIVE_PATH), 'ref', ref)
        return
    if args.verify_index:
        verify_archive(git('show', ':' + ARCHIVE_PATH), 'index')
        return
    source = 'index' if args.index else 'worktree'
    content = archive_bytes(source)
    OUTPUT.parent.mkdir(exist_ok=True)
    if not OUTPUT.exists() or OUTPUT.read_bytes() != content:
        temporary = OUTPUT.with_suffix('.zip.tmp')
        temporary.write_bytes(content)
        temporary.replace(OUTPUT)
    verify_archive(content, source)
    print('Source ZIP: {} bytes ({})'.format(len(content), source))


if __name__ == '__main__':
    main()
