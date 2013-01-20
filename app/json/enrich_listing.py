#!/usr/bin/env python
# enrich the JSON listing of services by looking into the JSON of each service
# inputs: listing.json and all the services/*.json
# outputs: enriched_listing.json
import json
import re
# removal of leftover XML tags
p = re.compile(r'<.*?>')
def strip_tags(data):
    return p.sub('', data)
listing = json.load(open('listing.json','r'))
elisting={'services':[]}
for sname in listing.get('services'):
    sdetail = json.load(open('services/'+sname+'.json','r'))
    descr = {'name':sname,'title':sdetail.get('title'),\
             'description':strip_tags(sdetail.get('description')),\
             'references':sdetail.get('references')}
    elisting.get('services').append(descr)
json.dump(elisting,open('enriched_listing.json','w'))
