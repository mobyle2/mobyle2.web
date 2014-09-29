# -*- coding: utf-8 -*-
from pyramid.view import view_config
from pyramid.security import remember, authenticated_userid, forget
from pyramid.httpexceptions import HTTPFound, HTTPNotFound, HTTPForbidden, HTTPClientError
from pyramid.renderers import JSON
from pyramid.response import Response, FileResponse
from pyramid_mailer import get_mailer
from pyramid_mailer.message import Message

from velruse import login_url
import json
from bson import json_util
from bson.objectid import ObjectId
from bson.errors import InvalidId
import requests
import bcrypt
import formencode
from mf.views import mf_filter, MF_READ
from mf.db_conn import DbConn

from mobyle.common.connection import connection
from mobyle.common import users
from mobyle.common import project
from mobyle.common.data import RefData, ValueData, ListData, StructData
from mobyle.common.type import FormattedType
from mobyle.common import service
from mobyle.common import tokens
from mobyle.common.objectmanager import ObjectManager, AccessMode
from mobyle.common.mobyleConfig import MobyleConfig
from mobyle.common.term import FormatTerm
from mobyle.common.classification import Classification
from mobyle.common.job import Status, ProgramJob, Job
from mobyle.common.notifications import Notification

import urllib
from urllib2 import URLError
import urllib2

import os.path

import logging
log = logging.getLogger(__name__)


@view_config(route_name='notifications_list', renderer='json', request_method='PUT')
def update_notification_list(request):
    """
    Update a list of notification

    TODO: use pymongo for batch update
    """

    (params, empty) = request.params.items()[0]
    params = json.loads(params)
    ids = params['list']
    total = 0
    userid = authenticated_userid(request)
    current_user = connection.User.fetch_one({'email': userid})
    for nid in ids:
        notif = connection.Notification.fetch_one({'_id': ObjectId(nid)})
        if not notif:
            continue
        if str(notif['user']) == current_user['_id']:
            for key in params:
                if key != 'list':
                    notif[key] = params[key]
            total += 1
            notif.save()
    #res = connection.Notification.update({'_id': {'$in': ids}}, {'$set': notif}, {'upsert': False, 'multi': True})
    return {"count" : total}


@view_config(route_name='notifications_list', renderer='json', request_method='POST')
def create_notification_list(request):
    """
    Create a list of notification
    """

    (params, empty) = request.params.items()[0]
    params = json.loads(params)
    total = 0
    print str(params)

    notif_project = None
    if 'project' in params:
        notif_project = params['project']
    params = params['notification']

    userid = authenticated_userid(request)
    currentuser = connection.User.fetch_one({'email': userid})

    if params['type'] == 1 and not notif_project:
        raise HTTPForbidden()
    if params['type'] == 0 and not currentuser['admin']:
        raise HTTPForbidden()

    if params['type'] == 0 and currentuser['admin']:
        user_list = connection.User.fetch({})
        for user in user_list:
            notif = connection.Notification()
            notif['type'] = params['type']
            notif['message'] = params['message']
            notif['user'] = user['_id']
            notif.save()
            if total == 0:
                try:
                    notif.notify()
                except Exception as e:
                    return {'error': str(e)}
            total += 1
        return {'count': total}

    if params['type'] > 0:
        found_project = connection.Project.fetch_one({'_id': ObjectId(notif_project)})
        user_list = found_project['users']
        allowed = False
        err = ''
        for user in user_list:
            if currentuser['_id'] == user['user']:
                allowed = True
        if not allowed:
            raise HTTPForbidden()
        for user in user_list:
            notif = connection.Notification()
            notif['type'] = params['type']
            notif['message'] = params['message']
            notif['user'] = user['user']
            notif.save()
            try:
                notif.notify()
            except Exception as e:
                err = str(e)
            total += 1
        return {'count': total, 'error': err}


