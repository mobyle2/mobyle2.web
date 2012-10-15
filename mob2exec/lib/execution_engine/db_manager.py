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
import time
import setproctitle
 
from lib.core.jobref import JobRef
from lib.core.status import Status

         
class DBManager(multiprocessing.Process):
    """
    synchronize the data base with the job in the system
     - get new entry in database and put the corresponding job in the JobsTable
     - update the status of running job from the system in the database
     - remove the completed jobs from the jobsTable
    """
    
    def __init__(self, jobs_table, master_q):
        """
        @param jobs_table: the container shared by all containing all L{JobRef} alive in the system
        @type jobs_table: L{JobsTable} instance 
        @param master_q: a communication queue to listen comunication emit by the L{Master} instance
        @type master_q: L{multiprocessing.Queue} instance
        """
        super( DBManager, self).__init__()
        self.master_q = master_q
        self.jobs_table = jobs_table
        self._log = None
        
    def run(self):
        self._name = "DBManager-%d" % self.pid
        setproctitle.setproctitle('mob2_DBManager')
        logging.config.dictConfig(client_log_config)
        self._log = logging.getLogger( __name__ ) 
        while True :
            try:
                from_master = self.master_q.get( False ) if not self.master_q.empty() else None
            except IOError:
                #[Errno 32] Broken pipethe Master does not respond anymore
                #then the jobsTable is down too
                break
            if from_master == 'STOP':
                self.stop()
                break
            elif from_master == 'RELOAD':
                self.reload_conf()
            try:
                jobs_to_update = self.jobs_table.jobs()
            except IOError:
                #[Errno 32] Broken pipethe Master does not respond anymore
                #then the jobsTable is down too
                break
            with DBConnection() as conn:
                self.update_jobs( conn , jobs_to_update )
                new_jobs = self.get_new_jobs( conn )
            for job in new_jobs:
                self.jobs_table.put( job )
            time.sleep(2)
     
    def stop(self):
        jobs_to_update = self.jobs_table.jobs()
        with DBConnection() as conn:
            self.update_jobs(conn , jobs_to_update)       
            
    def update_jobs(self , conn , jobs_to_update ):
        """
        synchronize the db with the jobs from the jobs_table
        and remove completed jobs from the jobs table
        @param conn: a connection to the database
        @type conn:
        @param jobs_to_update: the jobs to update
        @type jobs_to_update: list of L{JobRef} 
        """
        for job in jobs_to_update:
            #mise a jour de tous les jobs 
            conn[ job.id ].update( {
                                       'status': str( job.status ),
                                       'end_time': job.end_time ,
                                       'has_been_notified' : job.has_been_notified
                                       }
                                     ) 
            if job.status.is_ended() :
                if job.must_be_notified():
                    if job.has_been_notified:
                        self.jobs_table.pop( job.id )
                    else:
                        pass
                else:
                    self.jobs_table.pop( job.id )
            else:
                pass

    def get_new_jobs(self , conn ):
        """
        get the new job entries in the db and fill the jobs_table with the correspondin job
        @param conn: a connection to the database
        @type conn:
        """
        ## Bouchon simulant une requette a la DB pour recuperer les nouveau job a soumettre ##
        global job_cpt
        max_job = 500
        entries = []
        if job_cpt == max_job:
            return entries
        for id_ in range(job_cpt , min(job_cpt + 10 , max_job) ):
            job_cpt = id_
            try:
                job = conn[ id_ ]        
            except KeyError:
                continue
            entries.append( job )
            job_cpt += 1                            
        self._log.debug( "%s new entries = %s"%(self._name, [ en['id'] for en in entries ] ) )           
        ## fin bouchon ##
        
        active_jobs_id = [ j.id for j in self.jobs_table.jobs() ]
        self._log.debug( "%s active_jobs_id = %s (%d)"%(self._name, active_jobs_id, len( active_jobs_id )) )
        new_jobs = []
        for entry in entries:
            job_id = entry['id'] 
            if job_id not in active_jobs_id:
                job = JobRef( entry['id'], entry['create_time'] , Status( Status.BUILDING ), entry['owner'] )
                new_jobs.append( job )
        self._log.debug( "%s new_jobs = %s"%(self._name, [ j.id for j in new_jobs ]))
        return new_jobs

    
    def reload_conf(self):
        #relire la conf
        self.self._log.debug("%s reload() relit sa conf" %self._name )
        pass  
        

      
##############################################
#
# Bouchon DB
#
#############################################


import cPickle 
import os.path  
class DBConnection(object):
    
    def __init__(self , cnx_params = None):
        self.cnx_params = { 'path' : '/tmp/mob2.db' }
        self.cnx = None
    
    
    def open(self):
        if not os.path.exists( self.cnx_params['path']) or os.path.getsize(self.cnx_params['path']) == 0:
            f = open( self.cnx_params['path'] , 'w')
            self.cnx = {}
            cPickle.dump( self.cnx , f )
            f.close()
        f = open( self.cnx_params['path'])
        self.cnx = cPickle.load( f )
        f.close()
        return self.cnx
    
    def close(self):
        self.cnx = None
    
    def commit(self):
        f = open( self.cnx_params['path'] , 'w')
        cPickle.dump( self.cnx , f )
        f.close()
        self.cnx = None
        
    def rollback(self):
        self.close()
    
    
    def __enter__(self):
        #gerer la connnection a la base de donnée
        d = self.open()
        return d
    
    def __exit__(self, exctype, exc, tb):
        """
        """
        if tb is None: #no traceback means no error
            self.commit()
            success = True
        else:
            self.rollback()
            success = False
        return success


job_cpt = 0
