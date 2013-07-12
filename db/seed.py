'''
Initialise database content
'''


import argparse
import os
import sys
from hashlib import sha1
from random import randint
import bcrypt

from mobyle.common.config import Config


parser = argparse.ArgumentParser(description='Initialize database content.')
parser.add_argument('--config')

args = parser.parse_args()

if not args.config:
  print "config argument is missing"
  sys.exit(2)

# Init config
config = Config(args.config).config()

# Init connection
from mobyle.common.connection import connection
from mobyle.common import users
from mobyle.common import project
# Create root user
if connection.User.find({ 'first_name' : 'root' }).count() == 0:
    pwd = sha1("%s"%randint(1,1e99)).hexdigest()
    Config.logger().warn('root user created with password: '+ pwd )
    user = connection.User()
    user['first_name'] = 'root'
    user['last_name'] = 'root'
    user['email'] = config.get("app:main",'root_email')
    user['hashed_password'] = pwd
    user['admin'] = True
    user['type'] = 'registered'
    user['groups'] = [ 'admin' ]
    hashed = bcrypt.hashpw(user['hashed_password'], bcrypt.gensalt())
    user['hashed_password'] = hashed
    user.save()

    # Create default project for root
    project = connection.Project()
    project['name'] = 'admin_project'
    project['owner'] = user['_id']
    project['users'].append({ 'user' : user['_id'], 'role' : 'admin'})
    project['public'] = True
    project.save()


from mobyle.common.mobyleConfig import MobyleConfig
#Create default config
if connection.MobyleConfig.find().count() == 0:
    cf = connection.MobyleConfig()
    cf.save()

