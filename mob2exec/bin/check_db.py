import sys
sys.path.append( '/home/legros/Desktop/mobyle2b/mob2exec' )

import cPickle

with open('/tmp/mob2.db') as f:
	db = cPickle.load(f)

job_ids = db.keys()
job_ids.sort()
for job_id in job_ids:      
	print job_id , "...", db[ job_id ]


