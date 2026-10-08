/* @owner integration | @since 1.1.0
 * 내부 개발자 관리 파일. 퍼블리싱 업데이트로 덮어쓰지 마세요.
 * routes/CSRF/login/logout을 내부 서버에 맞게 구현하세요. 변경 명령은 contracts/commands.json 참조. */
(function(window){'use strict';
window.RMSIntegration={mode:'server',adapter:window.RMSHttpAdapter.create({request:window.RMSHttpAdapter.transport({routes:{bootstrap:'/rms/api/bootstrap'}})}),login:function(){window.location.assign('/rms/login');},logout:function(){window.location.assign('/rms/logout');}};
}(window));
