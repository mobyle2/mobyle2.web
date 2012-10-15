# -*- coding: utf-8 -*-

'''
Created on Aug 27, 2012

@author: Bertrand Néron
@contact: bneron@pasteur.fr
@organization: Institut Pasteur
@license: GPLv3
'''
import os
import sys

MOBYLE_HOME = os.path.abspath( os.path.join( os.path.dirname( __file__ ) , "../" ) )
os.environ[ 'MOBYLE_HOME' ] = MOBYLE_HOME
if ( MOBYLE_HOME ) not in sys.path:
    sys.path.append( MOBYLE_HOME )
    
import unittest
import time

from lib.execution_engine.jobstable import JobsTable
from lib.core.status import Status
from lib.core.jobref import JobRef

class JobsTableTest(unittest.TestCase):

        

    def test_put_get_pop(self):
        jt = JobsTable()
        j1 = JobRef( 'id_1', time.time(), Status(Status.BUILDING), 'owner')
        jt.put(j1)
        self.assertEqual(len(jt.jobs()), 1)
        j2 = jt.get(j1.id)
        self.assertEqual(j1, j2)
        self.assertEqual(len(jt.jobs()), 1)
        j3 = jt.pop(j1.id)
        self.assertEqual(j1, j3)
        self.assertEqual(len(jt.jobs()), 0)
        
        
    def test_jobs(self):
        jt = JobsTable()
        jobs_send = [ JobRef( 'id_%d' % i , time.time(), Status(Status.BUILDING), 'owner') for i in range(0, 5) ]
        for j in jobs_send:
            jt.put(j)
        jobs_recieved = jt.jobs()    
        self.assertEqual( jobs_send, jobs_recieved)
        
        
            
if __name__ == "__main__":
    unittest.main()