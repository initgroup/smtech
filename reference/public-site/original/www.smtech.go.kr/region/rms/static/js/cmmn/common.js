//** ---------------------------------------------------------------------------
//함 수 명 : fnGetSyncAjaxData
//인    자 :
//		  1. pUrl          : json 호출 url
//		  2. pData         : 파라메터 데이터 Form 명 또는 Array
//		  3. pCallBackFn   : 정상 처리 완료 후 호출 Function 명
//		  4. pBlockUI      : true - blockUI 함수를 호출 한다., false - blockUI 호출 하지 않는다.
//		  5. pBlockMessage : BlockUI에 설정 할 메시지
//		  6. pObj		 		:pCallBackFn에 붙일 object
//목    적 :
//플 로 우 :
//검    수 :
//예   제  : 	fnGetAjaxData('/sm/so/cm/pop/selectSmso3011.json', 'frm', 'callbackTblListClick', true, '조회 중 입니다.' );
//			fnGetAjaxData('/sm/so/cm/pop/selectSmso3011.json', {codeId:$(obj).data("data").codeId}, 'callbackTblListClick', true, '조회 중 입니다.' );
//생 성 일 :
//수    정 :
//** ---------------------------------------------------------------------------
var arrWinHandle = new Array();	// 팝업창 핸들 저장 array
var befoWinHeight = 0;
var loginUrl = CONST_CONTEXT_PATH + "/biz/login/loadingLogin.do";

var entityMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;' };

var dateEditor = function (ui) {
    var $inp = ui.$cell.find("input"),
        grid = this,
		format = ui.column.format || "yy-mm-dd",
		val = $inp.val() ? $.datepicker.formatDate(format, new Date($inp.val())) : "";

    //initialize the editor
    $inp
    .attr('readonly', 'readonly')
	.val(val)
    .datepicker({
        changeMonth: true,
        changeYear: true,
        dateFormat: format,
        showAnim: '',
        onSelect: function () {
            this.firstOpen = true;
        },
        beforeShow: function (input, inst) {
            setTimeout(function () {
                //to fix the issue of datepicker z-index when grid is in maximized state.
                $('.ui-datepicker').css('z-index', 999999999999);
            });
            return !this.firstOpen;
        },
        onClose: function () {
            this.focus();
        }
        ,
        monthNamesShort:[ '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월' ],
        dayNamesMin:[ '일', '월', '화', '수', '목', '금', '토' ],
    });
}

$(function() {
	$(".onlyNumber").on("keyup", function() {
	    $(this).val($(this).val().replace(/[^0-9]/g,""));
	});
	$(".onlyKicsNumber").on("keyup", function() {
		$(this).val($(this).val().replace(/[^0-9-]/g,""));
	});

	$(".currency").on('focus', function() {
		var val = $(this).val();
		if (!fnIsEmpty(val)) {
			val = val.replace(/,/g,'');
			$(this).val(val);
		}
	});

	$(".currency").on('blur', function() {
		var val = $(this).val();
		if (!fnIsEmpty(val) && fnIsNumber(val)) {
			val = fnCurrencyFormatter(val);
			$(this).val(val);
		}
	});

	$(".enterSearch").keydown(function(key) {
		if (key.keyCode == 13 ) {
			if (typeof fnSearch == 'function') {
				fnSearch();
			}else{
				return false;
			}
		}
	});

	$.datepicker.setDefaults({
        dateFormat: 'yy-mm-dd',
        prevText: '이전 달',
        nextText: '다음 달',
        monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
        monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
        dayNames: ['일', '월', '화', '수', '목', '금', '토'],
        dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
        dayNamesMin: ['일', '월', '화', '수', '목', '금', '토'],
        showMonthAfterYear: true,
        yearSuffix: '년'
    });
});



function fnGetSyncAjaxData(/* String */ pUrl, /* String or Array */ pData, /* String */ pCallBackFn)
{
	try {
		var sData = null;
		if(typeof(pData) == "object" ) {
			sData = pData;
		}
		else {
			sData = $('#'+pData).serialize();
		}
		pUrl = CONST_CONTEXT_PATH+pUrl;
		$.ajax({
			/*dataType:"text",*/
			dataType:"json",
			type: "POST",
			url: pUrl,
			data:sData,
			async: false,
			cache: false,
			/*contentType: "application/x-www-form-urlencoded; charset=UTF-8",*/
			beforeSend : function(request){
				request.setRequestHeader("AJAX", true);
		 	},
			success : function(_data, status, request) {
				if (_data.resultCode == "noAuth") {
					alert(_data.resultMsg);
					 if (window.opener != null && typeof(window.opener.top) == "object") {	//부모창이 존재하면
						opener.top.location.href = loginUrl;
					} else {
						location.href = loginUrl;
					}
				} else {
					pCallBackFn(_data);
				}

			},
			complete: function(){

			},
		    error: function(request, status, error) {

		    	if (request.status =="403") {
		    		alert("로그인 정보가 없습니다. 로그인 하셔야 이용하실 수 있습니다.");
					if (window.opener != null && typeof(window.opener.top) == "object") {	//부모창이 존재하면
						opener.top.location.href = loginUrl;
					} else {
						location.href = loginUrl;
					}
		    	} else {
		    		window.error = error;
					alert(error);
		    	}
			}
		});
	} catch(e) {
		console.log(e);
		//alert(e.exception.errMessage);
	}

}


