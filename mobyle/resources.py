from pyramid.security import Allow
from pyramid.security import Everyone
from pyramid.security import Authenticated

class Root(object):
    def __init__(self, request):
        self.__acl__ = [ (Allow, Authenticated, 'viewauth') ]
        self.request = request
