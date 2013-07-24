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
import requests
import bcrypt

from mobyle.common.connection import connection
from mobyle.common import users
from mobyle.common import service
from mobyle.common import tokens

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

def create_if_no_exists(email, password=None):
    """Check if user exists, else create it"""
    user  = connection.User.find_one({'email': email})
    newuser = False
    if not user:
        newuser = True
        user= connection.User()
        user['email'] = email
        if password:
            user['hashed_password'] = bcrypt.hashpw(password,
            bcrypt.gensalt())
        user.save()

    return (user,newuser)



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


@view_config(route_name='main', renderer='mobyle.web:templates/index.mako')
def main_page(request):
    
    #print login_url(request, "openid")
    userid = authenticated_userid(request)

    #retrieve list of services:
    services = connection.Service.find()    
    
    if 'service_name' in request.POST:
        new_service_name = request.POST['service_name']
        if new_service_name not in services:
            service = connection.Service()
            service['name'] = new_service_name
            service.save()
            return HTTPFound(location='/')
    
    if 'platformurl' in request.POST:
        newplatform = request.POST['platformurl']
        page = requests.get(newplatform)
        page = page.json       
        for elt in page.keys():
            service = connection.Service()
            service['name'] = elt
            service.save()
    
    return {'project':'mobyle', 'services': services, 'userid': userid }

    
@view_config(
    context='velruse.AuthenticationComplete',
    renderer='mobyle.web:templates/result.mako',
)
def login_complete_view(request):
    context = request.context
    
    #context.profile['accounts'][0]["username"]

    result = {
        'profile': context.profile,
        'credentials': context.credentials,
    }

    #log.error(json.dumps(result))
    #log.error(str(result))
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
    return HTTPFound(location=settings['site_uri']+\
                     settings['url.main'], headers = headers)
    #return {
    #    'result': json.dumps(result, indent=4),
    #}

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
        ruser['username'] = request.params.getone('username')
        ruser['password'] = request.params.getone('password')
        user = ruser['username']
        (userobj, newuser) = create_if_no_exists(ruser['username'],ruser['password'])
        if not newuser:
            status = 1
            msg = "User already exists"
        else:
            status = 0
            msg = "Your account is created, you can now log in the \
            system with your new credentials"
    if auth_system == 'native':
        try:
            #ruser = request.json_body
            ruser = {}
            ruser['username'] = request.params.getone('username')
            ruser['password'] = request.params.getone('password')
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

