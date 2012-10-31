# -*- coding: utf-8 -*-
import unittest

from pyramid import testing

import requests
import pymongo
import copy

import views


base_url = "http://localhost:6543"

class LoginTest(unittest.TestCase):
    
    def setUp(self):
        conn = pymongo.Connection("mongodb://localhost/", safe=True)
        self.db = conn['mobyle2_tests']
        
        from views import add_user
        
        self.user = {
                      'username':'test',
                      'password':'test',
                      'groups': ['group:admin'],
                      'email': 'test@example.org',
                    }
        add_user(self.db, copy.deepcopy(self.user))
        
        
        
    def tearDown(self):
        self.db.users.remove({'username': 'test'})
        
    
    def test_login(self):
        url_login = base_url + "/login"
        form = self.user        
        r = requests.post(url_login, data=form) #, username="test", password="test")
        
        self.assertTrue("auth_tkt" in r.cookies)
        
    def test_incorrect_login(self):
        url_login = base_url + "/login"
        form = self.user
        form['password'] = 'incorrect_password'
        r = requests.post(url_login, data=form) #, username="test", password="test")
        
        self.assertTrue("auth_tkt" not in r.cookies)
        self.assertTrue('not logged in' in r.text)


class ViewTests(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()
        
        conn = pymongo.Connection("mongodb://localhost/", safe=True)
        db = conn['mobyle2_tests']
        
        self.config.db = db
        
        self.public_programs_list = ['foo', 'bar']
        
        for p in self.public_programs_list:
            prog = dict(name=p, public=True)
            db.programs.insert(prog)
        
        self.request = testing.DummyRequest()
        self.request.db = self.config.db

    def tearDown(self):
        self.config.db.programs.remove()
        testing.tearDown()

    def test_my_view(self):
        from .views import my_view
        request = testing.DummyRequest()
        request.db = self.config.db
        
        info = my_view(request)
        self.assertEqual(info['project'], 'mobyle')


    def test_public_programs(self):
        """tests that 'public' programs are found in the list"""
        from .views import program_list
       
        
        
        prog_list = program_list(self.request)
        for p in self.public_programs_list:
            self.assertTrue(p in prog_list)

        self.assertTrue('baz' not in program_list(self.request))  
        self.config.db.programs.insert(dict(name="baz", public=True))
        self.assertTrue('baz' in program_list(self.request))
        
    def test_private_programs(self):
        pass 
    
    def test_user_list(self):
        user = views.user_list(self.request).values()[0]
        self.assertTrue('email' in user)
        self.assertTrue('group:admin' in user['groups'])
        self.assertTrue(user['type'] == "registered")

    
