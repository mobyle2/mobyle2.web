import sys
sys.path.append( '/home/bneron/Mobyle/Mobyle2_moteur' )

import cPickle

with open('/tmp/mob2.db') as f:
	db = cPickle.load(f)

job_ids = db.keys()
job_ids.sort()
for job_id in job_ids:      
	print job_id , "...", db[ job_id ]


