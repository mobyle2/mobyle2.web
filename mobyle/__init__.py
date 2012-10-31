# -*- coding: utf-8 -*-
from pyramid.config import Configurator
from mobyle.resources import Root
from mobyle.security import groupFinder


from pyramid.events import subscriber
from pyramid.events import NewRequest, BeforeRender, NewResponse
from pyramid.security import authenticated_userid

from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy

import pyramid_beaker


from gridfs import GridFS
import pymongo

from hashlib import sha1
from random import randint


from mobyle.views import add_user

def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    config = Configurator(root_factory=Root, settings=settings)
    config.include(pyramid_beaker)
    config.include('pyramid_mailer')
    
    config.include("velruse.providers.openid")
    config.add_openid_login(realm='http://mobyle2:6543')
    
    authentication_policy = AuthTktAuthenticationPolicy('seekrit', callback=groupFinder, debug=True)
    authorization_policy = ACLAuthorizationPolicy()
    
    config.set_authentication_policy(authentication_policy)
    config.set_authorization_policy(authorization_policy)
    
    
    db_uri = settings['db_uri']
    conn = pymongo.Connection(db_uri, safe=True)
    config.registry.settings['db_conn'] = conn
    
    #initialize database when empty:
    db = conn[config.registry.settings['db_name']]
    
    
    if db.users.find().count() == 0:
        pwd = sha1("%s"%randint(1,1e99)).hexdigest()
        print 'root user created with password: ', pwd 
        user = {'username': 'root', 'admin': True, 'password': pwd , 'email': settings['root_email'], 'firstname': 'root', 'lastname':'root'}
        add_user(db, user)
        
    
    #end initialization
    
    config.add_subscriber(add_mongo_db, NewRequest)
    config.add_subscriber(before_render, BeforeRender)    
    
    config.add_route('main', '/')
    config.add_route('onlyauthenticated', '/onlyauthenticated')
    config.add_route('login', '/login')    
    config.add_route('logout', '/logout')
    config.add_route('program_list', '/programs/list')
    config.add_route('user_list', '/users')
    
    #config.add_route('velruse_endpoint', '/loginendpoint')
    #config.add_route('logout', "/logout")
                        
    config.add_static_view('static', 'mobyle:static', cache_max_age=3600)
    
    config.scan()
    
    return config.make_wsgi_app()




def add_mongo_db(event):
    settings = event.request.registry.settings
    db = settings['db_conn'][settings['db_name']]
    event.request.db = db
    event.request.fs = GridFS(db)
#    if 'HTTP_X_REAL_IP' in event.request.environ:
#         event.request.environ['REMOTE_ADDR'] = event.request.environ['HTTP_X_REAL_IP']
    
def before_render(event):
    event["username"] = authenticated_userid(event['request'])

