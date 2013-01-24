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
from mobyle.common.config import Config

from mobyle.common.stats.stat import HourlyStatistic,DailyStatistic,MonthlyStatistic

from bson.code import Code

@view_config(route_name='statistics_usage', renderer='mobyle.web:templates/statistics_usage.mako')
def stats_usage(request):
    return {}
@view_config(route_name='statistics_user', renderer='mobyle.web:templates/statistics_user.mako')
def stats_user(request):
    return {}

@view_config(route_name='statistics', renderer='mobyle.web:templates/statistics.mako')
def stats(request):
    return {}

@view_config(route_name='statistics_map', renderer='mobyle.web:templates/statistics_map.mako')
def stats_map(request):
    type = 2
    try:
        type = int(request.params.getone('type'))
    except Exception:
        type = 2
    map = Code("function () {"
            "  for(var loc in this.location) {"
            "    emit(loc, this.location[loc]);"
            "  };"
            "}")
    reduce = Code("function (key, values) {"
               "  var total = {};"
               "  for (var i = 0; i < values.length; i++) {"
               "    if(total['key']==null) { total['key']=0; }"
               "    total['key'] += values[i];"
               "  }"
               "  return total;"
               "}")
    result = {}
    if type == 0:
        result = mobyle.common.session[Config.config().get('app:main','db_name')].hourlystatistics.map_reduce(map, reduce, "worlddistribution")
    if type == 1:
        result = mobyle.common.session[Config.config().get('app:main','db_name')].dailystatistics.map_reduce(map, reduce, "worlddistribution")
    if type == 2:
        result = mobyle.common.session[Config.config().get('app:main','db_name')].monthlystatistics.map_reduce(map, reduce, "worlddistribution")
    return  { 'locations' : result}


