import time

from mobyle.common import connection
from mobyle.common import users

def groupFinder(userid, request):
     #try to find user in database:
     user = connection.User.find_one({"email": userid})
     if user is not None:
        return user['groups']