//** ---------------------------------------------------------------------------
//함 수 명 : fnGetAjaxData
//인    자 :
//		  1. pUrl          : json 호출 url
//		  2. pData         : 파라메터 데이터 Form 명 또는 Array
//		  3. pCallBackFn   : 정상 처리 완료 후 호출 Function 명
//		  4. pBlockUI      : true - blockUI 함수를 호출 한다., false - blockUI 호출 하지 않는다.
//		  5. pBlockMessage : BlockUI에 설정 할 메시지
//		  6. pObj		 		:pCallBackFn에 붙일 object
//목    적 :
//플 로 우 :
//검    수 :
//예   제  : 	fnGetAjaxData('/sm/so/cm/pop/selectSmso3011.json', 'frm', 'callbackTblListClick', true, '조회 중 입니다.' );
//			fnGetAjaxData('/sm/so/cm/pop/selectSmso3011.json', {codeId:$(obj).data("data").codeId}, 'callbackTblListClick', true, '조회 중 입니다.' );
//생 성 일 :
//수    정 :
//** ---------------------------------------------------------------------------
function fnGetAjaxData(/* String */ pUrl, /* String or Array */ pData, /* String */ pCallBackFn )
{
	try {
		var sData = null;
		if(typeof(pData) == "object" ) {
			sData = pData;
		}
		else {
			sData = $('#'+pData).serialize();
		}
		pUrl = CONST_CONTEXT_PATH+pUrl;
		$.ajax({
			/*dataType:"text",*/
			dataType:"json",
			type: "POST",
			url: pUrl,
			data:sData,
			async: true,
			cache: false,
			/*contentType: "application/x-www-form-urlencoded; charset=UTF-8",*/
			beforeSend : function(request){
				request.setRequestHeader("AJAX", true);
		 	},
			success : function(_data, status, request) {

				if (_data.resultCode == "noAuth") {

					gfn_alert('', _data.resultMsg, 'error', function(){

						fn_Popup("/biz/login/loadingLogin.do", 1100, 760, "rLginPop");
					});


					/*
					if (window.opener != null && typeof(window.opener.top) == "object") {	//부모창이 존재하면
						opener.top.location.href = loginUrl;
					} else {
						location.href = loginUrl;
					}
					*/
				} else {
					pCallBackFn(_data);
				}
			},
			complete: function(){

			},
		    error: function(request, status, error) {
		    	if (request.status =="403") {
		    		alert("로그인 정보가 없습니다. 로그인 하셔야 이용하실 수 있습니다.");
					if (window.opener != null && typeof(window.opener.top) == "object") {	//부모창이 존재하면
						opener.top.location.href = loginUrl;
					} else {
						location.href = loginUrl;
					}
		    	} else {
		    		window.error = error;
					alert(error);
		    	}
			}
		});
	} catch(e) {
		console.log(e)
		alert("에러가 발생하였습니다.");
	}

}
//comma 찍기
function gfnNumberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function blockUI(/** String */ mesg, /** object of the css */ cssMap, /** Number */ timeout) {

	return;

	try{

		cssMap = cssMap || {  width:'0px', height:'0px', padding:'0px', border: "0px", position:'absolute', top:'35%', left:'42%' };
		timeout = timeout || 5000;

		$.blockUI({
			message: "<img src='"+CONST_CONTEXT_PATH+"/static/images/common/loading.gif' alt='loading'>",
			fadeIn:0,
			css: cssMap,
			overlayCSS: { backgroundColor: '#fff', opacity: 0.5, cursor: 'wait' },
			blockMsgClass: 'blockMsg',
			baseZ: 9999
		});

		var agt = navigator.userAgent.toLowerCase();
		// console.log("agt ["+agt+"]");
		if ((navigator.appName == 'Netscape' && agent.indexOf('trident') != -1) || (agent.indexOf("msie") != -1)) {
			setTimeout(unblockUI, 2000);
		}

	}catch(e){
		return;
	}
}

function unblockUI() {
	$.unblockUI();
}

$(document).ajaxStart(blockUI);

$(document).ajaxStop(unblockUI);

/*
 * select box 초기화
 */
function fn_bindSelectBox($selector, items) {
	$selector.empty();

	$.each(items, function(index, item) {
		var padding = "";
		if (item.lv != undefined) {
			if (Number(item.lv) > 1) {
				var pSize = (Number(item.lv)-1)*2;
				for (var i = 0; i < pSize; i++) {
					padding += "&nbsp;";
				}

			}
		}
		var option = $("<option value=\""+item.CODE+"\">"+item.CODE_NM+"</option>");
		if (padding != "") {
			option = $("<option value=\""+item.CODE+"\">"+padding+item.CODE_NM+"</option>");
		}
		$selector.append(option);
	});
}

/*
 * select box 초기화
 */
function fn_bindSelectBoxWithAll($selector, items) {
	$selector.empty();
	var allOption = $("<option value=''>전체</option>");
	$selector.append(allOption);

	$.each(items, function(index, item) {
		var option = $("<option value=\""+item.CODE+"\">"+item.CODE_NM+"</option>");
		$selector.append(option);
	});
}

/*
 * select box 초기화
 */
function fn_bindSelectBoxWithSel($selector, items) {
	$selector.empty();
	var allOption = $("<option value=''>선택</option>");
	$selector.append(allOption);

	$.each(items, function(index, item) {
		var option = $("<option value=\""+item.CODE+"\">"+item.CODE_NM+"</option>");
		$selector.append(option);
	});
}

/*
 * select box 초기화
 */
function fn_bindSelectBoxWithDefaultStr($selector, items, defaultStr) {
	$selector.empty();
	var allOption = $("<option value=''>"+defaultStr+"</option>");
	$selector.append(allOption);

	$.each(items, function(index, item) {
		var option = $("<option value=\""+item.code+"\">"+item.codeNm+"</option>");
		$selector.append(option);
	});
}

/*
 * 설  명 : 공통 레이어팝업
 * 인자 1 : url 타겟 url
 * 인자 2 : 레이어팝업 width 사이즈
 * 인자 3 : 레이어팝업 height 사이즈
 */
function fn_bpopup(url,wsize,hsize,layerId){

	$("body").scrollTop(0);

	var elId = "#maskLayer";
	if(layerId != null && layerId != undefined && layerId != "undefined" && layerId != ""){
		elId = "#" + layerId;
	}

	$(elId).css("width", wsize);
	$(elId).css("height", hsize);

	$(elId).bPopup({
		modalClose: false,
		speed:300,
		transition:'slideDown',
		transitionClose: 'slideBack',
        content:'iframe', //'ajax', 'iframe' or 'image'
    	loadUrl:CONST_CONTEXT_PATH + url //Uses jQuery.load()
    });

	$('.b-iframe').css("width", wsize);
	$('.b-iframe').css("height", hsize);
}

/*
 * 설  명 : 공통 레이어팝업 종료
 */
function fn_bClose(layerId){
	var elId = "#maskLayer";
	if(layerId != null && layerId != undefined && layerId != "undefined" && layerId != ""){
		elId = "#" + layerId;
	}

	var bPopup = $(elId).bPopup();
	bPopup.close();

	$(elId).html('');
}

/**
 * 팝업 창 열기
 * @param url
 * @param map1
 * @see #popupPostNew
 */
function fn_Popup(/** String */ url, /** Number */ w, /** Number */ h, /** String */ _WinName, /** String */ _FrmName, /** Map */ arg, vo) {
	if (_WinName === undefined || _WinName == null) {
		_WinName = "_blank";
	}
	if (_FrmName === undefined || _FrmName == null) {
		_FrmName = "frmPopup";
	}
	//url = CONST_CONTEXT_PATH+url;
	try{
		fnComClosePopup(_WinName); // 기존 같은 이름의 팝업창을 닫는다.
	}catch(e){}

	opt = getOptNewCenter(w, h); //센터 오픈
	arrWinHandle[_WinName] = window.open('', _WinName, opt);
	if (arrWinHandle[_WinName]) {
		arrWinHandle[_WinName].focus();
		fnPopupWindowThruPostNew(url, arg, _FrmName, _WinName,vo);
	}
	return arrWinHandle[_WinName];
}

/**
 * POST 방법으로 팝업창 띄우기 New 2014-07-29
 * 이전 방식을 알수 없음
 * @param url
 * @param map1
 * @see #popupPost
 */
function fnPopupWindowThruPostNew(/** String */ url, /** map */ arg, /** String */ frmName, /** String */ targetName, vo) {
	url = CONST_CONTEXT_PATH+url;
	var $frm = $('form[target='+ targetName + ']');
	if ($frm.length == 1) {
		$frm.remove();
	}

	var frm = document.createElement('form');
	for (var key in arg) {
        value = arg[key];
        var input = '<input type="hidden" name="' + key + '" value="' + value + '">';
        $(frm).append(input);
	}

	frm.setAttribute('name', frmName || vo);
	frm.setAttribute('action', url);
	frm.setAttribute('method', 'post');
	frm.setAttribute('target', targetName);
	document.body.appendChild(frm);

	frm.submit();
}

