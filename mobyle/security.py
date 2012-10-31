import time


USERS = set(["test", "root"])
GROUPS = {"test": ["group:admin"], "root": ["group:admin"]}

def groupFinder(userid, request):
     if userid in USERS:
        print "returning ",  GROUPS.get(userid, [])
        return GROUPS.get(userid, [])
