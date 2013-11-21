# -*- coding: utf-8 -*-
from pyramid.view import view_config
from pyramid.security import remember, authenticated_userid, forget
from pyramid.httpexceptions import HTTPFound, HTTPNotFound, HTTPForbidden
from pyramid.renderers import render_to_response
from pyramid.response import Response
from pyramid_mailer import get_mailer
from pyramid_mailer.message import Message

from velruse import login_url
import json
from bson import json_util
from bson.objectid import ObjectId
import requests
import bcrypt
from mf.views import mf_filter, MF_READ
from mf.db_conn import DbConn

from mobyle.common.connection import connection
from mobyle.common import users
from mobyle.common import project
from mobyle.common import service
from mobyle.common import tokens
from mobyle.common.mobyleError import MobyleError
from mobyle.common.mobyleConfig import MobyleConfig

from mobyle.web.classification import BY_TOPIC, BY_OPERATION

import urllib
from urllib2 import URLError
import urllib2

import logging
log = logging.getLogger(__name__)

def add_user(user):
    """adds a user to the database. Password will be hashed with bcrypt"""
    hashed = bcrypt.hashpw(user['hashed_password'], bcrypt.gensalt())
    user['hashed_password'] = hashed
    user.save()

def create_if_no_exists(email, password=None, encrypted=False):
    """
    Check if user exists, else create it
    If the user is created, also add a first project for him to work in.

    :param email: email identifier
    :type email: str
    :param password: password for the user to create
    :type password: str
    :param encrypted: is password encrypted or clear? If clear, encrypt it
    :type encrypted: bool
    
    """
    user  = connection.User.find_one({'email': email})
    newuser = False
    if not user:
        newuser = True
        user= connection.User()
        user['email'] = email
        if password:
            if not encrypted:
                user['hashed_password'] = bcrypt.hashpw(password,
                bcrypt.gensalt())
            else:
                user['hashed_password'] = password
        user.save()
        default_project = connection.Project()
        default_project['owner'] = user['_id']
        default_project['users'] = [{ 'role': 'admin',
                                      'user': user['_id']
                                   }]
        default_project['name'] = 'my project'
        default_project.save()
    return (user,newuser)

def is_user_in_ldap(username, mob_config=MobyleConfig.get_current()):
    """
    Checks if user is in ldap
    :param username: user id or email
    :type username: str
    :param mob_config: Mobyle configuration object
    :type mob_config: MobyleConfig
    :return: True if in ldap, False if not in ldap, None if error    
    """
    import ldap
    try:
        con = ldap.initialize( 'ldap://'+mob_config['auth']['ldap']['host']+
                            ':'+str(mob_config['auth']['ldap']['port']) )
    except Exception , err :
            log.error(err)
            return None

    base_dn= 'ou=People,' + mob_config['auth']['ldap']['dn']

    filter = "(&""(|(uid=" + username + ")(mail=" + username + ")))"
    try:
        con.simple_bind_s()
        attrs =['mail', 'homeDirectory']
        results = con.search_s( base_dn , ldap.SCOPE_SUBTREE , filter , attrs )
        if results:
            return True
        return False 
    except Exception , err :
        log.error(err)
        return None


def check_user_ldap(username, password=None, mob_config=MobyleConfig.get_current()):
    """
    Checks for ldap authentication, create user locally if 
    it does not exists.
    
    :param username: user id or email
    :type username: str
    :param password: clear password for authentication.
    :type password: str
    :param mob_config: Mobyle configuration object
    :type mob_config: MobyleConfig
    :return: user
    """
    import ldap
    try:
        con = ldap.initialize( 'ldap://'+mob_config['auth']['ldap']['host']+
                            ':'+str(mob_config['auth']['ldap']['port']) )
    except Exception , err :
            log.error(err)
            return None

    base_dn= 'ou=People,' + mob_config['auth']['ldap']['dn']
    opt_filter = ''
    if mob_config['auth']['ldap']['filter']:
        opt_filter = mob_config['auth']['ldap']['filter']

    filter = "(&"+opt_filter+"(|(uid=" + username + ")(mail=" + username + ")))"
    try:
        con.simple_bind_s()
    except Exception , err :
        log.error(err)
        return None

    attrs =['mail', 'homeDirectory']
    try:
        # Get user info
        results = con.search_s( base_dn , ldap.SCOPE_SUBTREE , filter , attrs )
        user_dn = None
        ldapMail = None
        ldapHomeDirectory = None
        for dn, entry in results:
            user_dn = str(dn)
            ldapHomeDirectory = entry['homeDirectory'][0]
            ldapMail = entry['mail'][0]
        con.simple_bind_s(user_dn,password)
        con.unbind_s()
        if user_dn:
            (db_user, newuser) = create_if_no_exists(ldapMail)
            if newuser and ldapHomeDirectory:
                db_user['home_dir'] = ldapHomeDirectory
                db_user.save()
            return db_user

    except Exception , err :
        log.error('Could not find the user based on current filter: '+
                   filter+", "+str(err))
        return None
    return None

