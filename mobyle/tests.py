# -*- coding: utf-8 -*-
import unittest

from pyramid import testing

import requests
import pymongo
import copy


base_url = "http://localhost:6543"

class LoginTest(unittest.TestCase):
    
    def setUp(self):
        conn = pymongo.Connection("mongodb://localhost/", safe=True)
        self.db = conn['mobyle2_tests']
        
        from views import add_user
        
        self.user = {'username':'test', 'password':'test'}
        add_user(self.db, copy.deepcopy(self.user))
        
        
        
    def tearDown(self):
        self.db.users.remove({'username': 'test'})
        
    
    def test_login(self):
        url_login = base_url + "/login"
        form = self.user        
        r = requests.post(url_login, data=form) #, username="test", password="test")
        
        self.assertTrue("auth_tkt" in r.cookies)
        
    


class ViewTests(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()
        
        conn = pymongo.Connection("mongodb://localhost/", safe=True)
        db = conn['mobyle2_tests']
        
        self.config.db = db

    def tearDown(self):
        testing.tearDown()

    def test_my_view(self):
        from .views import my_view
        request = testing.DummyRequest()
        request.db = self.config.db
        
        info = my_view(request)
        self.assertEqual(info['project'], 'mobyle')

