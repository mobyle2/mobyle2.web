<%inherit file="statistics_layout.mako"/>

<h2>Top programs</h2>
<table class="table">
<thead><tr><th>Name</th><th>Total</th></tr>
% for job in jobs.find().sort("value",-1).limit(10):
    <tr><td>${job['_id']}</td><td>${job['value']}</td></tr>
% endfor
</table>


