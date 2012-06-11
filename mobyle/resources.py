from pyramid.security import Allow
from pyramid.security import Everyone
from pyramid.security import Authenticated

class Root(object):
    __acl__ = [ (Allow, Authenticated, 'viewpage') ]
    def __init__(self, request):
        self.request = request
