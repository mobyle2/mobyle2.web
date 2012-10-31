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


def add_user(db, user):
    """adds a user to the database. Password will be hashed with bcrypt"""
    hashed = bcrypt.hashpw(user['password'], bcrypt.gensalt())
    del user['password']
    user['hashed'] = hashed
    db.users.insert(user)

def check_user_pw(db, username, password):
    """checks for plain password vs hashed password in database"""
    user  = db.users.find_one({'username': username})
    if not user: return False
    hashed = bcrypt.hashpw(password, user['hashed'])
    return hashed == user['hashed']


@view_config(route_name='main', renderer='mobyle:templates/index.mako')
def my_view(request):
    
    #print login_url(request, "openid")
    userid = authenticated_userid(request)

    #retrieve list of programs:
    programs = request.db.programs.find()    
    
    if 'progname' in request.POST:
        newprogname = request.POST['progname']
        if newprogname not in programs:
            request.db.programs.insert({'name': newprogname } , safe=True)
            return HTTPFound(location='/')
    
    if 'platformurl' in request.POST:
        newplatform = request.POST['platformurl']
        page = requests.get(newplatform)
        page = page.json       
        for elt in page.keys():
            request.db.programs.insert({'name': elt } , safe=True)
    
    
    return {'project':'mobyle', 'programs': programs, 'userid': userid }


 
    
    
@view_config(
    context='velruse.AuthenticationComplete',
    renderer='mobyle:templates/result.mako',
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
        
        if check_user_pw(request.db, username, password):
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
    progs = request.db.programs.find({'public':True})
    return [p['name'] for p in progs]

@view_config(route_name='user_list', request_method='GET', renderer="json", permission="isadmin")
def user_list(request):
    users = request.db.users.find()
    ret = {}
    for u in users:
       userid = str(u['_id'])
       ret[userid] = { 
                       'email': u.get('email', ''),
                       'username': u.get('username', ''),
                       'type': u['type'],
                       'groups': u.get('groups', []),
                       
                     } 
    return ret
    

