"""Regenerate fictional demonstration records. No production data is used."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
codes = []
for kind, entries in {
    'industry': [('I01','기계·소재',''),('I02','바이오·의료',''),('I03','정보통신','')],
    'technology': [('T01','제조기술',''),('T02','스마트공정','T01'),('T03','소재분석','T01'),('T04','바이오 공정',''),('T05','인공지능','')],
    'consultation': [('C01','기술애로'),('C02','사업화'),('C03','품질·인증')],
    'institution': [('O01','대학'),('O02','연구기관'),('O03','민간기업')],
    'region': [('R01','충남'),('R02','대전'),('R03','충북'),('R04','세종'),('R05','경북'),('R06','부산')],
    'reason': [('S01','산업 현장 경험'),('S02','전문기술 보유')],
    'work': [('W01','로그인'),('W02','사업신청'),('W03','사업관리'),('W04','기술닥터')]
}.items():
    for e in entries:
        codes.append(dict(id=e[0],name=e[1],parentId=e[2] if len(e)>2 else '',kind=kind,active=True,visible=True))

names = ['김가람','이서준','박지온','최도윤','정하린','오유진','한시우','강다온']
orgs = ['가상 충남산업대학교','가상 대전소재연구원','가상 충북바이오센터','가상 세종AI연구소','가상 경북제조연구원','가상 부산기술대학교','가상 충남품질연구원','가상 대전테크랩']
regions = ['충남','대전','충북','세종','경북','부산','충남','대전']
doctors=[]
for i,n in enumerate(names):
    doctors.append(dict(id=f'D{i+1:03}',userId=f'SM{i+1:03}',name=n,organization=orgs[i],owner=regions[i],institution=['O01','O02','O02','O02','O02','O01','O02','O03'][i],industry=['I01','I01','I02','I03','I01','I01','I01','I03'][i],technologies=[['T02','T03'],['T03'],['T04'],['T05'],['T02'],['T03'],['T02'],['T05']][i],consultations=['C01','C03'] if i%2==0 else ['C01','C02'],supportRegions=[regions[i],'충남'] if regions[i]!='충남' else ['충남','대전','세종'],reasons=['S01','S02'],year='2026' if i<4 else '2025',available=i!=5,degree='공학박사',career='산업 현장 기술지원 및 기업 공동연구 12년',certificates='품질경영기사 · 산업기술 공로상 (가상)',acquiredTechnology='공정 최적화·불량 원인 분석' if i%3==0 else '기업 맞춤형 기술 진단',updatedAt='2025-02-10T09:00:00+09:00' if i in (4,6) else '2026-09-01T09:00:00+09:00',history=[]))
docNames=['사업자등록증명서','폐업사실증명서','휴업사실증명서','표준재무제표증명서','국세 납세증명서','지방세 납세증명서','부가가치세 과세표준증명','중소기업확인서','4대 사회보험료 완납 증명서']
specs=[dict(id=f'F{i+1:02}',name=n,provider=['국세청','국세청','국세청','국세청','국세청','지방자치단체','국세청','중소벤처기업부','국민건강보험공단'][i],active=True) for i,n in enumerate(docNames)]
programs=[dict(id='B001',title='2026년 지역기업 성장사다리 지원사업',region='충남',start='2026-09-01',end='2026-09-30',category='사업화 지원',requiredDocs=['F01','F04','F05','F06','F08']),dict(id='B002',title='2026년 스마트공정 전환 기술지원사업',region='대전',start='2026-09-03',end='2026-09-18',category='기술 지원',requiredDocs=['F01','F04','F05','F06','F07','F08','F09']),dict(id='B003',title='지역 바이오기업 품질·인증 지원사업',region='충북',start='2026-09-02',end='2026-09-25',category='품질·인증',requiredDocs=['F01','F05','F06','F08'])]
notice_profiles = [
    dict(industry='지역 주력산업 · 기계·소재', project='지역기업 단계별 성장 및 사업화 역량 강화', support=[('성장단계 중소기업','시제품 제작 지원','제품 설계 보완, 시제품 제작 및 성능 검증',25000000),('시장진입 중소기업','사업화 역량 강화','시장 조사, 제품 홍보물 제작 및 판로 상담',10000000)], eligibility='충남에 본사 또는 공장을 둔 지역 주력산업 중소기업\n제품 고도화 및 신규 시장 진출 계획을 보유한 기업', scope='시제품 제작, 시험·평가 및 제품 사업화 활동을 지원합니다.\n선정기업별 세부 지원내용과 기업부담금은 평가 및 협약에서 확정합니다.'),
    dict(industry='제조업 · 스마트공정', project='중소 제조기업 스마트공정 전환 및 생산성 향상', support=[('제조 중소기업','공정 진단·개선','현장 공정 분석, 데이터 수집 및 생산환경 개선',30000000),('공정 전환 준비기업','기술닥터 현장 지원','전문가 방문 진단 및 전환 로드맵 수립',5000000)], eligibility='대전에 사업장을 둔 제조 중소기업\n생산성·품질 개선 과제와 현장 적용 계획을 보유한 기업', scope='현장 진단부터 개선계획 수립과 시범 적용까지 연계 지원합니다.\n단순 설비 구매만을 목적으로 하는 과제는 지원대상에서 제외합니다.'),
    dict(industry='바이오 · 의료기기', project='지역 바이오기업 품질 고도화 및 인증 대응', support=[('바이오·의료 중소기업','시험·인증 지원','제품 시험분석, 품질 검증 및 인증 대응',20000000),('인증 준비 중소기업','품질체계 컨설팅','품질 문서 정비 및 전문가 사전 검토',8000000)], eligibility='충북에 사업장을 둔 바이오·의료 관련 중소기업\n시험평가 또는 인증 획득 계획을 보유한 기업', scope='품질 검증, 시험분석, 인증 관련 기술 컨설팅을 지원합니다.\n공인 시험기관 이용 비용과 전문가 자문 범위는 협약에서 확정합니다.')
]
for i, (program, profile) in enumerate(zip(programs, notice_profiles), 1):
    institution=f"가상 {program['region']}테크노파크"
    program.update(projectName=profile['project'], projectNumber=f'DEMO-S2026{i:03}', businessYear='2026', noticeNumber=f"2026-{program['region']}-가상기업지원-{i:03}", deadlineTime='18:00', industry=profile['industry'], institution=institution, publishedDate=f'2026-08-{20+i:02}',
        intro=f"{institution}는 지역 중소기업의 경쟁력 강화를 위해 「{program['title']}」 참여기업을 모집합니다. 사업 내용과 지원요건을 확인한 후 접수기간 내 신청해 주세요. 아래 사업·기관·담당자 및 금액은 기능 검토를 위한 가상 기초자료입니다.",
        supportPrograms=[dict(target=f"{program['region']} {target}",name=name,description=description,amount=amount) for target,name,description,amount in profile['support']],
        contentSections=[
            dict(heading='사업개요',body=f"사업명: {program['title']}\n과제명: {profile['project']}\n지원목적: 지역기업의 기술 경쟁력 강화와 지속 가능한 성장 지원\n접수기간: {program['start']} ~ {program['end']} 18:00\n지원기간: 협약 체결일부터 2026년 12월까지 (세부 일정 협의)"),
            dict(heading='지원대상 및 내용',body=f"신청자격\n{profile['eligibility']}\n\n지원내용\n{profile['scope']}\n\n지원제외\n접수 마감일 현재 휴·폐업, 국세·지방세 체납, 동일 내용 중복지원을 확인합니다.\n정부지원금은 프로그램별 표를 참고하며 부가가치세 및 기업부담금은 별도입니다."),
            dict(heading='신청방법 및 제출서류',body='RMS 온라인 신청: 사업 선택 → 신청기업 정보 → 접수서류 확인 → 제출 및 보완\n사업연도 2026년을 선택하고 기업정보를 확인합니다.\n필수 접수서류는 아래 목록에서 확인하고 조회 또는 파일 첨부 후 최종 제출합니다.\n마감일 18:00까지 최종 제출이 완료되어야 합니다. 임시저장은 접수완료가 아닙니다.'),
            dict(heading='선정절차 및 유의사항',body='접수 → 요건 검토 → 선정평가 → 협약 체결 → 과제 수행 → 결과보고 및 확인\n평가에서는 지원 필요성, 수행계획의 구체성 및 기대효과를 종합 검토합니다.\n선정 결과 및 보완 요청은 RMS 신청내역에서 확인합니다.\n공고문의 가상 첨부 예시는 다운로드와 JSON 이동을 검증하기 위한 자료이며 실제 사업신청에 사용할 수 없습니다.')
        ], contacts=[dict(institution=institution,name='가상 사업담당자',phone='000-000-0000',email=f'notice{i}@example.invalid',duty='지원내용 · 신청자격 안내'),dict(institution='가상 RMS 운영지원',name='가상 시스템담당자',phone='000-000-0001',email='rms-demo@example.invalid',duty='온라인 신청 · 서류제출 안내')])
    notice_text='[가상 시연용 공고문]\n'+program['title']+'\n\n'+program['intro']+'\n\n'+'\n\n'.join(section['heading']+'\n'+section['body'] for section in program['contentSections'])
    files=[('NOTICE','공고문',notice_text),('FORM','신청서식','[가상 시연용 신청서식]\n사업명: '+program['title']+'\n기업명:\n대표자:\n사업장 주소:\n신청 프로그램:\n수행계획:\n기대효과:\n\n실제 접수용 서식이 아닌 다운로드 기능 확인용 텍스트입니다.'),('MANUAL','신청안내','[가상 RMS 신청안내]\n1. 사업 선택\n2. 신청기업 정보 저장\n3. 필수 접수서류 조회 또는 첨부\n4. 최종 제출\n\n시연내용 JSON 내보내기는 저장된 사이트 전체 자료와 공고 첨부 텍스트를 함께 보관합니다. 다른 PC에서 JSON 불러오기로 복원할 수 있습니다.')]
    program['attachments']=[dict(id=file_id,name=f"{program['id']}-{label}-시연예시.txt",mimeType='text/plain',content=content,size=len(content.encode('utf-8'))) for file_id,label,content in files]
apps=[]
for i in range(3):
    apps.append(dict(id=f'A00{i+1}',programId=programs[i%2]['id'],companyId='CO001' if i<2 else 'CO002',companyName='가상 한빛정밀' if i<2 else '가상 새봄바이오',region='충남',representative='가상 대표자',address='충남 천안시 가상산업로 100',inputAddress='충남 천안시 가상산업로 99',consent=False,consentAt=None,submission='작성중',docs=[dict(specId=s['id'],status='미제출',queriedAt=None,reason='',file=None,history=[]) for s in specs]))
faqs=[
('로그인 비밀번호를 잊어버렸어요.','W01','SMTECH의 비밀번호 찾기에서 본인확인 후 변경할 수 있습니다. RMS에서도 같은 계정을 사용합니다.',['비밀번호','암호','패스워드','로그인']),
('사업 신청은 어떻게 진행하나요?','W02','사업공고에서 신청할 사업을 선택한 후 신청기업 정보와 접수서류를 확인하고 제출합니다.',['접수','신청','지원']),
('서류 조회에 실패하면 어떻게 하나요?','W02','실패사유를 확인한 후 다시 조회하거나 해당 증빙 파일을 직접 첨부할 수 있습니다.',['마이데이터','서류','오류','실패','증명']),
('첨부파일을 여러 개 제출할 수 있나요?','W02','서류별로 한 개 파일을 첨부합니다. 여러 파일이 필요한 경우 하나의 ZIP으로 묶어 제출합니다.',['첨부','파일','압축','ZIP']),
('보완 요청을 받았어요.','W03','서류제출현황에서 보완사유를 확인하고 해당 서류를 다시 조회하거나 파일로 제출합니다.',['수정','보완','반려']),
('다른 지역 기술닥터에게도 요청할 수 있나요?','W04','초광역권 검색에서 전문가의 지원가능 지역과 활동 가능 여부를 확인한 뒤 매칭을 요청합니다.',['전문가','기술닥터','다른지역','매칭']),
('조회된 주소가 신청서와 달라요.','W02','불일치 항목을 확인해 반영 여부를 직접 선택합니다. 기존 입력값을 자동으로 덮어쓰지 않습니다.',['주소','불일치','자동반영']),
('임시저장한 신청서는 어디서 보나요?','W03','공고의 신청내역에서 작성 중인 신청서를 선택해 이어서 작성합니다.',['임시저장','신청내역','작성중'])]
seed=dict(schemaVersion=1,demoDate='2026-09-08',classifications=codes,doctors=doctors,users=[dict(id=f'SM{i+1:03}',name=n,organization=orgs[i]) for i,n in enumerate(names)]+[dict(id='SM009',name='윤새결',organization='가상 충남첨단연구소')],programs=programs,documentTypes=specs,applications=apps,faqs=[dict(id=f'Q{i+1:03}',title=v[0],work=v[1],answer=v[2],keywords=v[3],published=True) for i,v in enumerate(faqs)],questions=[dict(id='P001',title='사업 신청서 임시저장 방법을 알려주세요.',work='W02',answer='사업신청 화면 하단의 임시저장 버튼을 이용해 주세요.',status='답변완료',date='2026-09-07',public=True,mainVisible=True),dict(id='P002',title='기술닥터 지원가능 지역은 어디서 확인하나요?',work='W04',answer='기술닥터 검색과 상세정보에서 지원가능 지역을 확인할 수 있습니다.',status='답변완료',date='2026-09-06',public=True,mainVisible=True),dict(id='P003',title='서류 보완 제출기한이 궁금합니다.',work='W03',answer='',status='답변대기',date='2026-09-08',public=True,mainVisible=True),dict(id='P004',title='가상 비공개 문의',work='W02',answer='비공개 예시',status='답변완료',date='2026-09-08',public=False,mainVisible=False)],matches=[dict(id='M001',doctorId='D001',companyId='CO001',companyName='가상 한빛정밀',region='충남',request='생산 공정 불량 원인 분석',date='2026-09-02',status='지원완료',result='공정 개선 방향 제안'),dict(id='M002',doctorId='D002',companyId='CO002',companyName='가상 새봄바이오',region='충남',request='소재 시험 분석 상담',date='2026-09-05',status='요청접수',result='')],settings=dict(homeOrder=['announcements','help','questions'],homeVisible=dict(announcements=True,help=True,questions=True),staleMonths=12),audit=[])
path=root/'prototype/region/rms/data/seed.json'
path.parent.mkdir(parents=True,exist_ok=True)
path.write_text(json.dumps(seed,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Created fictional seed: {path}')
