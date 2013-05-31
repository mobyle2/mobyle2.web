import time

from mobyle.common.connection import connection
from mobyle.common import users

def groupFinder(userid, request):
     #try to find user in database:
     user = connection.User.find_one({"email": userid})
     if user is not None:
        groups = user['groups']
        if user['admin']:
            groups.append('group:admin')
        return groups

