"""Extract readable, sanitized paragraph text from HWP v5 without modifying originals."""
from pathlib import Path
import json
import re
import struct
import zlib
import olefile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'reference' / 'documents'
OUT.mkdir(parents=True, exist_ok=True)

def sanitize(text):
    # Do not reproduce server addresses, personal contact details, or credentials.
    text = re.sub(r'\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b', '[서버 IP 비공개]', text)
    text = re.sub(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', '[이메일 비공개]', text)
    text = re.sub(r'(?i)((?:password|passwd|pwd|비밀번호|패스워드)\s*[:=]\s*)\S+', r'\1[비공개]', text)
    text = re.sub(r'(?i)((?:username|사용 계정|계정 정보|계정|ID)\s*[:=]\s*)[^,\n]+', r'\1[계정 비공개]', text)
    text = re.sub(r'(?i)^[a-z_][a-z_0-9]*(?:,\s*[a-z_][a-z_0-9]*)+$', '[계정 목록 비공개]', text)
    text = re.sub(r'([가-힣 ]*계정\s+)[A-Za-z_][\w]*', r'\1[계정 비공개]', text)
    text = re.sub(r'\b\d{2,3}-\d{3,4}-\d{4}\b', '[전화번호 비공개]', text)
    return text

def decode_paragraph(data):
    vals = struct.unpack('<' + 'H' * (len(data)//2), data[:len(data)//2*2])
    out = []
    i = 0
    # HWP paragraph control codes that occupy 8 UTF-16 code units.
    extended = {1,2,3,4,5,6,7,8,9,11,12,14,15,16,17,18,19,20,21,22,23}
    while i < len(vals):
        val = vals[i]
        if val in extended:
            if val == 9: out.append('\t')
            i += 8
        else:
            if val == 10: out.append('\n')
            elif val == 13: pass
            elif val >= 32: out.append(chr(val))
            i += 1
    return sanitize(''.join(out).encode('utf-16-le', errors='surrogatepass').decode('utf-16-le', errors='replace'))

def extract(path):
    paragraphs = []
    with olefile.OleFileIO(path) as ole:
        header = ole.openstream('FileHeader').read()
        compressed = bool(struct.unpack('<I', header[36:40])[0] & 1)
        sections = sorted((x for x in ole.listdir() if x[0] == 'BodyText'), key=lambda x: int(re.search(r'\d+', x[-1]).group()))
        for section in sections:
            raw = ole.openstream(section).read()
            if compressed: raw = zlib.decompress(raw, -15)
            offset = 0
            while offset + 4 <= len(raw):
                head = struct.unpack_from('<I', raw, offset)[0]
                offset += 4
                tag = head & 0x3ff
                level = (head >> 10) & 0x3ff
                size = head >> 20
                if size == 0xfff:
                    size = struct.unpack_from('<I', raw, offset)[0]
                    offset += 4
                data = raw[offset:offset+size]
                offset += size
                if tag == 67:
                    text = decode_paragraph(data).strip()
                    if text:
                        paragraphs.append({'section': section[-1], 'level': level, 'text': text})
        streams = ['/'.join(x) for x in ole.listdir()]
    stem = 'rfp' if path.name.startswith('붙임2') else 'operations-manual'
    (OUT / f'{stem}.txt').write_text('\n'.join(p['text'] for p in paragraphs), encoding='utf-8')
    (OUT / f'{stem}.paragraphs.json').write_text(json.dumps(paragraphs, ensure_ascii=False, indent=2), encoding='utf-8')
    return {'source': path.name, 'output': str(OUT / f'{stem}.txt'), 'paragraph_count': len(paragraphs), 'compressed': compressed, 'embedded_objects': sum(s.startswith('BinData/') for s in streams)}

if __name__ == '__main__':
    results = [extract(path) for path in ROOT.glob('*.hwp')]
    (OUT / 'extraction-manifest.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(results, ensure_ascii=False, indent=2))
