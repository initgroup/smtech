<%-- Controller returns text/html after checking read access to the requested board/id.
     @since RMS-PUB-20261008-01 | Model: row(title,category,date,body,answer).
     Use c:out for all externally supplied values; do not output stored HTML unescaped.
--%>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<article class="rms-board-detail">
  <h3><c:out value="${row.title}" /></h3>
  <p class="rms-muted"><c:out value="${row.category}" /> · <c:out value="${row.date}" /></p>
  <div class="rms-program-text rms-space"><c:out value="${row.body}" /></div>
  <c:if test="${not empty row.answer}">
    <section class="rms-note rms-space"><h4>답변</h4><p class="rms-program-text"><c:out value="${row.answer}" /></p></section>
  </c:if>
</article>
