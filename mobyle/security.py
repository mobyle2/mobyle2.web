import time


def groupFinder(userid, request):
     #try to find user in database:
     user = request.db.users.find_one({"username": userid})
     if user is not None:
        return user.get('groups', [])

