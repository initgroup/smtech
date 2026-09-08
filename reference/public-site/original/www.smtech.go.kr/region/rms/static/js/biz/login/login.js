$(document).ready(function() {
	checkLoginException();
	
	$("#loginId,#secretNo").on("keyup",function(key){
        if(key.keyCode==13) {
            fnLogin();
        }
    });

	$("#crtfcNo").on("keyup",function(key){
        if(key.keyCode==13) {
            fnSmsCrtfc();
        }
    });

	$("#btn_mlrd_manage").click(function(){
		gfn_locationHref("/biz/mlrdManage/mlrdManage/mlrdManage.do");
	});

	$("#btn_down_rcvfvr_manual").click(function(){

		var rcvfvrManualLink = CONST_CONTEXT_PATH + "/static/file/manual/rcvfvr_manual.pdf";

		const evt = document.createElement("a");
		evt.href = rcvfvrManualLink;
		evt.download = "지원기업 사용자매뉴얼.pdf";

		evt.click();
	});

	$("#btn_mlrd_manage").on("keyup",function(key){
        if(key.keyCode==13) {
            fnSmsCrtfc();
        }
    });

	$('#loginId').focus();
	
	fnGetSmsCrtfcSe();
});

const CONST_CRTFC_TIME = 300;
var timerId = null;
var remainTime;
function runTimer() {   // 1초씩 카운트
    var remainTimeText = "";
	if(Math.floor(remainTime / 60) > 0){
		remainTimeText = Math.floor(remainTime / 60) + "분 ";
	}

	remainTimeText += (remainTime % 60) + "초";
	$('#remainTime').text(remainTimeText);

    remainTime--;
    if (remainTime < 0) {
		fnInitTimer();
		fnInitSmsCrtfcLayer();
		swal('','인증시간을 초과하였습니다.', 'error');
    }
}

function fnInitTimer(){
	clearInterval(timerId);
	remainTime = CONST_CRTFC_TIME;
}

function fnStartTimer(){
	fnInitTimer();
	runTimer();
	timerId = setInterval('runTimer()', 1000);
}

function fnInitSmsCrtfcLayer(){
	$('#smsCrtfcLayer').hide();
	$('#smsMsg').hide();
	$('#smsMsg').html("");
	$('#crtfcNo').val("");
}

function fnGetSmsCrtfcSe(){
    var params = {};
    callAjax.fnGetAjaxData("/biz/login/getSmsCrtfcSe.json", params, false, function(_data) {
		
        if (_data.resultCode == 'success') {
			$('#smsCrtfcSe').val(_data.smsCrtfcSe);		
        } else {
        	swal('',_data.resultMsg, 'error');
        }
    });
}

function fnLogin(callBackFn) {

	fnInitTimer();
	fnInitSmsCrtfcLayer();

    if (fnIsEmpty($("#loginId").val())) {
        swal('','아이디 입력해 주십시오.', 'warning');
        return false;
    }

    if (fnIsEmpty($("#secretNo").val())) {
        swal('','비밀번호를 입력해 주십시오.', 'warning');
        return false;
    }

	var smsCrtfcSe = $('#smsCrtfcSe').val();
	
    var params = {};
    params['LOGIN_ID'] 	= $("#loginId").val();
    params['SECRET_NO'] 	= $("#secretNo").val();
	params['SMS_CRTFC_SE'] 	= $('#smsCrtfcSe').val();

	

    callAjax.fnGetAjaxData("/biz/login/checkLoginUser.json", params, false, function(_data) {
        if (_data.resultCode == 'success') {

			if(_data.useSmsCrtfcAt == 'N'){
				gfn_locationHref("/biz/main/main.do");
			}else {
				
				if(smsCrtfcSe == "SCS0001"){
					if(!fnIsEmpty(_data.resultSmsMsg)){
						$('#smsMsg').html('[SMS내용은 개발계에서만 표시됩니다.]<br>' + _data.resultSmsMsg);
						$('#smsMsg').show();
					}
	
					fnStartTimer();
					$('#smsCrtfcLayer').show();
					$('#crtfcNo').focus();
	
					if(!fnIsEmpty(callBackFn)){
						callBackFn();
					}
				} else {
					fnSmsCrtfc();
				}
			}

        } else {
        	swal('',_data.resultMsg, 'error');
        }
    });
}

function fnSmsCrtfc(){

	var smsCrtfcSe = $('#smsCrtfcSe').val();
	
	if(smsCrtfcSe == "SCS0001"){
	    if (fnIsEmpty($("#crtfcNo").val()) || $("#crtfcNo").val().length < 6) {
	        swal('','인증번호 6자리를 입력해 주십시오.', 'warning');
	        return false;
	    }
    }

    var params = {};
    params['LOGIN_ID'] 	= $("#loginId").val();
    params['SECRET_NO'] = $("#secretNo").val();
	params['CRTFC_NO'] 	= $("#crtfcNo").val();
	params['SMS_CRTFC_SE'] 	= $('#smsCrtfcSe').val();

    callAjax.fnGetAjaxData("/biz/login/procLogin.json", params, false, function(_data) {
        if (_data.resultCode == 'success') {

			if(window.name == "rLginPop"){ // 재로그인 팝업 확인
				self.close();
			}else{

				let rmsReDirectUri = gfnGetCookie("rms_re_direct_uri");

				if(fnIsEmpty(rmsReDirectUri)){
					gfn_locationHref("/biz/main/main.do");
				}else{
					gfnDeleteCookie("rms_re_direct_uri");
					location.href = rmsReDirectUri;
				}
			}

			//fnInitTimer();
			//fnInitSmsCrtfcLayer();
			//gfn_locationHref("/biz/main/main.do");

        } else {
        	swal('',_data.resultMsg, 'error').then(() => {
				
				$("#crtfcNo").val('');
				$('#crtfcNo').focus();
				
	        	if(_data.sms_fail_se != undefined && _data.sms_fail_se != '' && _data.sms_fail_se == 'FAIL' ){
					location.reload();
				}				
			});
        }
    });

}

function fnCrtfcNoReSend(){
	fnLogin(function(){
		swal('','재전송 되었습니다.', 'success');
	});
}


function fnCloseCrtfcPop(){

    
	fnProcCrtfc();

	$('#smsCrtfcLayer').hide();
	fnInitTimer();
	$("#loginId").val('');
	$("#secretNo").val('');
}


function fnProcCrtfc(){
	var params = {};
    callAjax.fnGetAjaxData("/biz/login/procCrtfc.json", params, false, function(_data) {
        if (_data.resultCode == 'success') {

        } else {
        	swal('',_data.resultMsg, 'error');
        }
    });
}


