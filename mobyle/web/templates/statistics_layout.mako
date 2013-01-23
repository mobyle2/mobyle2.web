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
</head>

<body>
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
