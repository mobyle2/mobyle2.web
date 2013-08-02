import logging
log = logging.getLogger(__name__)

from mobyle.common.connection import connection
from mobyle.common.operation import Operation
from mobyle.common.topic import Topic
from mobyle.common.service import Service

Topic = connection.Topic
Operation = connection.Operation
Service = connection.Service

class Classification:
    """
    tree structure that stores the classification of services
    according to either topics and/or operations
    """
    def __init__(self, key):
        """
        :param key: key use to generate the classification,
                    either 'topic' or 'operation'
        :type key: string 
        """
        self.key = key
        if key == 'topic':
            self.key_class = Topic
        else:
            self.key_class = Operation
        log.debug('started classification loading on %s' % key)
        self.load()
        log.debug('ended classification loading on %s' % key)

    def load(self):
        """
        load or reload the classification
        """
        self.sublevels = self.load_level([])

    def load_services(self, level_key):
        """
        load the services corresponding to a given term
        :param level_key: value of the key which should be
                          looked for
        :type level_key: string
        """
        service_key = '/edam/'+self.key+'/000'+level_key.split(':')[1]
        query = {'classifications':
                 {'type':'EDAM',
                  'classification':service_key}}
        services = []
        for s in Service.find(query):
            services.append({'name':s['name'],
                             'version':s['version'],'_id':s['_id']})
        return services

    def load_level(self, level_filter):
        """
        load a classification level
        :param level_filter: query filter used to select the level
        :type level_filter: dict
        """
        sublevels = []
        for t in self.key_class.find({'subclassOf': level_filter}):
            if not ':' in t['id']:
                continue
            if t['is_obsolete'] == True:
                continue
            level = {'id': t['id'], 'name': t['name']}
            level['services'] = self.load_services(t['id'])
            level['sublevels'] = self.load_level({ '$in': [t['id']]})
            for sublevel in level['sublevels']:
               if len(sublevel['services']) == 1 and\
                  len(sublevel['sublevels']) == 0:
                   # move up a service which is the only one in its sublevel
                   level['services'].append(sublevel['services'][0])
                   level['sublevels'].remove(sublevel)
            if len(level['services']) == 0 and len(level['sublevels']) == 0:
                # do not load empty tree nodes
                continue
            if len(level['services']) == 0 and len(level['sublevels']) == 1:
                # replace current node with child node if there is only one
                level = level['sublevels'][0]
            sublevels.append(level) 
        return sublevels

BY_TOPIC = Classification('topic')

BY_OPERATION = Classification('operation')
