# -*- coding: utf-8 -*-
from pyramid.view import view_config
from pyramid.security import remember, authenticated_userid, forget

from pyramid.httpexceptions import HTTPFound
from pyramid.renderers import render_to_response
from pyramid.response import Response

import json

import requests

from pyramid.httpexceptions import HTTPFound

import mobyle.common
from mobyle.common import session


@view_config(route_name='statistics', renderer='mobyle.web:templates/statistics.mako')
def stats(request):
    return  {}


