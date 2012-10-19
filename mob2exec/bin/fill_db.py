import sys
sys.path.append( '/home/bneron/Mobyle/Mobyle2_moteur' )
import cPickle
import time 
import random

from  lib.core.status import Status 

cmdlines={
		1:{ 'name':'blast', 
		     'cmd_line': 'blastall -p blastp -d uniprot_sprot -i abcd2_mouse.fa -e 0.1 -o blast2.txt',
		     'inputs':[( 'abcd2_mouse.fa', """>ABCD2_MOUSE RecName: Full=ATP-binding cassette sub-family D member 2; AltName: Full=Adrenoleukodystrophy-related protein;
MIHMLNAAAYRVKWTRSGAAKRAACLVAAAYALKTLYPIIGKRLKQPGHRKAKAEAYSPAENREILHCTEIICKKPAPGL
NAAFFKQLLELRKILFPKLVTTETGWLCLHSVALISRTFLSIYVAGLDGKIVKSIVEKKPRTFIIKLIKWLMIAIPATFV"""
		      )]
		     },
		2:{ 'name': 'golden', 
		    'cmd_line': 'golden uniprot_sprot:abcd2_rat',
		    'inputs':[]
		    },
		3:{ 'name': 'clustalw',
		    'cmd_line':'clustalw -align -infile=abcd.fasta',
		    'inputs' : [( 'abcd.fasta' , """>1pgb
MTYKLILNGKTLKGEAVDAATAEKVFKQYANDNGVDGEWTYTKTFTVTE
>1txt
MTYKLILNGKTLKGETTTEAVDAATAEKVNDNGVDGEWTYDDATKTFTVTE
>1trt
MTYKLILNGKTLKGETTTEAVDAATAEKVFKQYANDNGVDGEWTYDDATKTFTVTE""")]
		    }
		}

db ={}
job_id = 0
for job_id in range(0,500):
	j = cmdlines[ random.randint(1,3)]
	db[job_id] = {
				  'id' : job_id ,
				  'job_name' :j['name'],
                  'create_time': time.time(), 
                  'end_time': -1 ,
                  'status': Status( Status.BUILDING ) ,
                  'cmd_line': j['cmd_line'],
                  'inputs': j['inputs'] ,
                  'has_been_notified' : False ,
                  'owner' : 'a_user_space',
                  }
	
with open('/tmp/mob2.db', 'w') as f:
	cPickle.dump( db , f )
	