//** ---------------------------------------------------------------------------
//함 수 명 : fnComClosePopup
//인    자 :
//		  1. pWinName : open windown name
//목    적 : 현재 열린 popup창을  닫는다.
//플 로 우 :
//검    수 :
//예   제  :
//생 성 일 :
//수    정 :
//** ---------------------------------------------------------------------------
function fnComClosePopup(pWinName) {
	if(typeof(pWinName) == 'undefined') {	// 전체 닫기
		for(var i in arrWinHandle){	// 현재 열려 있는 팝업창
			if(arrWinHandle[i] != null && typeof(arrWinHandle[i].name)== "string" ){ // 핸들이 존재하는 확인
				arrWinHandle[i].close();
				arrWinHandle[i] = null;
			}
		}

	} else {	// 넘어온 object만 닫기
		if(arrWinHandle[pWinName] != null && typeof(arrWinHandle[pWinName].name)== "string" ){ // 핸들이 존재하는 확인
			arrWinHandle[pWinName].close();
			arrWinHandle[pWinName] = null;
		}
	}

}

function getOptNewCenter(/** Number */ w, /** Number */ h) {
	var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
	var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;
	var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
	var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
	var left = ((width / 2) - (w / 2)) + dualScreenLeft;
	var top = ((height / 2) - (h / 2)) + dualScreenTop;

	var pos = 'height='+ h+ ',width='+ w+ ',left='+ left+ ',top='+ top;
	var opt = 'location=no,directories=no,toolbar=no,status=no,menubar=no,scrollbars=yes,copyhistory=no,resizable=no,'+ pos;
	return opt;
}

//** ---------------------------------------------------------------------------
//함 수 명 : getCodeChk
//인    자 : 체크 하고자 하는 코드명
//목    적 : 벨리데이션 체크
//플 로 우 :
//검    수 :
//예   제  :
//생 성 일 :
//수    정 :
//** ---------------------------------------------------------------------------

function getCodeChk(nm, code){
	if(!/^[A-Z]+[A-Z0-9]{2,19}$/g.test(code)){
		alert(nm + "코드 형식은 첫 글자 영문, 대문자 영문, 숫자만 가능합니다.");
		return true;
	}
	return false;
}

//** ---------------------------------------------------------------------------
//함 수 명 : getEmailChk
//인    자 : 체크 하고자 하는 email 위치
//목    적 : 벨리데이션 체크
//플 로 우 :
//검    수 :
//예   제  :
//생 성 일 :
//수    정 :
//** ---------------------------------------------------------------------------

function getEmailChk(email){
	if(!/^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i.test($('#' + email).val())){

		gfn_alert("", "이메일 형식을 확인해 주세요.", "warning", function(){
			$("#" + email).focus();
		});
		return true;
	}
	return false;
}

//** ---------------------------------------------------------------------------
//함 수 명 : getEmailChk2
//인    자 : 체크 하고자 하는 email 위치
//목    적 : 벨리데이션 체크 후 alert 창 없음
//플 로 우 :
//검    수 :
//예   제  :
//생 성 일 :
//수    정 :
//** ---------------------------------------------------------------------------
function getEmailChk2(email){
	if(!/^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i.test($('#' + email).val())){
		return true;
	}
	return false;
}

//** ---------------------------------------------------------------------------
//함 수 명 : getTelChk
//인    자 : 체크 하고자 하는 전화번호 위치
//목    적 : 벨리데이션 체크
//플 로 우 :
//검    수 :
//예   제  :
//생 성 일 :
//수    정 :
//** ---------------------------------------------------------------------------
function getTelChk(tel){
	if(!/^\d{2,3}-\d{3,4}-\d{4}$/.test($('#' + tel).val())){

		gfn_alert("", "전화번호 형식을 확인해 주세요.", "warning", function(){
			$("#" + tel).focus();
		});

		return true;
	}
	return false;
}

//** ---------------------------------------------------------------------------
//함 수 명 : getTelChk2
//인    자 : 체크 하고자 하는 전화번호 위치
//목    적 : 벨리데이션 체크 후 alert 창 없음
//플 로 우 :
//검    수 :
//예   제  :
//생 성 일 :
//수    정 :
//** ---------------------------------------------------------------------------
function getTelChk2(tel){
	if(!/^\d{2,3}-\d{3,4}-\d{4}$/.test($('#' + tel).val())){

		return true;
	}
	return false;
}

//** ---------------------------------------------------------------------------
//함 수 명 : getPhoneChk
//인    자 : 체크 하고자 하는 헨드폰번호 위치
//목    적 : 벨리데이션 체크
//플 로 우 :
//검    수 :
//예   제  :
//생 성 일 :
//수    정 :
//** ---------------------------------------------------------------------------
function getPhoneChk(phone){
	if(!/^01([0|1|6|7|8|9])-\d{3,4}-\d{4}$/.test($('#' + phone).val())){

		gfn_alert("", "핸드폰번호 형식을 확인해 주세요.", "warning", function(){
			$("#" + phone).focus();
		});

		return true;
	}
	return false;
}

//** ---------------------------------------------------------------------------
//함 수 명 : getPhoneChk2
//인    자 : 체크 하고자 하는 헨드폰번호 위치
//목    적 : 벨리데이션 체크 후 alert 창 없음
//플 로 우 :
//검    수 :
//예   제  :
//생 성 일 :
//수    정 :
//** ---------------------------------------------------------------------------
function getPhoneChk2(phone){
	if(!/^01([0|1|6|7|8|9])-\d{3,4}-\d{4}$/.test($('#' + phone).val())){

		return true;
	}
	return false;
}

//** ---------------------------------------------------------------------------
//함 수 명 : getPasswdChk
//인    자 : 체크 하고자 하는 패스워드 위치
//목    적 : 벨리데이션 체크
//플 로 우 :
//검    수 :
//예   제  :
//생 성 일 :
//수    정 :
//** ---------------------------------------------------------------------------

