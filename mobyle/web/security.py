import time

import mobyle.common
from mobyle.common import session

def groupFinder(userid, request):
     #try to find user in database:
     user = session.User.find_one({"username": userid})
     if user is not None:
        return user['groups']

