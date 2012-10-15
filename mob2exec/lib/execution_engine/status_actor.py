# -*- coding: utf-8 -*-
'''
Created on Aug 13, 2012

@author: Bertrand Néron
@contact: bneron@pasteur.fr
@organization: Institut Pasteur
@license: GPLv3
'''

import logging
import logging.config
from conf.logger import client_log_config

import multiprocessing
import setproctitle

from ..core.status import Status

#####################
import random
import time
######################
        
class StatusActor(multiprocessing.Process):
    """
    get the status from the execution system for a job
    """
    
    def __init__(self, table, job_id ):
        """
        @param jobs_table: the container shared by all containing all L{JobRef} alive in the system
        @type jobs_table: L{JobsTable} instance 
        @param job_id: the id of the job to treat
        @type job_id: string
        """
        super(StatusActor, self).__init__()
        self._log = None
        self.table = table  
        self.job_id = job_id
           
    def run(self):
        self._name = "StatusActor-%d" % self.pid
        setproctitle.setproctitle('mob2_status')
        logging.config.dictConfig(client_log_config)
        self._log = logging.getLogger( __name__ ) 
        
        ####################### BOUCHON ###############################
        if random.randint(0, 1):
            job = self.table.pop(self.job_id )
            old_status = job.status
            if job.status == Status(Status.SUBMITTED):
                job.status = (Status(Status.RUNNING), Status(Status.PENDING))[ random.randint(0, 1) ]
            elif job.status == Status(Status.PENDING):
                job.status = (Status(Status.RUNNING), Status(Status.FINISHED), Status(Status.ERROR), Status(Status.KILLED))[random.randint(0, 3)]
                if job.status != Status(Status.RUNNING):
                    job.end_time = time.time()
            elif job.status == Status(Status.RUNNING):
                job.status = (Status(Status.FINISHED), Status(Status.ERROR), Status(Status.KILLED) )[random.randint(0, 2)]
                job.end_time = time.time()
            self._log.debug( "%s change status from %s to %s and put %s in table" % ( self._name , old_status , job.status, job.id ))
            self.table.put( job )
        else:
            self._log.debug( "%s do nothing" % self._name)
        ####################### FIN BOUCHON #########################################
        
        self._log.debug( "%s exiting" % self._name)
        
        
