# -*- coding: utf-8 -*-
from hashlib import sha1
from random import randint

from pyramid.config import Configurator

from pyramid.events import subscriber
from pyramid.events import NewRequest, BeforeRender, NewResponse
from pyramid.security import authenticated_userid
from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
import pyramid_beaker

from mf.dashboard import Dashboard
import mf

from gridfs import GridFS
import pymongo


def main(global_config, **settings):
    """
    This function returns a Pyramid WSGI application.
    """

    # instantiate mobyle config
    from mobyle.common.config import Config
    mobyle_config = Config().config()
    # copy pyramid app:main settings to mobyle config (DB config, etc.)
    for setting in settings:
        mobyle_config.set('app:main', setting, settings[setting])
    # then import connection
    from mobyle.common import connection

    # Mobyle modules (which import mobyle.lib modules) can be imported
    # now, they are registered with the right configuration
    from mobyle.web.resources import Root
    from mobyle.web.security import groupFinder
    from mobyle.web.views import add_user

    config = Configurator(root_factory=Root, settings=settings)
    config.include(pyramid_beaker)
    config.include('pyramid_mailer')
    config.include("velruse.providers.openid")
    config.add_openid_login(realm=settings['site_uri'])
    config.include('velruse.providers.facebook')
    config.include('velruse.providers.google_oauth2')
    config.add_facebook_login_from_settings(prefix='velruse.facebook.')
    config.add_google_oauth2_login_from_settings(prefix='velruse.google.')

    db_uri = settings['db_uri']
    conn = pymongo.Connection(db_uri, safe=True)
    config.registry.settings['db_conn'] = conn
    db = conn[config.registry.settings['db_name']]

    authentication_policy = AuthTktAuthenticationPolicy('seekrit',
        callback=groupFinder, hashalg='sha512')
    authorization_policy = ACLAuthorizationPolicy()

    config.set_authentication_policy(authentication_policy)
    config.set_authorization_policy(authorization_policy)

    config.add_subscriber(add_mongo_db, NewRequest)
    config.add_subscriber(before_render, BeforeRender)

    config.add_route('main', '/')
    config.add_route('onlyauthenticated', '/onlyauthenticated')
    config.add_route('login', '/login')
    config.add_route('logout', '/logout')
    config.add_route('about', '/about')
    config.add_route('auth_login', '/auth/login/{auth}')
    config.add_route('auth_logout', '/auth/logout')
    config.add_route('auth_reset_password', '/auth/password/reset')
    config.add_route('auth_update_password', '/auth/password')
    config.add_route('auth_confirm_email', '/auth/confirm_email')
    config.add_route('services_by_topic', '/services/by_topic')
    config.add_route('services_by_operation', '/services/by_operation')
    config.add_route('service_by_identifier', '/api/services/{identifier}')
    config.add_route('service_by_identifier_version',
        '/api/services/{identifier}/{service_version}')
    config.add_route('create_project_data', '/api/projectdata')
    config.add_route('update_project_data', '/api/projectdata/{id}')
    config.add_route('list_project_data', '/api/project/{project}/data')
    config.add_route('format_dataterms', '/api/formatdataterms')

    #config.add_route('velruse_endpoint', '/loginendpoint')
    #config.add_route('logout', "/logout")
    config.add_static_view('static', 'mobyle.web:static')
    config.add_static_view('app', '../../webapp/app')
    config.scan()

    Dashboard.set_connection(connection.connection)
    from mobyle.common.users import User
    from mobyle.common.service import Package, Service, Program,\
        Workflow, Widget
    from mobyle.common.mobyleConfig import MobyleConfig
    from mobyle.common.job import Job
    from mobyle.common.project import Project, ProjectData


    # mf bindings configuration for Project
    # owner is a reference to User object.
    owner_renderer = Project.get_renderer("owner")
    owner_renderer.set_reference(User)
    # display owner's email in the dashboard
    owner_renderer.set_display_field("email")
    # owner is a reference to User object.
    users_user_renderer = Project.get_renderer("users.user")
    users_user_renderer.set_reference(User)
    # display user's email in the dashboard
    users_user_renderer.set_display_field("email")
    # mf bindings configuration for ProjectData
    # project is a reference to ProjectData object.
    project_renderer = ProjectData.get_renderer("project")
    project_renderer.set_reference(Project)
    # display owner's email in the dashboard
    project_renderer.set_display_field("name")


    from mobyle.common.term import DataTerm, FormatTerm,\
        TopicTerm, OperationTerm
    dconfig = Dashboard.get_config()
    dconfig['templates'] = 'mobyle.web:templates/dashboard.mako'
    dconfig['permission'] = 'isadmin'
    Dashboard.add_dashboard([MobyleConfig, User, Project, ProjectData,
        Package, Service, Program, Workflow, Widget, DataTerm, FormatTerm,
        TopicTerm, OperationTerm], config)
    for klass in [Service, Program, Workflow, Widget]:
        klass.set_display_fields(['name', 'version', 'title', 'description'])

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
