"""Create a traceable catalog retaining requirement IDs exactly as printed in RFP."""
from pathlib import Path
import collections
import json
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'reference' / 'documents'
text = (OUT / 'rfp.txt').read_text(encoding='utf-8')
matches = list(re.finditer(r'요구사항 고유번호\n([A-Z]{3}-\d+)\n요구사항 명칭\n([^\n]+)', text))
seen = collections.Counter()
items = []
for index, match in enumerate(matches):
    identifier, name = match.groups()
    seen[identifier] += 1
    end = matches[index + 1].start() if index + 1 < len(matches) else text.find('Ⅲ.', match.end())
    if end < 0: end = len(text)
    body = text[match.end():end]
    definition = re.search(r'\n정의\n(.*?)\n세부내용\n', body, re.S)
    detail = re.search(r'\n세부내용\n(.*?)\n산출정보', body, re.S)
    output = re.search(r'\n산출정보\n(.*?)\n관련요구사항', body, re.S)
    items.append({
        'sourceId': identifier,
        'catalogKey': identifier if seen[identifier] == 1 else f'{identifier}#{seen[identifier]}',
        'name': name,
        'sourceTextLine': text.count('\n', 0, match.start()) + 2,
        'definition': definition.group(1).strip() if definition else '',
        'details': detail.group(1).strip().splitlines() if detail else [],
        'deliverables': output.group(1).strip() if output else '',
    })
report = {
    'source': 'rfp.txt',
    'declaredTotal': 70,
    'actualDetailRecords': len(items),
    'actualCategoryCounts': dict(collections.Counter(x['sourceId'].split('-')[0] for x in items)),
    'duplicateSourceIds': {key: count for key, count in seen.items() if count > 1},
    'notes': ['원본 총괄표와 상세표 수량이 다름. COR-02는 표준 프레임 워크 적용과 기존 시스템 호환에 중복됨.', 'SER-9, PMR-9는 원문 표기를 유지함. 내부 정규화가 필요하면 원본 ID와 별도 필드를 사용한다.'],
    'requirements': items,
}
(OUT / 'requirements-catalog.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
rows = ['# 제안요청서 전체 요구사항 색인', '', '원본 총괄표는 70건, 상세 요구사항은 71건입니다. COR-02 중복을 임의로 고치지 않고 내부 관리키로 구분했습니다.', '', '| 원본 ID | 내부 관리키 | 요구사항 명칭 | 추출 본문 줄 |', '|---|---|---|---:|']
rows.extend(f"| {x['sourceId']} | {x['catalogKey']} | {x['name']} | {x['sourceTextLine']} |" for x in items)
(OUT / 'requirements-index.md').write_text('\n'.join(rows) + '\n', encoding='utf-8')
print(f'Cataloged {len(items)} requirement records; duplicate IDs: {dict((k,v) for k,v in seen.items() if v>1)}')