@view_config(route_name='notifications_delete', renderer='json', request_method='POST')
def delete_notification_list(request):
    """
    Delete a list of notification

    TODO: use pymongo for batch delete
    """

    (params, empty) = request.params.items()[0]
    params = json.loads(params)
    userid = authenticated_userid(request)
    current_user = connection.User.fetch_one({'email': userid})

    ids = params['list']
    total = 0
    for nid in ids:
        notif = connection.Notification.fetch_one({'_id': ObjectId(nid)})
        if not notif:
            continue
        if notif['user'] == current_user['_id']:
            total += 1
            notif.delete()
    return {"count": total}


@view_config(context=HTTPClientError, renderer='json')
def http_client_error(exc, request):
    """ specific json renderer for HTTPClientError """
    request.response.status_int = 400
    return {'title': exc.title,
            'explanation': exc.explanation,
            'detail': exc.detail}

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
    user = connection.User.fetch_one({'email': email})
    newuser = False
    if not user:
        newuser = True
        user = connection.User()
        user['email'] = email
        if password:
            if not encrypted:
                user['hashed_password'] = bcrypt.hashpw(password,
                bcrypt.gensalt())
            else:
                user['hashed_password'] = password
        user.save()
        # create first project
        default_project = connection.Project()
        default_project['owner'] = user['_id']
        default_project['users'] = [{'role': u'manager',
                                     'user': user['_id']
                                   }]
        default_project['name'] = 'my project'
        default_project.save()
        # set this project to be opened by default
        user['default_project'] = default_project['_id']
        user.save()
    return (user, newuser)

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
        con = ldap.initialize('ldap://' + mob_config['auth']['ldap']['host'] +
                              ':' + str(mob_config['auth']['ldap']['port']))
    except Exception, err:
            log.error(err)
            return None

    base_dn = 'ou=People,' + mob_config['auth']['ldap']['dn']

    filter = "(&""(|(uid=" + username + ")(mail=" + username + ")))"
    try:
        con.simple_bind_s()
        attrs = ['mail', 'homeDirectory']
        results = con.search_s(base_dn, ldap.SCOPE_SUBTREE, filter, attrs)
        if results:
            return True
        return False
    except Exception, err:
        log.error(err)
        return None


def check_user_ldap(username, password=None,
                    mob_config=MobyleConfig.get_current()):
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
        con = ldap.initialize('ldap://' + mob_config['auth']['ldap']['host'] +
                              ':' + str(mob_config['auth']['ldap']['port']))
    except Exception, err:
            log.error(err)
            return None

    base_dn = 'ou=People,' + mob_config['auth']['ldap']['dn']
    opt_filter = ''
    if mob_config['auth']['ldap']['filter']:
        opt_filter = mob_config['auth']['ldap']['filter']

    filter = "(&" + opt_filter + "(|(uid=" + username + ")(mail=" +\
             username + ")))"
    try:
        con.simple_bind_s()
    except Exception, err:
        log.error(err)
        return None

    attrs = ['mail', 'homeDirectory']
    try:
        # Get user info
        results = con.search_s(base_dn, ldap.SCOPE_SUBTREE, filter, attrs)
        user_dn = None
        ldapMail = None
        ldapHomeDirectory = None
        for dn, entry in results:
            user_dn = str(dn)
            ldapHomeDirectory = entry['homeDirectory'][0]
            ldapMail = entry['mail'][0]
        con.simple_bind_s(user_dn, password)
        con.unbind_s()
        if user_dn:
            (db_user, newuser) = create_if_no_exists(ldapMail)
            if newuser and ldapHomeDirectory:
                db_user['home_dir'] = ldapHomeDirectory
                db_user.save()
            return db_user

    except Exception, err:
        log.error('Could not find the user based on current filter: ' +
                   filter + ", " + str(err))
        return None
    return None


