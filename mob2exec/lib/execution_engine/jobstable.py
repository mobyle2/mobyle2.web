# -*- coding: utf-8 -*-
'''
Created on Aug 13, 2012

@author: Bertrand Néron
@contact: bneron@pasteur.fr
@organization: Institut Pasteur
@license: GPLv3
'''

import multiprocessing
import logging
_log = logging.getLogger(__name__)


class JobsTable(object):
    '''
    maintain the list of active jobs. There is one jobsTable instance which is shared by the other processes 
     - the L{DBmanager} instance, 
     - the L{jtMonitor} instance, 
     - the L{SubmitActor} instances, 
     - the L{StatusActor} instances, 
     - the L{NotificationActor} instances
    '''


    def __init__(self):
        '''
        Constructor
        '''
        self.manager = multiprocessing.Manager()
        self.jobs_table = self.manager.dict()
        self._lock = multiprocessing.Lock()
    
    def __iter__(self):
        jobs = self.jobs()    
        return iter( jobs )
    
    def put(self, jobRef ):
        '''
        add a jobRef in table
        @param jobref: the JobRef instance to add in the table
        @type jobRef: L{JobRef} instance
        '''
        with self._lock:
            self.jobs_table[ jobRef.id ] = jobRef
    
    def get(self, job_id ):
        '''
        @param job_id: the id of a jobRef
        @type job_id: string
        @return: the jobRef corresponding to the jobid without remove it from the table.
        @rtype: L{JobRef} instance
        '''
        with self._lock:
            job = self.jobs_table[ job_id ]
        return job
    
    def jobs(self):
        '''
        @return: the list of L{jobRef} contained in the table, sort by the increasing jobRef timestamp
        @rtype: list of L{JobRef}
        '''
        with self._lock:
            job_refs = self.jobs_table.values()
            job_refs.sort()
        return job_refs
    
    def pop(self, job_id ):
        '''
        @param job_id: the id of a JobRef instance
        @type job_id: string
        @return: and remove the JobRef instance corresponding to job_id from the table.
        @rtype: L{JobRef}
        '''
        with self._lock:
            job = self.jobs_table[job_id]
            del self.jobs_table[job_id]
        return job
    
    