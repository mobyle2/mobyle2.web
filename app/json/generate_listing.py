#!/usr/bin/env python
# enrich the JSON listing of services by looking into the JSON of each service
# inputs: listing.json and all the services/*.json
# outputs: enriched_listing.json
import json
import glob
elisting = {'services':[]}
for filename in glob.glob('services/*.json'):
    sdetail = json.load(open(filename,'r'))
    descr = {'name':sdetail.get('name'),'title':sdetail.get('title'),\
             'description':sdetail.get('description'),\
             'references':sdetail.get('references')}
    elisting.get('services').append(descr)
json.dump(elisting,open('enriched_listing.json','w'))
