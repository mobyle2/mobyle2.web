# -*- coding: utf-8 -*-
from pyramid.config import Configurator
from mobyle.web.resources import Root
from mobyle.web.security import groupFinder


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

from mobyle.common import session
from mobyle.common.config import Config


from mobyle.web.views import add_user

from mf.dashboard import Dashboard

def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    config = Configurator(root_factory=Root, settings=settings)
    config.include(pyramid_beaker)
    config.include('pyramid_mailer')
    
    config.include("velruse.providers.openid")
    config.add_openid_login(realm=settings['site_uri'])
    
    authentication_policy = AuthTktAuthenticationPolicy('seekrit', callback=groupFinder,hashalg='sha512')
    authorization_policy = ACLAuthorizationPolicy()
    
    config.set_authentication_policy(authentication_policy)
    config.set_authorization_policy(authorization_policy)
    
    
    db_uri = settings['db_uri']
    conn = pymongo.Connection(db_uri, safe=True)
    config.registry.settings['db_conn'] = conn
    db = conn[config.registry.settings['db_name']]

    mobyle_config = Config().config()
    for setting in settings:
      mobyle_config.set('app:main',setting,settings[setting])
    import mobyle.common.connection
    mobyle.common.connection.init_mongo(settings['db_uri'])

    
    config.add_subscriber(add_mongo_db, NewRequest)
    config.add_subscriber(before_render, BeforeRender)    
    
    config.add_route('main', '/')
    config.add_route('onlyauthenticated', '/onlyauthenticated')
    config.add_route('login', '/login')    
    config.add_route('logout', '/logout')
    config.add_route('program_list', '/programs/list')
    config.add_route('user_list', '/users')

    config.add_route('about', '/about')
    
    #config.add_route('velruse_endpoint', '/loginendpoint')
    #config.add_route('logout', "/logout")
                        
    config.add_static_view('static', 'mobyle.web:static', cache_max_age=3600)
    
    config.scan()

    Dashboard.set_connection(mobyle.common.session)
    from mobyle.common.users import User
    from mobyle.common.program import Program
    from mobyle.common.mobyleConfig import MobyleConfig
    from mobyle.common.job import Job
    from mobyle.common.project import Project 
    dconfig = Dashboard.get_config()
    dconfig['templates'] = 'mobyle.web:templates/dashboard.mako'
    Dashboard.add_dashboard([MobyleConfig,User,Project,Job,Program],config)

    config.add_route('statistics', '/admin/stats')
    config.add_route('statistics_map', '/admin/stats/map')
    config.add_route('statistics_usage', '/admin/stats/usage')
    config.add_route('statistics_usage_json', '/admin/stats/usage.json')
    config.add_route('statistics_user', '/admin/stats/user')


    
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

