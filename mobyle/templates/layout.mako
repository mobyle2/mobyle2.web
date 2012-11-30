# -*- coding: utf-8 -*- 
<!DOCTYPE html>  
<html>
<head>
	
  <meta charset="utf-8">
  <title>Mobyle BioInformatics Portal</title>
  <meta name="author" content="Mobyle team">
  <link rel="shortcut icon" href="/static/favicon.ico">
  <link rel="stylesheet" href="/static/style.css">
  <link rel="stylesheet" href="/static/bootstrap/bootstrap.min.css">
  <link rel="stylesheet" href="/static/bootstrap/bootstrap-responsive.min.css">
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
</body>
</html>