def check_user_pw(username, password):
    """checks for plain password vs hashed password in database"""
    if not password or password=='':
        return None
    user  = connection.User.find_one({'email': username})
    if not user: return False
    hashed = bcrypt.hashpw(password, user['hashed_password'])
    if hashed == user['hashed_password']:
        return user
    else:
        return None


@view_config(route_name='main')
def main_page(request):
    return HTTPFound(location=request.static_path(\
        "mobyle.web:static/app/index.html"))

    
@view_config(context='velruse.AuthenticationComplete')
def login_complete_view(request):
    context = request.context
    
    result = {
        'profile': context.profile,
        'credentials': context.credentials,
    }

    if context.provider_name == 'facebook': 
        username = context.profile['verifiedEmail']
    elif context.provider_name == 'openid':
        username = context.profile['emails'][0]
    else:
        username = context.profile['accounts'][0]["username"]

    request.db.login_log.insert({ 'username': username } )
    headers = remember(request, username)
    (userobj, newuser) = create_if_no_exists(username)
    settings = request.registry.settings
                     
    return HTTPFound(location=request.static_path("mobyle.web:static/app/index.html"), headers = headers )


@view_config(route_name='onlyauthenticated', permission='viewauth')
def onlyauth(request):
    return Response("<!DOCTYPE HTML><html><head></head><body>hello authenticated user</body></html>")


#basic http auth (with a form)
@view_config(route_name="login")
def login(request):
    if 'username' in request.POST:
        username = request.POST['username']
        password = request.POST['password']
        
        user = check_user_pw(username, password)
        if user:
            headers = remember(request, username)
            return HTTPFound(location="/", headers = headers)
    return Response("not logged in")


#simply logout
@view_config(route_name='logout')
def logout(request):
    headers = forget(request)
    request.session.flash("You have logged out")
    return HTTPFound(location='/', headers=headers)

@view_config(route_name="auth_reset_password",renderer="json")
def auth_reset_password(request):
    '''
    User asks for a password reset.
    Generates a temporary token and send an email to
    the user.
    '''
    user  = connection.User.find_one({'email': request.params.getone('username')})
    if not user:
        log.error("Reset requested for non existing user")
        return HTTPNotFound()
    # Generate token
    temptoken = connection.Token()
    temptoken.generate()
    temptoken['user'] = user['email']
    temptoken.save()
    # Send email
    mailer = get_mailer(request)
    settings = request.registry.settings
    msg = "You have requested to reset your password.\n"+ \
    "To do so, you can connect to the following address for 1 hour.\n"+ \
           settings['site_uri']+settings['url.password_reset']+\
           "?token="+temptoken['token']+\
           "\nThe Mobyle portal team."
    log.debug('send mail '+msg)
    message = Message(subject="Mobyle password reset request",
                      recipients=[user['email']],
                      body=msg)
    mailer.send_immediately(message)
    return {}

@view_config(route_name="auth_confirm_email")
def auth_confirm_email(request):
    token = request.params.getone('token')
    token_object = connection.Token.find_one({'token': token})
    if token_object is None:
        return HTTPForbidden()
    if not token_object.check_validity():
        return HTTPForbidden()

    # Token is valid, create user from token dataa
    ruser = json.loads(token_object['data'])
    (userobj, newuser) = create_if_no_exists(ruser['email'], ruser['password'], True)

    if not newuser:
        return HTTPForbidden()

    return HTTPFound(location=request.static_path("mobyle.web:static/app/index.html")+"#/login")

@view_config(route_name="auth_update_password",renderer="json")
def auth_update_password(request):
    '''
    Password update
    '''
    token = request.params.getone('token')
    password = request.params.getone('password')
    token_object = connection.Token.find_one({'token': token})
    if token_object is None:
        return HTTPForbidden()
    if not token_object.check_validity():
        return HTTPForbidden()
    user = connection.User.find_one({'email': token_object['user']})
    if not user:
        return HTTPNotFound()
    # Update password
    hashed = bcrypt.hashpw(password, bcrypt.gensalt())
    user['hashed_password'] = hashed
    user.save()
    log.debug("User "+token_object['user']+" has reset its password")
    return {}

    

