<%inherit file="layout.mako"/>

<h2>Authentication</h2>

You are logged in as: ${userid} <br />
<a href='/logout'>logout</a> <br />

This <a href='/onlyauthenticated'>view</a> is restricted to authenticated users.

<h2>Admin dashboard</h2>
Admin dashboard is available <a href='/admin'>here</a> (no authentication for the moment)

<h2>Tests</h2>
<div class="row">
<div class="offset1">
OpenID login:
<form action="/login/openid" method='post'>
<input type="text" name="openid_identifier"/>
<input type="submit" value="Login with openid" />
</form>
</div>
</div>
<br />
<div class="row">
<div class="offset1">
Form login:
<form action="/login" method='post'>
<input type="text" name="username"/>
<input type="password" name="password"/>
<input type="submit" value="Login" />
</form>
</div>
</div>
<hr />
<div class="row">
<div class="offset1">
Add a service:
<form action="" method="post">
<input type='text' name='service_name' />
<input type='submit' value='add service' />
</form>
</div>
</div>
<hr />
<div class="row"><div class="offset1">
import a platform:
<form action="" method="post">
<input type='text' name='platformurl' />
<input type='submit' value='platform!' />
</form>
</div></div>
<hr />
<div class="row"><div class="offset1">
Services list:
%for s in services:
    ${s['name']} <br />
%endfor
</div>/<div>

