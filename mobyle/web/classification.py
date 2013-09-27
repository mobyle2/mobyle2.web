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
        self.root_node = self.load_level()

    def load_all_services(self):
        """
        load all services in a dictionary sorted per classification key
        """
        self.services_by_key = {}
        for s in Service.find({}):
            keys = [i['classification'] for i in s.get('classifications',[]) if i.get('type')=='EDAM']
            entry = {'name':s['name'],
                             'public_name':s.get('public_name'),
                             'version':s.get('version'),
                             '_id':s['_id']}
            if not(keys):
                if self.key=='topic':
                    keys=['/edam/topic/0000003']
                else:
                    keys=['/edam/operation/0000004']
            for key in keys:
                if not(self.services_by_key.has_key(key)):
                    self.services_by_key[key]=[entry]
                else:
                    self.services_by_key[key].append(entry)

    def load_level(self, node_input=None):
        """
        load a classification level
        :param level_filter: query filter used to select the level
        :type level_filter: dict
        """
        node_output = {}

        if node_input:
            node_output['id'] = node_input['id']
            node_output['name'] = node_input['name']
            node_filter = {'subclassOf': { '$in': [node_input['id']]}}
        else:
            node_output['id']='EDAM:0000'
            node_output['name']='nowhere'
            node_filter = {'subclassOf':[]}
        node_output['sublevels']=[]
        for t in self.key_class.find(node_filter):
            if not ':' in t['id']:
                continue
            if t['is_obsolete'] == True:
                continue
            node_output['sublevels'].append(self.load_level(t))

        key = '/edam/'+self.key+'/000'+node_output['id'].split(':')[1]
        node_output['services'] = self.services_by_key.get(key,[])
        if not(node_input):
            node_output['services'] = self.services_by_key.get('EDAM:0000',[])
        return node_output

    def get_classification(self, node_input=None, filter=None):
        if not(node_input):
            node_input = self.root_node
        node_output =  {'id': node_input['id'], 'name': node_input['name'], 'services':[],'sublevels':[]}
        for sublevel in node_input['sublevels']:
            n = self.get_classification(node_input=sublevel,filter=filter)
            if n:
                node_output['sublevels'].append(n)
        if filter is not None:
            node_output['services'] = [service for service in node_input['services'] if filter in service['name']]
        else:
            node_output['services'] = list(node_input['services'])
        node_output = self.prune(node_output)
        return node_output

    def prune(self, node):
        """
        prune classification tree to simplify it
        """
        if len(node['services']) == 0 and len(node['sublevels']) == 0:
            # do not load empty tree nodes
            return None
        if len(node['services']) == 0 and len(node['sublevels']) == 1:
            # replace current node with child node if there is only one
            return node['sublevels'][0]
        return node

BY_TOPIC = Classification('topic')

BY_OPERATION = Classification('operation')
