# -*- coding: utf-8 -*-
import unittest

from pyramid import testing

import requests
import pymongo



base_url = "http://localhost:6543"

class LoginTest(unittest.TestCase):
    def test_login(self):
        url_login = base_url + "/login"
        form = {'username':'test', 'password':'test'}
        
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