function getPasswdChk(pass){
	if(!/^.*(?=^.{9,15}$)(?=.*\d)(?=.*[a-zA-Z])(?=.*[~,!,@,#,$,%,^,&,^,*,?,(,),=,+,_,.,|]).*$/.test($('#' + pass).val())){
		alert("패스워드 형식을 확인하시기 바랍니다.");
		$("#" + pass).focus();
		return true;
	}
	return false;
}

function fnIsEmpty(val) {

	if ($.trim(val).length == 0 || val == null || val == "") {
		return true;
	} else {
		return false;
	}
}

function fnIsEmptyObj(obj) {

	if ($.trim(obj.val()).length == 0) {
		return true;
	} else {
		return false;
	}
}

function gfnNullCheck(obj, msg){
	if (fnIsEmptyObj(obj)) {
		alert(msg + "을(를) 입력하세요.");
		obj.focus();
		return false;
	}
	return true;
}

function fnGridResize($pqGrid, margin) {
	var mg = 420;
	if (margin != null) {
		mg = margin;
	}

	//grid resize
	$(window).bind("resize", function() {

		var gridHeight = window.innerHeight - mg;
		if (gridHeight < 100) {
			gridHeight = 100;
		}

		$pqGrid.pqGrid( "option", "height", gridHeight );
		if (befoWinHeight != 0 && befoWinHeight < window.innerHeight) {
			$pqGrid.pqGrid("refreshView");
		}
		befoWinHeight = window.innerHeight;
	}).trigger("resize");

	fnSetGridToolTip($pqGrid);

}

// 그리드 툴팁
function fnSetGridToolTip($pqGrid){

	$pqGrid.pqGrid("option", "columnTemplate", { render: gfnTooltipRender } );
	$pqGrid.pqGrid("refreshView");
	//$(document).tooltip();

}

function getParameterByName(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		results = regex.exec(location.search);
	return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function fnGetExcelHeadNm(idx) {
	var num =(idx+1);
	var nmArr = new Array();
	var resultStr = "";
	while (num > 0) {
		var rest = ((num-1) % 26);
		nmArr.push(String.fromCharCode(65+rest));
		num = parseInt((num-1) / 26);
	}
	for (var n = nmArr.length-1; n >= 0; n--) {
		resultStr += nmArr[n];
	}

	return resultStr;
}

function fnReplaceAll(str, searchStr, replaceStr) {
	return str.split(searchStr).join(replaceStr);
}

function fnSplitArr(targetStr, splitChr, defaultSize) {
	if (targetStr != null && targetStr!= undefined) {
		return targetStr.split(splitChr);
	} else {
		var returnArr = new Array();
		for (var i = 0; i < defaultSize; i++) {
			returnArr.push("");
		}
		return returnArr;
	}
}

function fnStrReplaceAll(str, searchStr, replaceStr) {
	return str.replace(/searchStr/g, replaceStr);
}

function fnIsNumber(s) {
	s += ''; // 문자열로 변환
	s = s.replace(/^\s*|\s*$/g, ''); // 좌우 공백 제거
	if (s == '' || isNaN(s)) return false;
	return true;
}

/*
 * 돈표시
 */
function fnCurrencyFormatter(s) {
	return s.toString().replace(/\B(?=(\d{3})+(?!\d))/g,',');
}

function fnShowPer(ctx, per) {
	ctx.clearRect(0, 0, 400, 400);
	//바깥쪽 써클 그리기
	ctx.strokeStyle = "#f66";
	ctx.lineWidth=10;
	ctx.beginPath();
	ctx.arc(60, 60, 50, 0, Math.PI * 2 * per / 100);
	ctx.stroke();
	//숫자 올리기
	ctx.font = '32px serif';
	ctx.fillStyle = "#000";
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(per + '%', 60, 60);
}


function fnFileDownload(_url, _evt) {
	var canvas = document.getElementById('canvas')
	var ctx = canvas.getContext("2d");
	// console.dir(canvas);
	// console.dir(ctx);
	// console.log("url is ["+_url+"]");
	$.ajax({
		url : _url,
		type : 'get',
		xhrFields: { //response 데이터를 바이너리로 처리한다.
			responseType: 'blob'
		},beforeSend : function() { //ajax 호출전 progress 초기화
			fnShowPer(ctx, 0);
			canvas.style.display = 'block';
		},xhr: function() { //XMLHttpRequest 재정의 가능
			var xhr = $.ajaxSettings.xhr();
			// console.dir(_evt);
			xhr.onprogress = function(_evt) {
				fnShowPer(ctx, Math.floor(_evt.loaded / _evt.total * 100));
			};
			return xhr;
		},success : function(data) {
			// console.log("완료");
			var blob = new Blob([data]);
			//파일저장
			if (navigator.msSaveBlob) {
				return navigator.msSaveBlob(blob, url);
			}
			else {
				var link = document.createElement('a');
				link.href = window.URL.createObjectURL(blob);
				link.download = url;
				link.click();
			}
		},
		complete : function() {
			canvas.style.display = 'none';
		}
	});
}

/*
 * highChart 초기화
 *
 * type : column(바차트) / line(꺽은선차트)
 * title : 차트 제목
 * stacking : 차트 형태 (normal , percent, 빈값)
 * unit : 세로축 단위 텍스트
 * calcBeginYear : 시작연도
 * calcEndYear : 마지막연도
 * chartData : json 데이터
 *
 */
function fnInitChart(type, title, stacking, unit, calcBeginYear, calcEndYear, data) {
	var yearArr = new Array();
	for(var year = calcBeginYear; year <= calcEndYear; year++) {
		yearArr.push(year);
	}

	Highcharts.chart('container', {
	    chart: {
	        type: type
	    },
	    title: {
	        text: title
	    },
	    xAxis: {
	        categories: yearArr,
	        tickWidth: 10
	    },
	    yAxis: {
	        title: {
	            text: unit
	        },
	        stackLabels: {
	            enabled: false,
	            style: {
	                fontWeight: 'bold',
	                color: ( // theme
	                    Highcharts.defaultOptions.title.style &&
	                    Highcharts.defaultOptions.title.style.color
	                ) || 'gray'
	            }
	        }
	    },
	    legend: {
	        align: 'right',
	        x: -30,
	        verticalAlign: 'top',
	        y: 0,
	        floating: true,
	        backgroundColor:
	            Highcharts.defaultOptions.legend.backgroundColor || 'white',
	        borderColor: '#CCC',
	        borderWidth: 1,
	        shadow: false
	    },
	    tooltip: {
	        headerFormat: '<b>{point.x}</b><br/>',
	        pointFormat: '{series.name}: {point.y}'
	    },
	    plotOptions: {
	        column: {
	            stacking: stacking,	//Whether to stack the values of each series on top of each other. "normal" to stack by value or "percent"
	            dataLabels: {
	                enabled: false
	            }
	        },
	        series: {
	        	maxPointWidth: 50
	        }
	    },
	    exporting: {	//context menu hide
	        enabled: true
	    },
	    series: data
	});

}

function autoMerge(grid, refresh) {
	var mc = [];
	var CM = grid.option("colModel");
	var i = 0;
	var data = grid.option("dataModel.data");

	var dataIndx = CM[i].dataIndx;
	var rc = 1;
	var j = data.length;

	while (j--) {
		var cd = data[j][dataIndx],
			cd_prev = data[j - 1] ? data[j - 1][dataIndx] : undefined;
		if (cd_prev !== undefined && cd == cd_prev) {
			rc++;
		}
		else if (rc > 1) {
			mc.push({ r1: j, c1: i, rc: rc, cc: 1 });
			rc = 1;
		}
	}
	grid.option("mergeCells", mc);
	if (refresh) {
		grid.refreshView();
	}
}

/**
 * pqgrid 자동 머지
 *
 * @param {Object} grid
 * @param {boolean} refresh
 * @param {Array} dataIndxList
 * gfnPgGridAutoMerge($("#pqGrid").pqGrid("getInstance").grid, true, ["busi_year", "sbjt_area_code_nm"]);
 */
function gfnPgGridAutoMerge(grid, refresh, dataIndxList){

	grid.option("mergeCells", grid.Merge().auto(dataIndxList));

	if (refresh) {
		grid.refreshView();
	}
}

/**
 * 돈표시
 */
function fnCurrencyFormat(val) {
	if (!fnIsEmpty(val)) {
		return fnCurrencyFormatter(val);
	} else {
		return "";
	}
}
/**
 * grid Height 설정
 */
function fnSetGridHeight(gridId, fixRowLength, fixRowSize, defaultHeight){
	var gridObj = $("#" + gridId);
	var gridModel = gridObj.pqGrid( "option", "dataModel" );
	var dataLength = gridModel.data.length;

	if (fixRowLength != undefined || fixRowLength == "") {
		fixRowLength = 2;
	}

	if (fixRowSize != undefined || fixRowSize == "") {
		fixRowSize = 45;
	}

	if (defaultHeight != undefined || defaultHeight == "") {
		defaultHeight = 50;
	}

	if(dataLength < 1){
		dataLength = 1;
	}else if(dataLength > fixRowLength){
		dataLength = fixRowLength + 1;
	}
	var gridHeight = (dataLength * fixRowSize) + defaultHeight;

	gridObj.pqGrid( "option", "height", gridHeight);
	gridObj.pqGrid("refreshDataAndView");
}

/**
 * form정보 validation
 */
function fnFormCheck(formName){

	var bPrevInputDisable = $('input').prop('disabled');
	var bPrevSelectDisable = $('select').prop('disabled');
	var bPrevTextareaDisable = $('textarea').prop('disabled');

	$('input').prop('disabled', false);
	$('select').prop('disabled', false);
	$('textarea').prop('disabled', false);

	var frmJsonArr = $("#"+formName).serializeArray();

	if(bPrevInputDisable){
		$('input').prop('disabled', true);
	}
	if(bPrevSelectDisable){
		$('select').prop('disabled', true);
	}
	if(bPrevTextareaDisable){
		$('textarea').prop('disabled', true);
	}



	var returnObj = {};
	var formObj = {};

	returnObj['return'] = true;

	if (frmJsonArr != null && frmJsonArr.length != 0) {
		for (var i = 0; i < frmJsonArr.length; i++) {
			var item = frmJsonArr[i];
			objName = item.name;
			formObj[objName] = item.value;

			if ($("#"+objName).attr("required") == "required") {
				if (fnIsEmpty(item.value)) {
					alert("["+$("#"+objName).attr("title")+"] 항목은 필수 입력 대상입니다. 데이터를 입력해 주세요.");
					$("#"+objName).focus();
					returnObj['return'] = false;
					break;
				}
			}
		}
	}
	returnObj['formData'] = formObj;
	return returnObj;

}

function fnGetDate(diff){


	var today = new Date();
	if(diff == undefined) diff= 0;
	 var diday = today.getDate()+diff
	today.setDate(diday);
	var year = today.getFullYear();
	var month = ('0' + (today.getMonth() + 1)).slice(-2);
	var day = ('0' + today.getDate()).slice(-2);

	return year +  month  + day;

}

function fnGetDateDash(diff){


	var today = new Date();
	if(diff == undefined) diff= 0;
	 var diday = today.getDate()+diff
	today.setDate(diday);
	var year = today.getFullYear();
	var month = ('0' + (today.getMonth() + 1)).slice(-2);
	var day = ('0' + today.getDate()).slice(-2);

	return year + "-" + month + "-" + day;

}

function fnRegFormatter(val, formatName){

	if(formatName == "day" ){
		return  val.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
	}
}

function fnPqGridExcelDown(pqGridId, fileNm) {




	fileNm = fnNvl(fileNm, $('#menu_title').text());

	console.log('fileNm : ', fileNm);

	var grid = pq.grid("#"+pqGridId);

	var format = 'xlsx',
	blob = grid.exportData({
			format: format,
			nopqdata: true, //applicable for JSON export.
			render: false
		});
	if(typeof blob === "string"){
		blob = new Blob([blob]);
	}

	var date = new Date();

	var yyyy = date.getFullYear().toString();
	var mm = (date.getMonth() + 1).toString();
	var dd = date.getDate().toString();
	var now = yyyy + (mm[1] ? mm : '0'+mm[0]) + (dd[1] ? dd : '0'+dd[0]);

	var fileName = fileNm+"_"+now;
	saveAs(blob, fileName + "."+ format );
}

function fnPqGridHeaderCenterAlign() {
	$('[pq-row-indx="0"]').each(function(index, item) {
		if ($(item).hasClass('pq-align-right') || $(item).hasClass('pq-align-left')) {
			$(item).attr("class","pq-grid-col pq-align-center  pq-grid-col-leaf");
		}
	});
}

function fnNvl(val, returnVal){
	var result = val;
	if(result == null | result == ""){
		result = returnVal;
	}
	return result;
}

function fnFileDownload(downUrl) {
	$.fileDownload(downUrl)
	.fail(function() {
			alert('파일 다운로드에 실패하였습니다.');
		});
	return false;
}

function fnGetDateStr(date) {
	var year = date.getFullYear();
	var month = (date.getMonth() + 1);
	var day = date.getDate();

	month = (month < 10) ? "0"+ String(month) : month;
	day = (day < 10) ? "0"+ String(day) : day;

	return year + "-" + month + "-" + day;
}

function fnGetDateMonthStr(date) {
	var year = date.getFullYear();
	var month = (date.getMonth() + 1);
	var day = date.getDate();

	month = (month < 10) ? "0"+ String(month) : month;
	day = (day < 10) ? "0"+ String(day) : day;

	return year + "-" + month;
}

function escapeHtml (string) {
	return String(string).replace(/[&<>"'`=\/]/g, function (s) { return entityMap[s]; });
}

function escapeHtmlFile (string) {
	return String(string).replaceAll([/[&<>"'`=\/]/g],'_');
}
function unescapeFile(str) {

	if (str == null || fnIsEmpty(str)) {
		return "";
	}
	return String(str).replace(/&amp;/g, '_').replace(/&lt;/g, '_').replace(/&gt;/g, '_').replace(/&quot;/g, '_').replace(/&apos;/g, "_");
}


function unescapeHtml(str) {

	if (str == null || fnIsEmpty(str)) {
		return "";
	}

	return String(str).replaceAll(/&amp;/g, '&').replaceAll(/&lt;/g, '<').replaceAll(/&gt;/g, '>').replaceAll(/&quot;/g, '"').replaceAll(/&apos;/g, "'").replaceAll(/&#x2F;/g, '/').replaceAll(/&#x60;/g,'`').replace(/&#x3D;/g, "=").replaceAll(/&lt;script&gt;/g,'').replaceAll(/<script>/g,'');
}

function unescapeHtmlTitle(str) {

const pattern = /[^0-9-가-힣A-Za-z\[\]]/g;
	if (str == null || fnIsEmpty(str)) {
		return "";
	}
	return String(str).replace(pattern, ' ');
}

function gfn_locationHref(pUrl) {
	location.href = CONST_CONTEXT_PATH + pUrl;
}

/*
* 함수명 : gfn_alert
* title : 메세지 타이틀
* text : 메세지
* icon : success, info, warning, error
* 사용법 :
	gfn_alert('', '정상적으로 처리되었습니다.', 'success');
*/
function gfn_alert(title, text, icon, callBackFn){

	if(fnIsEmpty(callBackFn)){
	    Swal.fire({
	      title: title,
	      html: text,
	      icon: icon,
	      showCancelButton: false,
	      confirmButtonColor: '#3085d6',
		  confirmButtonText: '확인',
		  returnFocus: false
	    });
	}else {
	    Swal.fire({
	      title: title,
	      html: text,
	      icon: icon,
	      showCancelButton: false,
	      confirmButtonColor: '#3085d6',
	      cancelButtonColor: '#d33',
	      confirmButtonText: '확인',
	      cancelButtonText: '취소',
	      reverseButtons: true, // 버튼 순서 거꾸로
		  returnFocus: false
	    }).then((result) => {
			if(!fnIsEmpty(callBackFn)){
				callBackFn();
			}
	    });
	}
}

/*
* 함수명 : gfn_confirm
* title : 메세지 타이틀
* text : 메세지
* callBackFn : 콜백함수
* 사용법 :
	gfn_confirm('', '저장하시겠습니까?', function(){
		// OK
	});
*/
function gfn_confirm(title, text, callBackFn){

    Swal.fire({
      title: title,
      html: text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: '확인',
      cancelButtonText: '취소',
      reverseButtons: true, // 버튼 순서 거꾸로

    }).then((result) => {
		if (result.isConfirmed) {
			if(!fnIsEmpty(callBackFn)){
				callBackFn();
			}
      	}
    });
}

// 날짜형식체크 yyyy-mm-dd
function fnGetDateChk(targetId){

	let data = $.trim($('#' + targetId).val());

	if(data.replaceAll("-", "").length != 8){
		return false;
	}

    var date = $('#' + targetId).val().split("-");
    var y = parseInt(date[0], 10),
        m = parseInt(date[1], 10),
        d = parseInt(date[2], 10);

    var dateRegex = /^(?=\d)(?:(?:31(?!.(?:0?[2469]|11))|(?:30|29)(?!.0?2)|29(?=.0?2.(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00)))(?:\x20|$))|(?:2[0-8]|1\d|0?[1-9]))([-.\/])(?:1[012]|0?[1-9])\1(?:1[6-9]|[2-9]\d)?\d\d(?:(?=\x20\d)\x20|$))?(((0?[1-9]|1[012])(:[0-5]\d){0,2}(\x20[AP]M))|([01]\d|2[0-3])(:[0-5]\d){1,2})?$/;

	if(!dateRegex.test(d+'-'+m+'-'+y)){
		return false;
	}

	return true;
}

// from to Date 체크
function fnGetFromToDateChk(fromDateId, toDateId){
	var fromDateValue = $('#' + fromDateId).val();
	var toDateValue = $('#' + toDateId).val();

	if(fnIsEmpty(fromDateValue) || fnIsEmpty(toDateValue)){
		return false;
	}

	if(!fnGetDateChk(fromDateId) || !fnGetDateChk(toDateId)){
		return false;
	}

	if(fromDateValue > toDateValue){
		return false;
	}

	return true;
}

/**
 * null 여부 확인
 *
 * @param {object} obj null을 확인할 객체
 * @return {boolean}
 */
function gfnIsEmpty(obj){

	 if(cfnNvl(obj) == ""){
		 return true;
	 }else{
		 return false;
	 }
}

/**
 * null을 공백으로 치환한다.
 *
 * @param {object} obj null을 확인할 객체
 * @return {object}
 */
function cfnNvl(obj){

	 if(!obj || obj == null || obj == "" || obj == "undefined" || obj == undefined || (typeof(obj) == "string" && obj.trim() == "") || obj == "null"){
		 return "";
	 }else{
		 return obj;
	 }
}

/**
 * form action 설정
 *
 * @param {formId} form id
 * @param {actionUrl} action url
 */
function gfnSetFormAction(formId, actionUrl){

	$("#" + formId).attr("method", "POST");
	$("#" + formId).attr("action", CONST_CONTEXT_PATH + actionUrl);
}


function fnPutAjaxFormData(/* String */ pUrl, /* FormData */ pFormData, /* String */ pCallBackFn )
{
	try {

		pUrl = CONST_CONTEXT_PATH+pUrl;
		$.ajax({
			type: "post",
			url: pUrl,
			enctype: "multipart/form-data",
			processData: false,
			contentType: false,
			data: pFormData,
			async: true,
			cache: false,
			beforeSend : function(request){
				request.setRequestHeader("AJAX", true);
		 	},
			success : function(_data, status, request) {
				if (_data.resultCode == "noAuth") {
					alert(_data.resultMsg);
					if (window.opener != null && typeof(window.opener.top) == "object") {	//부모창이 존재하면
						opener.top.location.href = loginUrl;
					} else {
						location.href = loginUrl;
					}
				} else {
					pCallBackFn(_data);
				}
			},
			complete: function(){

			},
		    error: function(request, status, error) {
		    	if (request.status =="403") {
		    		alert("로그인 정보가 없습니다. 로그인 하셔야 이용하실 수 있습니다.");
					if (window.opener != null && typeof(window.opener.top) == "object") {	//부모창이 존재하면
						opener.top.location.href = loginUrl;
					} else {
						location.href = loginUrl;
					}
		    	} else {
		    		window.error = error;
					alert(error);
		    	}
			}
		});
	} catch(e) {
		console.log(e)
		alert("에러가 발생하였습니다.");
	}

}

function fnPutSyncAjaxFormData(/* String */ pUrl, /* FormData */ pFormData, /* String */ pCallBackFn )
{
	try {

		pUrl = CONST_CONTEXT_PATH+pUrl;
		$.ajax({
			type: "post",
			url: pUrl,
			enctype: "multipart/form-data",
			processData: false,
			contentType: false,
			data: pFormData,
			async: false,
			cache: false,
			beforeSend : function(request){
				request.setRequestHeader("AJAX", true);
		 	},
			success : function(_data, status, request) {
				if (_data.resultCode == "noAuth") {
					alert(_data.resultMsg);
					if (window.opener != null && typeof(window.opener.top) == "object") {	//부모창이 존재하면
						opener.top.location.href = loginUrl;
					} else {
						location.href = loginUrl;
					}
				} else {
					pCallBackFn(_data);
				}
			},
			complete: function(){

			},
		    error: function(request, status, error) {
		    	if (request.status =="403") {
		    		alert("로그인 정보가 없습니다. 로그인 하셔야 이용하실 수 있습니다.");
					if (window.opener != null && typeof(window.opener.top) == "object") {	//부모창이 존재하면
						opener.top.location.href = loginUrl;
					} else {
						location.href = loginUrl;
					}
		    	} else {
		    		window.error = error;
					alert(error);
		    	}
			}
		});
	} catch(e) {
		console.log(e)
		alert("에러가 발생하였습니다.");
	}

}

 function gfnGetStringDateYMD() {

	    var date = new Date();

	    var month;
	    var days;
	    var hour;
	    var min;
	    var sec;

	    if (Number(date.getMonth() + 1) < 10) {
	        month = "0" + Number(date.getMonth() + 1);
	    } else {
	        month = Number(date.getMonth() + 1);
	    }

	    if (Number(date.getDate()) < 10) {
	        days = "0" + date.getDate();
	    } else {
	        days = date.getDate();
	    }

	    var today = {
	        year : String(date.getFullYear()),
	        mon : String(month),
	        day : String(days)
	    };

	    var fullString = today.year + "-" + today.mon + "-" + today.day;

	    return fullString;
}

/**
 * 한글 종성 처리
 *
 * @param {String} pText
 * @param {Number} pType
 * pType 종류
 * 1 = 을/를 , 2 = 이/가 , 3 = 은/는, default = 1
 * gfnGetJongSung("홍길동", 1);
 */
function gfnGetJongSung(pText, pType){

	var charCode = pText.charCodeAt(pText.length - 1);

	if(gfnIsEmpty(pType) || isNaN(pType)){
		pType = 1;
	}

	pType = Number(pType);
	pType--;

	var arrDefText = ["을(를)", "이(가)", "은(는)"];

	if(charCode < 0xAC00 || charCode > 0xD7A3){
		return pText + arrDefText[pType];
	}

	var arrType = ["을,를", "이,가", "은,는"];
	var lc = 1;

	if((charCode - 0xAC00) % 28 > 0){
		lc = 0;
	}

	return pText + arrType[pType].split(",")[lc];
}


/**
 * pqgrid 머지
 *
 * @param {Object} grid
 * @param {boolean} refresh
 * merge가 필요한 컬럼에만 colModel에 mergeKey 속성 추가
 * 	값으로 merge 시 : {title: "사업연도", dataType: "string", dataIndx: "busi_year", editable: false, mergeKey: "val"}
 * 	key로 merge 시 : {title: "사업연도", dataType: "string", dataIndx: "busi_year", editable: false, mergeKey: "sbjt_id"}
 * 호출예 : gfnPgGridMerge($("#pqGrid").pqGrid("getInstance").grid, true);
 */
function gfnPgGridMerge(grid, refresh){

	var mc = [];
	var gridColModel = grid.getColModel();
	var cmLen = gridColModel.length;
	var gridData = grid.option("dataModel.data");

    while(cmLen--){

		if(!gridColModel[cmLen].mergeKey){
			continue;
		}

		var rc = 1
		var dataLength = gridData.length;
		var dataIndx = gridColModel[cmLen].dataIndx;
		var mergeKey = gridColModel[cmLen].mergeKey;

        while(dataLength--){

            var mergeValue = gridData[dataLength][mergeKey];
			var prevMergeValue = gridData[dataLength - 1] ? gridData[dataLength - 1][mergeKey] : undefined;

			if(gridColModel[cmLen].mergeKey == "val"){

				mergeValue = gridData[dataLength][dataIndx];
				prevMergeValue = gridData[dataLength - 1] ? gridData[dataLength - 1][dataIndx] : undefined;
			}

            if(prevMergeValue !== undefined && mergeValue == prevMergeValue) {

                rc++;

            }else if (rc > 1) {

                mc.push({ r1: dataLength, c1: cmLen, rc: rc, cc: 1 });
                rc = 1;
            }
        }
    }

	grid.option("mergeCells", mc);

	if (refresh) {
		grid.refreshView();
	}
}

// 사업자등록번호 유효성 체크
function gfnIsValidbusirNo(number){
	var numberMap = number.replace(/-/gi, '').split('').map(function (d){
		return parseInt(d, 10);
	});

	if(numberMap.length == 10){
		var keyArr = [1, 3, 7, 1, 3, 7, 1, 3, 5];
		var chk = 0;

		keyArr.forEach(function(d, i){
			chk += d * numberMap[i];
		});

		chk += parseInt((keyArr[8] * numberMap[8])/ 10, 10);
		return Math.floor(numberMap[9]) === ( (10 - (chk % 10) ) % 10);
	}

	return false;
}

/* null을 빈값으로 치환
 * @author : hsp
 * @param  : obj
 * @return : boolean
 */
function gfnNvl(obj){

	 if(!obj || obj == null || obj == "" || obj == "undefined" || obj == undefined || (typeof(obj) == "string" && obj.trim() == "") || obj == "null"){
		 return "";
	 }else{
		 return obj;
	 }
}

/* null 확인
 * @author : hsp
 * @param  : obj
 * @return : boolean
 */
function gfnChkNull(obj){

	 if(!obj || obj == null || obj == "" || obj == "undefined" || obj == undefined || (typeof(obj) == "string" && obj.trim() == "")){
		 return true;
	 }else{
		 return false;
	 }
}

/* 빈값인 경우 0 반환
 * @author : hsp
 * @param  : value
 * @return : comma value
 */
function gfnCommaNvlZero(value) {

	if(gfnChkNull(value)){
		return 0;
	}

	try{
		value = String(value);
		value = value.replaceAll(",","");
		return value.replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,');
	}catch(e){
		return value;
	}
}




function gfnTooltipRender(ui) {

    return {
        attr: {
            title: ((ui.formatVal || "") + "").replace(/"/g, '&quot;')
        }
    }
}

// 쿠키 가져오기
function gfnGetCookie(cname) {

	let name = cname + "=";
  	let decodedCookie = decodeURIComponent(document.cookie);
  	let ca = decodedCookie.split(';');

  	for(let i = 0; i <ca.length; i++) {
    	let c = ca[i];
    	while (c.charAt(0) == ' ') {
      		c = c.substring(1);
    	}

    	if (c.indexOf(name) == 0) {
      		return c.substring(name.length, c.length);
    	}
  	}
  	return "";
}

// 쿠키 삭제
function gfnDeleteCookie(name) {

	document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

function gfnFormatNumber(input) {
      // 현재 입력값에서 쉼표를 제거
      var inputValue = input.value.replace(/,/g, '');
      // 숫자 이외의 문자 제거
      inputValue = inputValue.replace(/\D/g, '');
      // 숫자를 #,### 형식으로 변환
      inputValue = Number(inputValue).toLocaleString();
      // 입력 필드에 형식화된 숫자 설정
      input.value = inputValue;
}

/* form데이터를 json으로 반환(파일은 변환 안됨)
 * @author : hsp
 * @param : form id
 * @return : json
 */
function gfnGetFormDataToJson(pFormId){

	try{

		let formSerializeArray = $('#' + pFormId).serializeArray();

		let jsonData = {};

		$.each(formSerializeArray, function(idx, ref){

			jsonData[ref.name] = ref.value;

		});

		return jsonData;

	}catch(e){

	}
}

/* HTML 엔티티 디코딩 헬퍼 함수(gfnDecodeHtmlEntities)
 * @author : sbkong
 * @param : text
 * @return : text
 */
function gfnDecodeHtmlEntities(text){
	if( text === null || text === "" ) return;
	
	var textarea = document.createElement( 'textarea' );
	
	textarea.innerHTML = text;
	
	reText = textarea.value;
	
	reText = 	gfnDecodeHtml(reText);
	return reText;
}


/* HTML 엔티티 디코딩 헬퍼 함수(gfnDecodeHtmlEntities)
 * @author : sbkong
 * @param : text
 * @return : text
 */
function gfnDecodeHtml(encodedStr){
	if( encodedStr === null || encodedStr === "" ) return;
	var text = "";
	
	text = encodedStr.replaceAll("&amp;", "&")
					 .replaceAll("&quot;", "\"")
					 .replaceAll("&amp;quot;", "\"")
					 .replaceAll("&#34", "\"")
					 .replaceAll("&#60", "<")
					 .replaceAll("&lt", "<")
					 .replaceAll("&#62", ">")
					 .replaceAll("&;\\s?quot;", "\"")
					 .replaceAll("\\s", "")
					 .replaceAll("&gt", ">")
					 .replaceAll("&apos", "'")
					 .replaceAll("&comma", ",")
					 .replaceAll("&colon", ":")
					 .replaceAll("&semo", ";");

	return text;
}

function gfnTitleRepace(str){
	if( str === null || encodedStr === "" ) return;
	var text = "";
	
	text = encodedStr.replaceAll( "&", "&amp")
					 .replaceAll("\"", "&quot")
					 .replaceAll("\"", "&amp;quot;" )
					 .replaceAll("\"", "&#34" )
					 .replaceAll("<", "&#60" )
					 .replaceAll("<","&lt")
					 .replaceAll(">","&#62" )
					 .replaceAll( "\"","&;\\s?quot;")
					 .replaceAll( "","\\s")
					 .replaceAll( ">","&gt")
					 .replaceAll( "'","&apos")
					 .replaceAll(",", "&comma" )
					 .replaceAll(",","&colon")
					 .replaceAll( ";","&semo");

	return text;
}


function checkLoginException(){
	const urlParams = new URLSearchParams(window.location.search);
	if(urlParams.get('exception') === 'duplicate'){
		alert('다른 기기에서 로그인되어 로그아웃되었습니다.');
		
		//파라미터 제거(뒤로가기 시 중복 alert 방지)
		history.replaceState({}, null, location.pathname);
	}
}
/*
* <PRE>
*  작성자	  : kbin052
*  작성일	  : 2026. 01. 21
*  Comment   : 불법광고 검색 키워드 필터링 (input작용)
* </PRE>
*/
function initInputFilter(extraWords){
	
		// 금칙어 단어리스트
		let bannedWords = [];
		if(extraWords) {
			// 배열로 들어오면 그대로 사용 아닐경우 ,로 잘라서 배열변환
			if(Array.isArray(extraWords)){
				bannedWords = extraWords;
			}else if(typeof extraWords === "string"){
				bannedWords = extraWords.split(",");				
			}
		}
		
		//중복 바인딩 방지
		$(document).off("input_inputFilter");
		
		if(bannedWords.length > 0) {
			
				if(bannedWords.length > 0) {
			// 키보드로 입력 검사
			$(document).on("keyup.inputFilter", "input[type='text']", function() {
			
			let $this = $(this);
			let thisValue = $this.val() || "";
			
				bannedWords.forEach(function(word) {
				
				let cleanWord = word.trim();
					if(cleanWord === ""){
						return;
						}
						
						
						let charArray = cleanWord.split('');
						let regexPattern = charArray.map(function(char) {
							return char.replace("[.*+?^${}()|[\]\\]/g", '\\$&');
						}).join('[^a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ]*');
						
						let matcher = new RegExp(regexPattern, "gi");
						
						if(thisValue.match(matcher)) {
							thisValue = thisValue.replace(matcher,"");
							$this.val(thisValue);
	
							gfn_alert('', "<strong>[안내] 입력하신 내용에 제한 단어가 포함되어 있습니다.</strong><br><br>안전한 서비스 이용을 위해 홍보, 사행성, 비속어 등의<br>부적절한 단어는 등록이 어렵습니다.<br>작성하신 내용을 다시 한번 확인해 주시기 바랍니다.", 'error');
						}
					});
				});
			}
		}
		
		// 붙여넣기 막기
		$(document).on("paste.inputFilter", "input[type='text']", function (e){
			
			let $this = $(this);
			let before = $this.val() || "";
			
			let paste =(e.originalEvent.clipboardData || window.ClipboardData).getData("text");
			let after = before + paste;
			
			bannedWords.forEach(function (word){
				if(after.indexOf(word) !== -1){
					e.preventDefault();
					gfn_alert('', "<strong>[안내] 입력하신 내용에 제한 단어가 포함되어 있습니다.</strong><br><br>안전한 서비스 이용을 위해 홍보, 사행성, 비속어 등의<br>부적절한 단어는 등록이 어렵습니다.<br>작성하신 내용을 다시 한번 확인해 주시기 바랍니다.", 'error');
				}
			});
		});
}
/*
* <PRE>
*  작성자	  : kbin052
*  작성일	  : 2026. 01. 21
*  Comment   : 불법광고 검색 키워드 필터링 (toastui작용)
* </PRE>
*/
function bindGridFilter(grid, extraWords){
	
	
		if(!grid){
			console.warn("bindGridFilter : editor가 없습니다.");
			return;
		}
	
		let bannedWords = [];
		if(extraWords) {
			// 배열로 들어오면 그대로 사용 아닐경우 ,로 잘라서 배열변환
			if(Array.isArray(extraWords)){
				bannedWords = bannedWords.concat(extraWords);
			}else if(typeof extraWords === "string"){
				let splitWords = extraWords.split(",").map(function(w) {
					return w.trim();
					});
				bannedWords = bannedWords.concat(splitWords);				
			}
		}
		grid.on('change', function(){
			let text = grid.getHTML();
			let filtered = text;
			let isChanged = false;
			
			for(let i =0; i < bannedWords.length; i++){
				let word = bannedWords[i];
				if(!word) continue;
				
				let regexPattern = word.split('').join("[^a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ]*");
				
				let matcher = new RegExp(regexPattern, "gi");
				
				if(filtered.match(matcher)){
					isChanged = true;
					filtered = filtered.replace(matcher, "");
				}
				
			}
			if(isChanged && filtered !== text){
					gfn_alert('', "<strong>[안내] 입력하신 내용에 제한 단어가 포함되어 있습니다.</strong><br><br>안전한 서비스 이용을 위해 홍보, 사행성, 비속어 등의<br>부적절한 단어는 등록이 어렵습니다.<br>작성하신 내용을 다시 한번 확인해 주시기 바랍니다.", 'error');
					grid.setHTML(filtered);
			}
		});
}