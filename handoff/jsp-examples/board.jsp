<%-- INTERNAL STARTER: copy into WEB-INF/views/rms/board.jsp in the internal project.
     @since RMS-PUB-20261008-01
     Controller model: boardTitle:String, boardType:String, query:String, rows:List<BoardRow>.
     BoardRow: id,title,date,category. Controller must return only authorized public rows.
     JSTL URI assumes the existing Java EE application; adapt to the installed tag library.
     Example URLs are placeholders to map to your existing controllers.
--%>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<c:url var="listUrl" value="/rms/boards/list.do" />
<section class="rms-enhance" data-rms-screen="board" data-jsp-board>
  <div class="rms-pagehead">
    <div><h1 id="rms-main" tabindex="-1"><c:out value="${boardTitle}" /></h1></div>
  </div>
  <section class="rms-panel">
    <form method="get" action="<c:out value='${listUrl}' />" class="rms-searchbar">
      <input type="hidden" name="type" value="<c:out value='${boardType}' />">
      <div class="rms-field">
        <label for="board-query">검색어</label>
        <input id="board-query" name="q" type="search" value="<c:out value='${query}' />">
      </div>
      <button class="rms-btn rms-btn-primary" type="submit">검색</button>
    </form>
    <div class="rms-tablewrap" tabindex="0" role="region" aria-label="게시판 목록 가로 스크롤">
      <table class="rms-table">
        <caption><c:out value="${boardTitle}" /> 목록</caption>
        <thead><tr><th scope="col">분류</th><th scope="col">제목</th><th scope="col">등록일</th></tr></thead>
        <tbody>
          <c:forEach items="${rows}" var="row">
            <c:url var="detailUrl" value="/rms/boards/detail-fragment.do">
              <c:param name="type" value="${boardType}" />
              <c:param name="id" value="${row.id}" />
            </c:url>
            <tr>
              <td><c:out value="${row.category}" /></td>
              <td><button type="button" class="rms-link" data-jsp-detail="<c:out value='${detailUrl}' />"><c:out value="${row.title}" /></button></td>
              <td><c:out value="${row.date}" /></td>
            </tr>
          </c:forEach>
          <c:if test="${empty rows}"><tr><td colspan="3">조회 결과가 없습니다.</td></tr></c:if>
        </tbody>
      </table>
    </div>
  </section>
  <dialog class="rms-dialog rms-dialog-program" aria-labelledby="board-dialog-title">
    <div class="rms-dialoghead">
      <h2 id="board-dialog-title" tabindex="0" data-dialog-move>게시글 상세</h2>
      <button type="button" data-jsp-close aria-label="상세 닫기">×</button>
    </div>
    <div class="rms-dialogbody" data-jsp-detail-body></div>
  </dialog>
  <p class="rms-error" data-jsp-error role="alert" hidden></p>
</section>
<%-- In your shared layout, load the original CSS then rms-tokens/rms-enhance/rms-home-refresh.
     Load common/layers.js then your owned copy of jsp-board.js with defer.
     Do not load prototype app.js/demo-store.js on this server-rendered JSP page.
--%>
