import logging
log = logging.getLogger(__name__)

from mobyle.common.connection import connection
from mobyle.common.operation import Operation
from mobyle.common.topic import Topic
from mobyle.common.service import Service

Topic=connection.Topic
Operation=connection.Operation
Service=connection.Service

def get_services(edam_id, prefix):
    query = {'classifications':{'type':'EDAM','classification':'/edam/topic/000'+edam_id.split(':')[1]}}
    services = []
    for s in Service.find(query):
        services.append({'name':s['name'],'version':s['version'],'_id':s['_id']})
    return services

def explore_level(level_filter, prefix):
    sublevels = []
    for t in Topic.find({'subclassOf': level_filter}):
        if not ':' in t['id']:
            continue
        level = {'id': t['id'], 'name': t['name']}
        #print "%s%s - %s" % (prefix, t['id'], t['name'])
        level['services'] = get_services(t['id'], prefix+' ')
        level['subtopics'] = explore_level({ '$in': [t['id']]},prefix+' ')
        sublevels.append(level)
    return sublevels
   
classification = explore_level([],'')

