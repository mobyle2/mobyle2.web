'''
Initialise database content
'''


import argparse
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

import mobyle.common.connection
mobyle.common.connection.init_mongo(config.get("app:main","db_uri"))

import mobyle.common
from mobyle.common.users import User

# Create root user
if mobyle.common.session.User.find({ 'first_name' : 'root' }).count() == 0:
    pwd = sha1("%s"%randint(1,1e99)).hexdigest()
    Config.logger().warn('root user created with password: '+ pwd )
    user = mobyle.common.session.User()
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

