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
        self.load_all_services()
        self.sublevels = self.load_level([])

    def load_all_services(self):
        """
        load all services in a dictionary sorted per classification key
        """
        self.services_by_key = {}
        for s in Service.find({}):
            keys = [i['classification'] for i in s['classifications'] if i['type']=='EDAM']
            entry = {'name':s['name'],
                             'version':s['version'],
                             '_id':s['_id']}
            for key in keys:
                if not(self.services_by_key.has_key(key)):
                    self.services_by_key[key]=[entry]
                else:
                    self.services_by_key[key].append(entry)

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
            key = '/edam/'+self.key+'/000'+t['id'].split(':')[1]
            level['services'] = self.services_by_key.get(key,[])
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
