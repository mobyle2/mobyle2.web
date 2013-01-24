# -*- coding: utf-8 -*- 
<!DOCTYPE html>  
<html>
<head>
	
  <meta charset="utf-8">
  <title>Mobyle BioInformatics Portal</title>
  <meta name="author" content="Mobyle team">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="shortcut icon" href="/static/favicon.ico">
  <link rel="stylesheet" href="/static/bootstrap/css/bootstrap.min.css" media="screen">
  <link rel="stylesheet" href="/static/bootstrap/css/bootstrap-responsive.min.css">
  <script src="/static/js/jquery-1.8.3.min.js"></script>
  <link rel="stylesheet" href="/static/css/jquery-jvectormap-1.2.2.css" type="text/css" media="screen"/>
  <script src="/static/js/jquery-jvectormap-1.2.2.min.js"></script>
  <script src="/static/js/jquery-jvectormap-world-mill-en.js"></script>
  <link rel="stylesheet" href="/static/css/statistics.css" type="text/css" media="screen"/>
</head>

<body>
<ul class="nav nav-tabs">
  <li class="active">
    <a href="/admin" id="dashboard" class="dashboard-item">&lt;&lt; Dashboard</a>
  </li>
  <li>
    <a href="/admin/stats" class="dashboard-item">Statistics </a>
  </li>
</ul>

  % if request.session.peek_flash():
  <div id="flash">
    <% flash = request.session.pop_flash() %>
	% for message in flash:
	${message}<br>
	% endfor
  </div>
  % endif

  <div id="page">
   <div class="row">
    <div class="span2 menubar bs-docs-sidebar">
      <ul class="nav nav-list bs-docs-sidenav affix">
        <li><a href="/admin/stats/map"><i class="icon-chevron-right"></i> World map</a></li>
        <li><a href="/admin/stats/usage?type=0"><i class="icon-chevron-right"></i> Hourly usage</a></li>
        <li><a href="/admin/stats/usage?type=1"><i class="icon-chevron-right"></i> Daily usage</a></li>
        <li><a href="/admin/stats/usage?type=2"><i class="icon-chevron-right"></i> Monthly usage</a></li>
        <li><a href="/admin/stats/user"><i class="icon-chevron-right"></i> Users</a></li>
    </div>
    <div class="span10">
    ${next.body()}
    </div>
   </div>
  </div>
  <script src="/static/bootstrap/js/bootstrap.min.js"></script>  
  <script>
    $(document).ready(function(){
    });
  </script>
</body>
</html>
