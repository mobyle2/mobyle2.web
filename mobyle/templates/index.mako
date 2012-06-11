<!DOCTYPE HTML>
<html>
<head>
<title>test</title>
</head>

<body>
<div>
OpenID login:
<form action="/login/openid" method='post'>
<input type="text" name="openid_identifier"/>
<input type="submit" value="Login with openid" />
</form>
</div>

<hr />

Add a program:
<form action="" method="post">
<input type='text' name='progname' />
<input type='submit' value='add program' />
</form>
    
<hr />

import a platform:
<form action="" method="post">
<input type='text' name='platformurl' />
<input type='submit' value='platform!' />
</form>

<hr />


<div>
Program list:
%for p in programs:
    ${p['name']} <br />
%endfor
</div>

</body>


</html>