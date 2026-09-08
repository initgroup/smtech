$(document).ready(function() {

	// 접수서류 전체 다운로드
	$('#btn_download_pblanc_rcept').click(function(){

		gfn_confirm('', '접수된 서류를 모두 다운로드하시겠습니까?', function(){

			location.href = CONST_CONTEXT_PATH + '/combiz/file/downloadRceptZipFile.do?pblanc_id=' + $('#pblancId').val();
		});
	});
});

function fnClose(){
	if(window.opener == null){
		parent.fn_bClose();
	}else{
		parent.close();
	}
}

