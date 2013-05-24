# Mobyle2 AWA
This repository contains a prototype web client for Mobyle2. 

Facebook, Google and Mobyle auth are ok (with localhost).
For real testing, one need to update declared apps for accepted domains.

GitHub and Twiter not yet implemented.

Faced an error with Velruse depending on account. Following is patch:

--- /tmp/google_oauth2.py.orig  2013-05-06 17:54:33.853720009 +0200
+++ /tmp/google_oauth2.py   2013-05-06 17:54:04.469721059 +0200
@@ -167,7 +167,8 @@
                 'username': data['email'],
                 'userid': data['id']
             }]
-            profile['displayName'] = data['name']
+            if 'name' in data:
+                profile['displayName'] = data['name']
             profile['preferredUsername'] = data['email']
             profile['verifiedEmail'] = data['email']
             profile['emails'] = [{'value': data['email']}]