@view_config(route_name="auth_login",renderer="json")
def auth_login(request):
    '''
    Login request
    '''
    # Needed for:
    # - Mozilla Persona
    # - Mobyle account
    userid = authenticated_userid(request)
    if userid:
        log.error("Someone is logged "+str(userid))
        user  = connection.User.find_one({'email': userid})
        return { 'user': user['email'], 'status': 0 , 'msg': '', 'admin' :
        user['admin']}

    msg = ''
    user = None
    admin = False
    auth_system = request.matchdict['auth']
    settings = request.registry.settings
    if auth_system == 'register':
        #ruser = request.json_body
        ruser = {}
        ruser['email'] = request.params.getone('username')
        userexists  = connection.User.find_one({'email': ruser['email']})
        mob_config = MobyleConfig.get_current()
        if userexists:
            status = 1
            msg = "User already exists"
        else:
            # If ldap on and user in ldap, do not allow registration
            if mob_config['auth']['ldap']['allow'] and \
               is_user_in_ldap(ruser['email'], mob_config):
                status = 1
                msg = "User already in ldap, registration is not allowed"
            else:
                password = request.params.getone('password')
                hashed = bcrypt.hashpw(password, bcrypt.gensalt())
                ruser['password'] = hashed
                status = 1
                msg = "An email has been sent to confirm your email address.\
                Click on the provided link to active your account and login \
                with your new credentials"
                temptoken = connection.Token()
                temptoken.generate()
                temptoken['user'] = ruser['email']
                temptoken['data'] = json.dumps(ruser)
                temptoken.save()
                # Send email
                mailer = get_mailer(request)
                settings = request.registry.settings
                mailmsg = "You have requested to create an account.\n"+ \
                  "To do so, you can connect to the following address \
                  for 1 hour.\n"+ \
                  request.route_url('auth_confirm_email')+\
                  "?token="+temptoken['token']+\
                  "\nThe Mobyle portal team."
                message = Message(subject="Mobyle account creation request",
                      recipients=[ruser['email']],
                      body=mailmsg)
                mailer.send_immediately(message)
    if auth_system == 'native':
        try:
            #ruser = request.json_body
            ruser = {}
            ruser['username'] = request.params.getone('username')
            ruser['password'] = request.params.getone('password')

            userobj = None
            mob_config = MobyleConfig.get_current()
            if mob_config['auth']['ldap']['allow']:
                # Check ldap
                userobj = check_user_ldap(ruser['username'],
                            ruser['password'], mob_config)
            if userobj is None:
                userobj = check_user_pw(ruser['username'],
                             ruser['password'])
            if userobj:
                status = 0
                admin = userobj['admin']
                user = ruser['username']
            else:
                status = 1
                msg = "Wrong username or password"
        except Exception:
            user = None
            status = 1
            msg = "User does not exists"
    if auth_system == 'persona':
        assertion = request.params.getone('assertion')
        audience = settings['site_uri']
        # Check assertion
        url = 'https://verifier.login.persona.org/verify'
        values = {'assertion': assertion,
                  'audience': audience}

        data = urllib.urlencode(values)
        req = urllib2.Request(url, data)
        verification_data = None
        status = 1
        user = None
        try:
            response = urllib2.urlopen(req)
            auth_answer = response.read()
            verification_data = json.loads(auth_answer)
            if verification_data['status'] == 'failure':
                status = 1
            else:
                user = verification_data['email']
                status = 0
                (userobj, newuser) = create_if_no_exists(user)
                admin = userobj['admin']
        except URLError, e:
            logging.error(e.reason)

    if user:
        headers = remember(request, user)
        request.response.headerlist.extend(headers)
    return { 'user': user, 'status': status , 'msg': msg, 'admin' : admin}

@view_config(route_name="auth_logout", renderer="json")
def auth_logout(request):
    '''logout request'''
    # logout
    headers = forget(request)
    request.response.headerlist.extend(headers)
    return { 'user': None, 'status': 0 , 'msg' : ''}



@view_config(route_name='about', renderer='mobyle.web:templates/about.mako')
def about(request):
        return {
        }

@view_config(route_name='services_by_topic')
def services_by_topic(request):
    tree_list = BY_TOPIC.get_classification(filter=request.params.get('filter',None))
    objlist = json.dumps(tree_list, default=json_util.default)
    return Response(body=objlist, content_type="application/json")

@view_config(route_name='services_by_operation')
def services_by_operation(request):
    tree_list = BY_OPERATION.get_classification(filter=request.params.get('filter',None))
    objlist = json.dumps(tree_list, default=json_util.default)
    return Response(body=objlist, content_type="application/json")

@view_config(route_name='service_by_identifier')
@view_config(route_name='service_by_identifier_version')
def service_by_name_version_and_maybe_project(request):
    '''Returns a service object

    :param request: HTTP params
    :type request: IMultiDict
    :return: json - Object from database
    '''
    mffilter = mf_filter('service', MF_READ, request)
    if mffilter is None:
        raise HTTPForbidden
    if request.matchdict.has_key('identifier'):
        # identifier can be an object id or a public name
        try:
            mffilter["_id"] = ObjectId(request.matchdict['identifier'])
        except:
            mffilter["public_name"] = request.matchdict['identifier']
    if request.matchdict.has_key('service_version'):
        mffilter["version"] = request.matchdict['service_version']
    collection = DbConn.get_db('Service')
    obj = collection.find_one(mffilter)
    if not obj:
        raise HTTPNotFound()
    response = {'object': 'service', 'status': 0, 'service': obj, 'filter': mffilter}
    response = json.dumps(response, default=json_util.default)
    return Response(body=response, content_type="application/json")
