# -*- coding: utf-8 -*-
"""Create local, reviewable prototype/publisher packages without original private documents."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

base = Path(__file__).resolve().parents[1]
out = base / 'deliverables'
out.mkdir(exist_ok=True)

def add_tree(archive, directory, prefix):
    for file in sorted(directory.rglob('*')):
        if file.is_file():
            archive.write(str(file), str(Path(prefix) / file.relative_to(directory)))

prototype_note = '''# RMS 로컬 프로토타입\n\n압축 해제 후 터미널에서 python tools/serve.py 를 실행하고\nhttp://127.0.0.1:8080/region/rms/ 에 접속하세요.\nNode/npm/DB 설치는 필요하지 않습니다.\n\n상단 사용자 역할로 지원기업/충남TP/관리자를 선택할 수 있습니다.\nJSON 저장/불러오기로 상태를 옮깁니다. 첨부는 파일명·크기만 저장합니다.\n모든 기업·전문가·공고·서류는 가상이며 실제 RMS와 연결되지 않습니다.\n\n분석자료 원본과 검증 도구는 D:/work/smtech 작업 폴더에 별도로 보관합니다.\n문서의 reference/ 링크는 전체 작업 폴더 기준입니다.\n'''
with ZipFile(str(out/'RMS_프로토타입.zip'),'w',ZIP_DEFLATED) as z:
    add_tree(z,base/'prototype','prototype')
    z.write(str(base/'tools/serve.py'),'tools/serve.py')
    z.write(str(base/'start.ps1'),'start.ps1')
    z.write(str(base/'docs/03-prototype-guide.md'),'시연가이드.md')
    z.writestr('README.md',prototype_note)

with ZipFile(str(out/'RMS_퍼블리싱_인계.zip'),'w',ZIP_DEFLATED) as z:
    add_tree(z,base/'handoff','handoff')
    z.write(str(base/'docs/04-developer-handoff.md'),'docs/04-developer-handoff.md')
    z.write(str(base/'docs/01-business-requirements.md'),'docs/01-business-requirements.md')
    z.writestr('README.md','화면별 HTML 12개와 신규 CSS/JS 인계본입니다.\n먼저 handoff/README.md 및 docs/04-developer-handoff.md를 읽어 주세요.\n실행 가능한 전체 시연은 RMS_프로토타입.zip에 있습니다.\n원문·공개 소스 분석 자료는 전체 작업 폴더의 reference/에 별도 보관합니다.\n')

for file in out.glob('*.zip'):
    with ZipFile(str(file)) as z:
        assert z.testzip() is None
        print('{}: {} files, {} bytes, integrity OK'.format(file.name,len(z.namelist()),file.stat().st_size))
