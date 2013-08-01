import logging
log = logging.getLogger(__name__)

from mobyle.common.connection import connection
from mobyle.common.operation import Operation
from mobyle.common.topic import Topic
from mobyle.common.service import Service

Topic=connection.Topic
Operation=connection.Operation
Service=connection.Service

class Classification:

    def __init__(self, key):
         self.key = key
         if key=='topic':
             self.key_class = Topic
         else:
             self.key_class = Operation
         self.load()

    def load(self):
        self.sublevels = self.load_level([])

    def load_services(self, level_key):
        query = {'classifications':{'type':'EDAM','classification':'/edam/'+self.key+'/000'+level_key.split(':')[1]}}
        services = []
        for s in Service.find(query):
            services.append({'name':s['name'],'version':s['version'],'_id':s['_id']})
        return services

    def load_level(self, level_filter):
        sublevels = []
        for t in self.key_class.find({'subclassOf': level_filter}):
            if not ':' in t['id']:
                continue
            level = {'id': t['id'], 'name': t['name']}
            level['services'] = self.load_services(t['id'])
            level['sublevels'] = self.load_level({ '$in': [t['id']]})
            sublevels.append(level)
        return sublevels

classification_by_topic = Classification('topic')
classification_by_operation = Classification('operation')