def check_user_pw(username, password):
    """checks for plain password vs hashed password in database"""
    if not password or password == '':
        return None
    user = connection.User.fetch_one({'email': username})
    if not user:
        return False
    hashed = bcrypt.hashpw(password, user['hashed_password'])
    if hashed == user['hashed_password']:
        return user
    else:
        return None


@view_config(route_name='main')
def main_page(request):
    return HTTPFound(location="app/")


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

    request.db.login_log.insert({'username': username})
    headers = remember(request, username)
    (userobj, newuser) = create_if_no_exists(username)
    settings = request.registry.settings

    return HTTPFound(location="app/", headers=headers)


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
            return HTTPFound(location="/", headers=headers)
    return Response("not logged in")


#simply logout
@view_config(route_name='logout')
def logout(request):
    headers = forget(request)
    request.session.flash("You have logged out")
    return HTTPFound(location='/', headers=headers)


@view_config(route_name="auth_reset_password", renderer="json")
def auth_reset_password(request):
    '''
    User asks for a password reset.
    Generates a temporary token and send an email to
    the user.
    '''
    user = connection.User.fetch_one({'email':
                                     request.params.getone('username')})
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
    msg = "You have requested to reset your password.\n" + \
    "To do so, you can connect to the following address for 1 hour.\n" + \
           settings['site_uri'] + settings['url.password_reset'] + \
           "?token=" + temptoken['token'] + \
           "\nThe Mobyle portal team."
    log.debug('send mail ' + msg)
    message = Message(subject="Mobyle password reset request",
                      recipients=[user['email']],
                      body=msg)
    mailer.send_immediately(message)
    return {}


@view_config(route_name="auth_confirm_email")
def auth_confirm_email(request):
    token = request.params.getone('token')
    token_object = connection.Token.fetch_one({'token': token})
    if token_object is None:
        return HTTPForbidden()
    if not token_object.check_validity():
        return HTTPForbidden()

    # Token is valid, create user from token dataa
    ruser = token_object['data']
    (userobj, newuser) = create_if_no_exists(ruser['email'], ruser['password'], True)

    if not newuser:
        return HTTPForbidden()

    return HTTPFound(location="app/" +
                     "#/login")


@view_config(route_name="auth_update_password", renderer="json")
def auth_update_password(request):
    '''
    Password update
    '''
    token = request.params.getone('token')
    password = request.params.getone('password')
    token_object = connection.Token.fetch_one({'token': token})
    if token_object is None:
        return HTTPForbidden()
    if not token_object.check_validity():
        return HTTPForbidden()
    user = connection.User.fetch_one({'email': token_object['user']})
    if not user:
        return HTTPNotFound()
    # Update password
    hashed = bcrypt.hashpw(password, bcrypt.gensalt())
    user['hashed_password'] = hashed
    user.save()
    log.debug("User " + token_object['user'] + " has reset its password")
    return {}



@view_config(route_name="auth_login", renderer="json")
def auth_login(request):
    '''
    Login request
    '''
    # Needed for:
    # - Mozilla Persona
    # - Mobyle account
    userid = authenticated_userid(request)
    if userid:
        log.debug("Someone is logged " + str(userid))
        user = connection.User.fetch_one({'email': userid})
        return {'user': user['email'], 'status': 0, 'msg': '',
                'admin': user['admin'],
                'default_project': str(user['default_project'])
               if user['default_project'] else False}

    msg = ''
    user = None
    admin = False
    default_project = None
    auth_system = request.matchdict['auth']
    settings = request.registry.settings
    if auth_system == 'register':
        #ruser = request.json_body
        ruser = {}
        ruser['email'] = request.params.getone('username')
        mob_config = MobyleConfig.get_current()
        userexists = connection.User.fetch_one(
                         {'email': request.params.getone('username')})
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
                temptoken['data'] = ruser
                temptoken.save()
                # Send email
                mailer = get_mailer(request)
                settings = request.registry.settings
                mailmsg = "You have requested to create an account.\n" + \
                  "To do so, you can connect to the following address \
                  for 1 hour.\n" + \
                  request.route_url('auth_confirm_email') + \
                  "?token=" + temptoken['token'] + \
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
        user_doc = connection.User.fetch_one({'email': user})
        if user_doc:
            default_project = user_doc.get('default_project')
    return {'user': user, 'status': status, 'msg': msg, 'admin': admin,
                        'default_project': str(default_project)
                        if default_project else False}


