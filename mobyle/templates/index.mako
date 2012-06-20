<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
  "http://www.w3.org/TR/html4/loose.dtd">

<html>

<head>
<title>test</title>

</head>
<body>

You are logged in as: ${userid} <br />
<a href='/logout'>logout</a> <br />

This <a href='/onlyauthenticated'>view</a> is restricted to authenticated users.


<div>
OpenID login:
<form action="/login/openid" method='post'>
<input type="text" name="openid_identifier"/>
<input type="submit" value="Login with openid" />
</form>
</div>
</body>


</html>