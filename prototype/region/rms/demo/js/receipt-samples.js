/* DEMO ONLY: supplied XML fixture metadata. */
(function(window){
    var manifest = [
        {
            id: 'personal-application', label: '개인용 · 신청', audience: '개인용', purpose: '신청', fileName: '묶음정보(개인용-신청)_수신결과(샘플).txt'
        },
        {
            id: 'personal-preference', label: '개인용 · 우대가점', audience: '개인용', purpose: '우대가점', fileName: '묶음정보(개인용-우대가점)_수신결과(샘플).txt'
        },
        {
            id: 'company-application', label: '기업용 · 신청', audience: '기업용', purpose: '신청', fileName: '묶음정보(기업용-신청)_수신결과(샘플).txt'
        },
        {
            id: 'company-preference', label: '기업용 · 우대가점', audience: '기업용', purpose: '우대가점', fileName: '묶음정보(기업용-우대가점)_수신결과(샘플).txt'
        }
    ].map(function (m) {
        m.xmlPath = 'demo/data/mydata/' + m.id + '.xml';
        m.originalPath = 'demo/data/mydata/' + m.fileName;
        m.sourceEncoding = 'EUC-KR (CP949)';
        return m;
    });
window.RMSMydata.setManifest(manifest);
}(window));
