# -*- coding: utf-8 -*-
from pyramid.view import view_config

@view_config(route_name='main', renderer='templates/mytemplate.pt')
def my_view(request):
    return {'project':'mobyle'}


#simply logout
@view_config(route_name='logout')
def logout(request):
    headers = forget(request)
    request.session.flash("You have logged out")
    return HTTPFound(location='/', headers=headers)


#page called after velruse authentication
@view_config(route_name="velruse_endpoint")
def endpoint(request):
    
    if 'token' in request.params:
        token = request.params['token']
    
        store = MongoDBStore(db="mobyle2")
        values = store.retrieve(token)
        
        if values['status'] == 'ok':
            print values
            identifier = values['profile']['identifier']
            print identifier
            
            try:
                username = request.db.identifiers.find_one({'id': identifier })['username']
            except TypeError:
                 if authenticated_userid(request) is not None:
                      request.db.identifiers.insert({'id': identifier, 'username': authenticated_userid(request)  })
                      request.session.flash('welcome back %s'%authenticated_userid(request))
                      return HTTPFound(location='/')
                 else:
                     #no local account, try to create a new one
                     if request.registry.settings['allownewaccount'] == 'True':
                         request.session['identifier'] = identifier
                         return HTTPFound(location='/newaccount')
                         
                
            
            headers = remember(request, username)
            request.session.flash("welcome %s"%username)
            
            return HTTPFound(location='/', headers=headers)
            
        
        print values
    
    return Response("hello")
