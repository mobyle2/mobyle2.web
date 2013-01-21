# -*- coding: utf-8 -*-
from pyramid.view import view_config
from pyramid.security import remember, authenticated_userid, forget

from pyramid.httpexceptions import HTTPFound
from pyramid.renderers import render_to_response
from pyramid.response import Response

from velruse import login_url
import json

import requests
import bcrypt

from pyramid.httpexceptions import HTTPFound

import mobyle.common
from mobyle.common import session

def add_user(user):
    """adds a user to the database. Password will be hashed with bcrypt"""
    hashed = bcrypt.hashpw(user['hashed_password'], bcrypt.gensalt())
    user['hashed_password'] = hashed
    user.save()

def check_user_pw(username, password):
    """checks for plain password vs hashed password in database"""
    user  = mobyle.common.session.User.find_one({'email': username})
    if not user: return False
    hashed = bcrypt.hashpw(password, user['hashed_password'])
    return hashed == user['hashed_password']


@view_config(route_name='main', renderer='mobyle.web:templates/index.mako')
def my_view(request):
    
    #print login_url(request, "openid")
    userid = authenticated_userid(request)

    #retrieve list of programs:
    programs = mobyle.common.session.Program.find()    
    
    if 'progname' in request.POST:
        newprogname = request.POST['progname']
        if newprogname not in programs:
            program = mobyle.common.session.Program()
            program['name'] = newprogname
            program.save()
            return HTTPFound(location='/')
    
    if 'platformurl' in request.POST:
        newplatform = request.POST['platformurl']
        page = requests.get(newplatform)
        page = page.json       
        for elt in page.keys():
            program = mobyle.common.session.Program()
            program['name'] = elt
            program.save()
    
    return {'project':'mobyle', 'programs': programs, 'userid': userid }

    
@view_config(
    context='velruse.AuthenticationComplete',
    renderer='mobyle.web:templates/result.mako',
)
def login_complete_view(request):
    context = request.context
    
    context.profile['accounts'][0]["username"]

    result = {
        'profile': context.profile,
        'credentials': context.credentials,
    }
    
    username = context.profile['accounts'][0]["username"]
    request.db.login_log.insert({ 'username': username } )
    headers = remember(request, username)
    request.response.headerlist.extend(headers)
    return {
        'result': json.dumps(result, indent=4),
    }

@view_config(route_name='onlyauthenticated', permission='viewauth')
def onlyauth(request):
    return Response("<!DOCTYPE HTML><html><head></head><body>hello authenticated user</body></html>")


#basic http auth (with a form)
@view_config(route_name="login")
def login(request):
    if 'username' in request.POST:
        username = request.POST['username']
        password = request.POST['password']
        
        if check_user_pw(username, password):
            headers = remember(request, username)
            return HTTPFound(location="/", headers = headers)
    return Response("not logged in")


#simply logout
@view_config(route_name='logout')
def logout(request):
    headers = forget(request)
    request.session.flash("You have logged out")
    return HTTPFound(location='/', headers=headers)



@view_config(route_name='program_list', renderer="json")
def program_list(request):
    progs = mobyle.common.session.Program.find({'public':True})
    return [p['name'] for p in progs]

@view_config(route_name='user_list', request_method='GET', renderer="json", permission="isadmin")
def user_list(request):
    users = mobyle.common.session.User.find()
    ret = {}
    for u in users:
       userid = str(u['_id'])
       ret[userid] = { 
                       'email': u['email'],
                       'username': u['email'],
                       'type': u['type'],
                       'groups': [u'group:admin'],
                       
                     } 
    return ret


@view_config(route_name='about', renderer='mobyle.web:templates/about.mako')
def about(request):
        return {
        }

