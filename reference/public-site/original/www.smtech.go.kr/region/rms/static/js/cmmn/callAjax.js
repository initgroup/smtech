const ess_noLoginInfo = /*[[#{ess.noLoginInfo}]]*/"로그인 정보가 없습니다. 로그인 하셔야 이용하실 수 있습니다.";
var loginUrl = CONST_CONTEXT_PATH + "/biz/login/loadingLogin.do";

var callAjax = {
	contextPath:CONST_CONTEXT_PATH,

	fnGetAjaxData:function(/* String */ pUrl, /* String or Array */ pData, /* boolean */ pAsync, /* String */ pCallBackFn) {
		try {
			var sData = null;
			if(typeof(pData) == "object" ) {
				sData = pData;
			}
			else {
				sData = $('#'+pData).serialize();
			}
			pUrl = this.contextPath+pUrl;
			$.ajax({
				/*dataType:"text",*/
				dataType:"json",
				type: "POST",
				url: pUrl,
				data:sData,
				async: pAsync,
				cache: false,
				/*contentType: "application/x-www-form-urlencoded; charset=UTF-8",*/
				beforeSend : function(request){
					request.setRequestHeader("AJAX", true);
			 	},
				success : function(_data, status, request) {
					if (_data.resultCode == "noAuth" || _data.resultCode == "loginDuplicated") {
						bootbox.alert({
							message: _data.resultMsg,
							callback: function () {
								fnMoveLoginPage();
							}
						});
					} else {
						pCallBackFn(_data);
					}

				},
				complete: function(){

				},
			    error: function(request, status, _error) {

			    	if (request.status =="403") {
						bootbox.alert({
							message: ess_noLoginInfo,
							callback: function () {
								fnMoveLoginPage();
							}
						});
			    	} else {
			    		window.error = _error;
						bootbox.alert(_error);
			    	}
				}
			});
		} catch(e) {
			console.log(e);
			//alert(e.exception.errMessage);
		}
	},

	fnGetAjaxServiceData:function(/* String */ pUrl, /* String or Array */ pData, /* boolean */ pAsync, /* String */ pCallBackFn) {
		try {

			var sData = null;
			if(typeof(pData) == "object" ) {
				pData['callUrl'] = pUrl;
				sData = pData;
			}
			else {
				var sForm = $('#'+pData);
				var input = document.createElement('input');
				input.setAttribute("type", "hidden");
				input.setAttribute("name", "callUrl");
				input.setAttribute("value", pUrl);
				sForm.appendChild(input);

				sData = sForm.serialize();
			}

			$.ajax({
				/*dataType:"text",*/
				dataType:"json",
				type: "POST",
				url: this.contextPath+"/combiz/message/requestMessage.json",
				data: sData,
				async: pAsync,
				cache: false,
				/*contentType: "application/x-www-form-urlencoded; charset=UTF-8",*/
				beforeSend : function(request){
					request.setRequestHeader("AJAX", true);
			 	},
				success : function(_data, status, request) {
					if (_data.resultCode == "noAuth" || _data.resultCode == "loginDuplicated") {
						bootbox.alert({
							message: _data.resultMsg,
							callback: function () {
								fnMoveLoginPage();
							}
						});
					} else {
						pCallBackFn(_data);
					}

				},
				complete: function(){

				},
			    error: function(request, status, _error) {

			    	if (request.status =="403") {
						bootbox.alert({
							message: ess_noLoginInfo,
							callback: function () {
								fnMoveLoginPage();
							}
						});
			    	} else {
			    		window.error = _error;
						bootbox.alert(_error);
			    	}
				}
			});
		} catch(e) {
			console.log(e);
			//alert(e.exception.errMessage);
		}
	}
}

function fnMoveLoginPage() {
	if (parent != null && typeof(parent) == "object") {
		parent.location.href = loginUrl;
	} else {
		if (parent != null && typeof(parent) == "object") {
			parent.location.href = loginUrl;
		} else {
			if (window.opener != null && typeof(window.opener) == "object") {	//부모창이 존재하면
				if (window.opener.opener != null && typeof(window.opener.opener) == "object") {
					window.opener.opener.location.href = loginUrl;
				} else {
					window.opener.location.href = loginUrl;
				}

			} else {
				location.href = loginUrl;
			}
		}
	}
}

function blockUI(/** String */ mesg, /** object of the css */ cssMap, /** Number */ timeout) {

	try{

		cssMap = cssMap || {  width:'0px', height:'0px', padding:'0px', border: "0px", position:'absolute', top:'48%', left:'49%' };
		timeout = timeout || 120 * 1000;

		$.blockUI({
			//message: '<button class="btn btn-primary" type="button" disabled><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>Loading...</button>',
			message: "<img src='"+CONST_CONTEXT_PATH+"/static/images/common/loading.gif' alt='loading'>",
			fadeIn:0,
			css: cssMap,
			overlayCSS: { backgroundColor: '#fff', opacity: 0.5, cursor: 'wait' },
			blockMsgClass: 'blockMsg',
			baseZ: 9999
		});

		var agt = navigator.userAgent.toLowerCase();
		if (agt.indexOf("msie") != -1 || agt.indexOf("mozilla/5.0") != -1) {
			//setTimeout(unblockUI, 2000);
			setTimeout(unblockUI, timeout);
		}

	}catch(e){
		console.log(e.toString());
		return;
	}
}

function unblockUI() {
	$.unblockUI();
}

$(document).ajaxStart(blockUI);
$(document).ajaxStop(unblockUI);