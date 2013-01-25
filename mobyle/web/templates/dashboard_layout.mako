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
  <link rel="stylesheet" href="/static/css/mf.css">
  <script src="/static/js/jquery-1.8.3.min.js"></script>
  <script src="/static/js/mf.js"></script>
</head>

<body>
<ul class="nav nav-tabs">
  <li class="active">
    <a href="#" id="dashboard" class="dashboard-item">Dashboard</a>
  </li>
  % for object in objects:
  <li><a href="#" class="dashboard-item" id="${object}">${object}s</a></li>
  % endfor
  <li><a href="/admin/stats">Statistics</a></li>
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
    
    ${next.body()}

  </div>
  <script src="/static/bootstrap/js/bootstrap.min.js"></script>  
  <script>
    $(document).ready(function(){
    });
  </script>
</body>
</html>
