# -*- coding: utf-8 -*-
from pyramid.view import view_config
from pyramid.security import remember, authenticated_userid, forget

from pyramid.httpexceptions import HTTPFound
from pyramid.renderers import render_to_response
from pyramid.response import Response

from velruse import login_url
import json

import requests

from pyramid.httpexceptions import HTTPFound

@view_config(route_name='main', renderer='mobyle:templates/index.mako')
def my_view(request):
    
    print login_url(request, "openid")
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
    return Response("hello authenticated user")


#simply logout
@view_config(route_name='logout')
def logout(request):
    headers = forget(request)
    request.session.flash("You have logged out")
    return HTTPFound(location='/', headers=headers)


##page called after velruse authentication
#@view_config(route_name="velruse_endpoint")
#def endpoint(request):
    
    #if 'token' in request.params:
        #token = request.params['token']
    
        #store = MongoDBStore(db="mobyle2")
        #values = store.retrieve(token)
        
        #if values['status'] == 'ok':
            #print values
            #identifier = values['profile']['identifier']
            #print identifier
            
            #try:
                #username = request.db.identifiers.find_one({'id': identifier })['username']
            #except TypeError:
                 #if authenticated_userid(request) is not None:
                      #request.db.identifiers.insert({'id': identifier, 'username': authenticated_userid(request)  })
                      #request.session.flash('welcome back %s'%authenticated_userid(request))
                      #return HTTPFound(location='/')
                 #else:
                     ##no local account, try to create a new one
                     #if request.registry.settings['allownewaccount'] == 'True':
                         #request.session['identifier'] = identifier
                         #return HTTPFound(location='/newaccount')
                         
                
            
            #headers = remember(request, username)
            #request.session.flash("welcome %s"%username)
            
            #return HTTPFound(location='/', headers=headers)
            
        
        #print values
    
    #return Response("hello")
