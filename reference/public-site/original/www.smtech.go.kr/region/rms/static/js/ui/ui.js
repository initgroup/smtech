$(document).ready(function() {

	$(".jsBtnClose1").on("click", function(){
		if ( $(this).attr("href") )
			$( $(this).attr("href") ).removeClass("active");
		else
		{
			$(this).parent().parent().parent().parent().removeClass("active");
		}
		return false;
	});

	$(".mPopup1 .close").on("click", function(){
		$(this).parent().parent().removeClass("active");
		return false;
	});

	/* tab */
	$(".jsTab1 > a").on("click", function(){
		$(this).parent().children().removeClass("active");
		$(this).addClass("active");
		$(this).parent().parent().children(".tabCont").addClass("hidden");
		$( $(this).attr("href") ).removeClass("hidden");
		return false;
	});
	/* //tab */

	/* show popup when load */
	$(window).on("load", function(){
		if( window.location.href.split( "#" )[1] )
		{
			$("body").addClass("hiddenScroll");
			$("#" + window.location.href.split( "#" )[1] ).addClass("active");
			$("#" + window.location.href.split( "#" )[1] ).css("top", "0");
		}
	});
	/* //show popup when load */

	/* calendar */
	$(".date").datepicker({
		dateFormat: 'yy-mm-dd',
		prevText: '이전 달',
		nextText: '다음 달',
		monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
		monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
		dayNames: ['일', '월', '화', '수', '목', '금', '토'],
		dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
		dayNamesMin: ['일', '월', '화', '수', '목', '금', '토'],
		showMonthAfterYear: true,
		yearSuffix: '년',
		changeYear: true,
		changeMonth: true,
		showAnim: "slide",
		beforeShow: function(input, inst) {
		   $('#ui-datepicker-div').removeClass("yearpicker");
	   }
	});
	options = {
		pattern: 'yyyy-mm', // Default is 'mm/yyyy' and separator char is not mandatory
		selectedYear: 2022,
		startYear: 2022,
		finalYear: 2200,
		monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
	};
	$('.month').monthpicker(options);
	/* /calendar */

	// 길이
	$(".date").attr("maxlength", "10");

	// date 자동 대시
	$(".date").keyup(function(e){

		if(e.keyCode === 8){ //
			return;
		}

		var domYmd = $(this).val().replace(/[^0-9]/g,"");
		var retYmd = "";

		if(domYmd.length < 4) {

            return;

        }else if(domYmd.length < 6){

            retYmd += domYmd.substr(0, 4);
            retYmd += "-";
            retYmd += domYmd.substr(4);

        }else{

            retYmd += domYmd.substr(0, 4);
            retYmd += "-";
            retYmd += domYmd.substr(4, 2);
            retYmd += "-";
            retYmd += domYmd.substr(6);
        }

		$(this).val(retYmd);

	});


});
