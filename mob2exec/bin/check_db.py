import os 
import sys

MOBYLEHOME = None
if os.environ.has_key('MOBYLEHOME'):
    MOBYLEHOME = os.environ['MOBYLEHOME']
if not MOBYLEHOME:
    sys.exit('MOBYLEHOME must be defined in your environment')
 
if ( os.path.join( MOBYLEHOME, 'mob2exec' ) ) not in sys.path:
    sys.path.append(  os.path.join( MOBYLEHOME, 'mob2exec' )  )

import cPickle
from  conf.config import SANDBOX

with open(os.path.join( SANDBOX , 'mob2.db')) as f:
    db = cPickle.load(f)

job_ids = db.keys()
job_ids.sort()
for job_id in job_ids:      
    print job_id , "...", db[ job_id ]

