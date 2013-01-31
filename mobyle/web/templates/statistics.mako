<%inherit file="statistics_layout.mako"/>
<div class="row">
<h2>Top programs</h2>
<table class="table">
<thead><tr><th>Name</th><th>Total</th></tr>
<%
 i = 0
 total = 0
%>
% for job in jobs.find().sort("value",-1):
    % if i<10:
    <% total += job['value'] %>
    <tr><td>${job['_id']}</td><td>${job['value']}</td></tr>
    % endif
    <% i += 1 %>
% endfor
</table>
</div>
<div class="row">
<div class="span4"><h2>Jobs : ${total}</h2></div><div class="span4"><h2>Programs : ${programs}</h2></div>
</div>