@view_config(route_name="auth_logout", renderer="json")
def auth_logout(request):
    '''logout request'''
    # logout
    headers = forget(request)
    request.response.headerlist.extend(headers)
    return {'user': None, 'status': 0, 'msg': ''}


@view_config(route_name='about', renderer='mobyle.web:templates/about.mako')
def about(request):
        return {
        }


@view_config(route_name='services_by_topic')
def services_by_topic(request):
    classification = connection.Classification.fetch_one(
        {'root_term': 'EDAM_topic:0003'})
    if classification is None:
        log.error('services classification by topic is not defined')    
        raise HTTPClientError('no topic classification defined')
    tree_list = classification.get_classification(
                    filter=request.params.get('filter', None))
    objlist = json.dumps(tree_list, default=json_util.default)
    return Response(body=objlist, content_type="application/json")


@view_config(route_name='services_by_operation')
def services_by_operation(request):
    classification = connection.Classification.fetch(
        {'root_term': 'EDAM_topic:0004'})
    tree_list = classification.get_classification(
                    filter=request.params.get('filter', None))
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
    if 'identifier' in request.matchdict:
        # identifier can be an object id or a public name
        try:
            mffilter["_id"] = ObjectId(request.matchdict['identifier'])
        except:
            mffilter["public_name"] = request.matchdict['identifier']
    if 'service_version' in request.matchdict:
        mffilter["version"] = request.matchdict['service_version']
    collection = DbConn.get_db('Service')
    obj = collection.fetch_one(mffilter)
    if not obj:
        raise HTTPNotFound()
    response = {'object': 'service', 'status': 0,
                'service': obj, 'filter': mffilter}
    response = json.dumps(response, default=json_util.default)
    return Response(body=response, content_type="application/json")


@view_config(route_name='create_project_data', request_method='POST')
def create_project_data(request):
    '''Create data in a project
    :param request: HTTP params
               param keys:
                   'name' file name
                   'description' data description
                   'tags' data tags
                   'project' ID of the project it is included in
                   'value' data value
                           (stored in file or in the db)
                   'format_terms' file format term
                   'data_terms' data type term
    :type request: IMultiDict
    :return: json - Object entry in the database
    '''
    options = {}
    #container project
    try:
        project_id = ObjectId(request.params['project'])
    except KeyError:
        raise HTTPClientError('missing project identifier')
    except InvalidId:
        raise HTTPClientError('invalid project identifier')
    #project data properties
    try:
        data_name = request.params['name']
    except KeyError:
        raise HTTPClientError('missing name for data')
    try:
        file_contents = request.params['value']
    except KeyError:
        raise HTTPClientError('missing data value')
    options['project'] = project_id
    objectManager = ObjectManager()
    my_dataset = objectManager.add(data_name, options, False)
    my_path = my_dataset.get_file_path()
    # Write a file to the dataset directory
    data_file = os.path.join(my_path, data_name)
    handle = open(data_file, 'w')
    handle.write(file_contents)
    handle.close()
    my_data = RefData()
    my_data['path'] = data_name
    my_data['size'] = os.path.getsize(data_file)
    my_data['type'] = FormattedType()
    if 'description' in request.params:
        my_data['description'] = request.params['description']
    if 'tags' in request.params:
        my_data['tags'] = request.params.getall('tags')
    if 'format_terms' in request.params:
        my_data['type']['format_terms'] = request.params['format_terms']
    if 'data_terms' in request.params:
        my_data['type']['data_terms'] = request.params['data_terms']
    my_dataset.schema(my_data)
    my_dataset.status(ObjectManager.READY)
    #save data
    my_dataset.save_with_history([data_name], 'new file')
    #generate response
    response = my_dataset
    response = json.dumps(response, default=json_util.default)
    return Response(body=response, content_type="application/json")


