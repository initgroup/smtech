
$(document).ready(function(){

	// 상세보기
	$("a[name=btn_detail]").click(function(){

		var sbjtId = $(this).attr("sbjtId");
		var pblancId = $(this).attr("pblancId");

		if(gfnIsEmpty(sbjtId) || gfnIsEmpty(pblancId)){
			gfn_alert('', "잘못된 요청입니다.", 'error');
			return;
		}

		fn_bpopup('/biz/pblancManage/pblancManage/pblancDetailPop.do?sbjtId=' + sbjtId + '&pblancId=' + pblancId, 1500, 920);

	});

	// 신청하기
	$("a[name=btn_regist]").click(function(){

		console.log('===================');

		var sbjtId = $(this).attr("sbjtId");
		var pblancId = $(this).attr("pblancId");

		if(gfnIsEmpty(sbjtId) || gfnIsEmpty(pblancId)){
			gfn_alert('', "잘못된 요청입니다.", 'error');
			return;
		}

		$("#sbjt_id").val(sbjtId);
		$("#pblanc_id").val(pblancId);
		$("#pblanc_rcept_id").val("");
		$("#rcvfvr_entrprs_instt_id").val("");

		gfnSetFormAction("searchForm", "/biz/pblancManage/pblancReqstManage/pblancReqst.do");
		$("#searchForm").submit();

	});


    // rms 서비스 공지사항 팝업 호출 
    fnNoticePopup();

});



function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}



function fnNoticePopup(){
	
	let params = {};
	fnGetAjaxData("/biz/main/searchData.json", params, function(_data) {
		if(_data.resultCode == "success"){
		    // rms 서비스 공지사항 팝업 호출 
		    if (getCookie("rms_notice_popup_closed") !== "true") {
				fn_Popup("/biz/main/noticeMatterPop.do", 503, 647, "rmsNoticeWin", "rmsNoticeForm", "");
		    }
		  }
	});
}