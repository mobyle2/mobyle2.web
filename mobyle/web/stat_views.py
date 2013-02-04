# -*- coding: utf-8 -*-
from pyramid.view import view_config
from pyramid.security import remember, authenticated_userid, forget

from pyramid.httpexceptions import HTTPFound
from pyramid.renderers import render_to_response
from pyramid.response import Response

import json
from bson import json_util
import time

import requests

from pyramid.httpexceptions import HTTPFound

import mobyle.common
from mobyle.common import session
from mobyle.common.config import Config
from mobyle.common.program import Program

from mobyle.common.stats.stat import HourlyStatistic,DailyStatistic,MonthlyStatistic

from bson.code import Code

import datetime
from datetime import datetime, timedelta

import logging
log = logging.getLogger(__name__)

@view_config(route_name='statistics_usage_json', renderer='json')
def stats_usage_json(request):
    type = 'month'
    fromdate = None
    todate = None 
    filter = {}
    try:
        type = request.params.getone('type')
    except Exception:
        type = 'month'
    try:
        f = request.params.getone('fromdate')
        fromdate = datetime.strptime(f,"%m/%d/%Y")
    except Exception as e:
        fromdate = None
    try:
        t = request.params.getone('todate')
        todate = datetime.strptime(t,"%m/%d/%Y")
    except Exception:
        todate = None
    if fromdate is not None and todate is not None:
        filter = { 'timestamp' : { '$gte' : fromdate, '$lt': todate }}
    elif fromdate is not None:
        filter = { 'timestamp' : { '$gte' : fromdate }}
    elif todate is not None:
        filter = { 'timestamp' : { '$lt' : todate }}

    if type == 'hour':
        result = mobyle.common.session.HourlyStatistic.find(filter)
    if type == 'day':
        result = mobyle.common.session.DailyStatistic.find(filter)
    if type == 'month':
        result = mobyle.common.session.MonthlyStatistic.find(filter)

    usages = []
    for usage in result:
      timestamp = time.mktime(usage['timestamp'].timetuple())
      usages.append({ "x" : timestamp, "y" : usage['total'] })
    return [ { "color" : "steelblue"  ,"name" : "Jobs", "data" : usages } ]


@view_config(route_name='statistics_usage', renderer='mobyle.web:templates/statistics_usage.mako')
def stats_usage(request):
    type = 2
    try:
        type = int(request.params.getone('type'))
    except Exception:
        type = 2
    if type == 0:
        # Last 24  hours only
        result = mobyle.common.session.HourlyStatistic.find({ 'timestamp' : { '$gte' : datetime.today()-timedelta(days=1) }})
        gtype = 'hour'
    if type == 1:
        result = mobyle.common.session.DailyStatistic.find()
        gtype = 'day'
    if type == 2:
        result = mobyle.common.session.MonthlyStatistic.find()
        gtype = 'month'

    return  { 'usages' : result, 'type' : gtype }


@view_config(route_name='statistics_user', renderer='mobyle.web:templates/statistics_user.mako')
def stats_user(request):
    return {}

@view_config(route_name='statistics', renderer='mobyle.web:templates/statistics.mako')
def stats(request):
    type = 2
    try:
        type = int(request.params.getone('type'))
    except Exception:
        type = 2
    map = Code("function () {"
            "  for(var job in this.jobs) {"
            "    emit(job, this.jobs[job]);"
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
    try:
        if type == 0:
            result = mobyle.common.session[Config.config().get('app:main','db_name')].hourlystatistics.map_reduce(map, reduce, {"inline" : 1})
        if type == 1:
            result = mobyle.common.session[Config.config().get('app:main','db_name')].dailystatistics.map_reduce(map, reduce, {"inline" : 1})
        if type == 2:
            result = mobyle.common.session[Config.config().get('app:main','db_name')].monthlystatistics.map_reduce(map, reduce, {"inline" : 1})
    except Exception as e:
        log.error("Could not exec mapreduce on stats: "+str(e)) 
    programs = mobyle.common.session[Config.config().get('app:main','db_name')].programs.count()
    return  { 'jobs' : result, 'programs' : programs }


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
    try:
        if type == 0:
            result = mobyle.common.session[Config.config().get('app:main','db_name')].hourlystatistics.map_reduce(map, reduce, {"inline" : 1})
        if type == 1:
            result = mobyle.common.session[Config.config().get('app:main','db_name')].dailystatistics.map_reduce(map, reduce, {"inline" : 1})
        if type == 2:
            result = mobyle.common.session[Config.config().get('app:main','db_name')].monthlystatistics.map_reduce(map, reduce, {"inline" : 1})
    except Exception as e:
        log.error("Could not exec mapreduce on stats: "+str(e))
    return  { 'locations' : result}