@view_config(route_name='update_project_data', request_method='PUT')
def update_project_data(request):
    '''Update data in a project
    :param request: HTTP params
               matchdict keys:
                   'id' ProjectData identifier
               param keys:
                   'name' file name
                   'description' data description
                   'tags' data tags
                   'value' data value
                           (stored in file or in the db)
    :type request: IMultiDict
    :return: json - Object entry in the database
    '''
    #identifier
    try:
        projectdata_id = ObjectId(request.matchdict['id'])
    except KeyError:
        raise HTTPClientError('missing ProjectData id')
    except InvalidId:
        raise HTTPClientError('invalid ProjectData id')
    my_dataset = ObjectManager.get(projectdata_id)
    #project data properties
    if 'name' in request.params:
        my_dataset['name'] = request.params['name']
    if 'description' in request.params:
        my_dataset['description'] = request.params['description']
    if 'tags' in request.params:
        my_dataset['tags'] = request.params.getall('tags')
    if 'value' in request.params:
        my_path = my_dataset.get_file_path()
        # Write a file to the dataset directory
        data_file = os.path.join(my_path,
                                 my_dataset['name'])
        handle = open(data_file, 'w')
        handle.write(request.params['value'])
        handle.close()
        my_dataset['data']['size'] = os.path.getsize(data_file)
        my_dataset.status(ObjectManager.READY)
    #save data
    my_dataset.save_with_history([my_dataset['name']], 'new file')
    #generate response
    response = my_dataset
    response = json.dumps(response, default=json_util.default)
    return Response(body=response, content_type="application/json")


@view_config(route_name='list_project_data', request_method='GET')
def list_project_data(request):
    '''Get data in a project
    :param request: HTTP params
             keys: 'project' Project ID
    :type request: IMultiDict
    :return: json - dictionary for the data
             keys: 'name' file name
                   'description' data description
                   'tags' data tags
                   'project' ID of the project it is included in
                   'contents' file contents
                   'format' file format term
                   'type' data type term
    '''
    try:
        project_id = ObjectId(request.matchdict['project'])
    except KeyError:
        raise HTTPClientError('missing project data identifier')
    project_data_cursor = connection.ProjectData.fetch({'project': project_id})
    project_data_list = []
    # list all project data
    for doc in project_data_cursor:
        if doc['data'] and 'path' in doc['data']:
            file_path = ObjectManager.get(doc['_id']).get_file_path()
            doc['value'] = ''
            doc['file_path'] = os.path.join(file_path, doc['data']['path'])
            try:
                handle = open(doc['file_path'], 'r')
                doc['value'] += handle.read()
                handle.close()
            except IOError:
                log.error('file for "%s" (id "%s") at "%s" cannot be read'
                          % (doc['name'],
                             doc['_id'],
                             doc['file_path']))
                doc['error'] = 'contents cannot be accessed'
        elif doc['data'] and 'value' in doc['data']:
            doc['value'] = doc['data']['value']
        else:
            doc['error'] = 'no value defined for this data'
        project_data_list.append(doc)
    response = json.dumps(project_data_list, default=json_util.default)
    return Response(body=response, content_type="application/json")


