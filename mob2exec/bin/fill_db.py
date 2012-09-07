import cPickle
import sys
sys.path.append( '/home/bneron/Mobyle/Mobyle2_moteur' )
import time 

from  lib.core.status import Status 

db ={}
job_id = 0
for job_id in range(0,500):
	db[job_id] = {'id' : job_id ,
                      'create_time': time.time(), 
                      'end_time': -1 ,
                      'status': Status( Status.BUILDING ) ,
                      'has_been_notified' : False ,
                      'owner' : 'a_user_space',
                   }
with open('/tmp/mobyle2.db', 'w') as f:
	cPickle.dump( db , f )


 