@view_config(route_name='raw_project_data', renderer='json')
def raw_project_data(request):
    #identifier
    try:
        projectdata_id = ObjectId(request.matchdict['id'])
    except KeyError:
        raise HTTPClientError('missing ProjectData id')
    except InvalidId:
        raise HTTPClientError('invalid ProjectData id')
    dataset = connection.ProjectData.fetch_one({"_id": projectdata_id})
    # Get full path to the file
    file_path = os.path.join(dataset.get_file_path(), dataset['data']['path'])
    mime_type = "text/plain"
    response = FileResponse(file_path,
                            request=request,
                            content_type=str(mime_type))
    # download the file directly
    if request.matchdict['disposition'] == 'dl':
        response.content_disposition = 'attachment; filename="'\
                                       + dataset['data']['path'] + '"'
    return response


@view_config(route_name='list_project_jobs', request_method='GET',
    renderer='json')
def list_project_jobs(request):
    '''Get jobs in a project
    :param request: HTTP params
             keys: 'project' Project ID
    :type request: IMultiDict
    :return: json - dictionary for the jobs
             keys: 'name' file name
                   'description' data description
                   'tags' data tags
                   'project' ID of the project it is included in
                   'contents' file contents
                   'format' file format term
                   'type' data type term
    '''
    try:
        project_id = ObjectId(request.matchdict['project'])
    except KeyError:
        raise HTTPClientError('missing project data identifier')
    jobs_cursor = connection.Job.fetch({'project': project_id})
    jobs_list = []
    # list all project data
    for doc in jobs_cursor:
        jobs_list.append(doc)
    return jobs_list

@view_config(route_name='get_project_job', request_method='GET',
    renderer='json')
def get_project_job(request):
    '''Get a job
    :param request: HTTP params
             keys: 'job' Job ID
    :type request: IMultiDict
    :return: json - dictionary representing the job
    '''
    try:
        job_id = ObjectId(request.matchdict['id'])
    except KeyError:
        raise HTTPClientError('missing job identifier')
    job = connection.Job.fetch_one({'_id': job_id})
    for name, value in job['inputs'].items():
        job['inputs'][name] = job.get_input_value(name)
    return job

@view_config(route_name='format_dataterms', request_method='GET',
             renderer='json')
def list_format_dataterms(request):
    '''
    Get dataterms represented by a format ID
    !TODO: this method is only used for tests so far
    '''
    data_terms = []
    for format_term_id in request.params.getall('format_term'):
        format_term = connection.FormatTerm.fetch_one({'id': format_term_id})
        if format_term is not None:
            for data_term in format_term.represents_dataterms():
                data_term['_id'] = None
                data_terms.append(data_term)
    return data_terms


@view_config(route_name='create_project_job', request_method='POST',
             renderer='json')
def create_project_job(request):
    '''Create job in a project
    :param request: HTTP params
               param keys: FIXME
    :type request: IMultiDict
    :return: json - Object entry in the database
    '''
    #container project
    try:
        project_id = ObjectId(request.params['project'])
    except KeyError:
        raise HTTPClientError('missing project identifier')
    except InvalidId:
        raise HTTPClientError('invalid project identifier')
    #find requested service
    mffilter = mf_filter('service', MF_READ, request)
    if mffilter is None:
        raise HTTPForbidden
    if not('service' in request.params):
        raise HTTPClientError('no service specified')
    if 'service' in request.params:
        # identifier can be an object id or a public name
        try:
            mffilter["_id"] = ObjectId(request.params['service'])
        except:
            mffilter["public_name"] = request.params['service']
            if 'service_version' in request.params:
                mffilter["version"] = request.params['service_version']
    job_service = connection.Service.fetch_one(mffilter)
    if job_service is None:
        raise HTTPClientError('service %s not found' %
                              request.params['service'])
    #TODO: create ProgramJob or WorkflowJob according to the required service
    job = connection.ProgramJob()
    init_status = Status(Status.TO_BE_BUILT)
    job['status'] = init_status
    job['project'] = project_id
    job['service'] = job_service
    job['inputs'] = {}
    # process job input parameters
    request = formencode.variabledecode.variable_decode(request.params, dict_char=':')
    job.process_inputs(request['input'])
    job.save()
    return job
