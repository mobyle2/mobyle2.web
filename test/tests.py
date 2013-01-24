# -*- coding: utf-8 -*-
import unittest

from pyramid import testing

import pymongo
import copy
import os

import mobyle.common
from mobyle.common import session


base_url = "http://localhost:6543"

import mobyle.common.connection
mobyle.common.connection.init_mongo("mongodb://localhost/")

class LoginTest(unittest.TestCase):

	def setUp(self):
	    from webtest import TestApp
	    self.testapp = TestApp("config:development.ini", relative_to="./")

	    from mobyle.web.views import add_user

	    self.user = {
			'username':'test@example.org',
			'password':'test',
			'groups': ['group:admin'],
			'email': 'test@example.org',
	    }
            self.mongouser = mobyle.common.session.User()
	    self.mongouser['email']  = 'test@example.org'
	    self.mongouser['groups'] = ['group:admin']
	    self.mongouser['hashed_password'] = 'test'
            add_user(self.mongouser)



	def tearDown(self):
	    user = mobyle.common.session.User.find_one({'email' : 'test@example.org'})
            user.delete()


	def test_login(self):

	    url_login = base_url + "/login"
	    form = self.user
            r = self.testapp.post(url_login, form)

            self.assertFalse('not logged in' in r.text)


	def test_incorrect_login(self):
	    url_login = base_url + "/login"
	    form = self.user
	    form['password'] = 'incorrect_password'
	    r = self.testapp.post(url_login, form)

	    self.assertTrue('not logged in' in r.text)


class ViewTests(unittest.TestCase):
    def setUp(self):
	self.config = testing.setUp()
	self.public_programs_list = ['foo', 'bar']

	for p in self.public_programs_list:
            program = mobyle.common.session.Program()
	    program['name'] = p
	    program['public'] = True
            program.save()

        self.request = testing.DummyRequest()

        from mobyle.web.views import add_user

        mongouser = mobyle.common.session.User()
        mongouser['email']  = 'test@example.org'
        mongouser['groups'] = ['group:admin']
        mongouser['hashed_password'] = 'test'
        mongouser['type'] = 'registered'
        add_user(mongouser)


    def tearDown(self):
	    programs = mobyle.common.session.Program.find({})
	    for program in programs:
	        program.delete()
            users = mobyle.common.session.User.find({})
            for user in users:
                user.delete()
            testing.tearDown()

    def test_my_view(self):
	    from mobyle.web.views import my_view
	    request = testing.DummyRequest()

            info = my_view(request)
            self.assertEqual(info['project'], 'mobyle')


    def test_public_programs(self):
        """tests that 'public' programs are found in the list"""
        from mobyle.web.views import program_list



        prog_list = program_list(self.request)
        for p in self.public_programs_list:
            self.assertTrue(p in prog_list)

        self.assertTrue('baz' not in program_list(self.request))
        program = mobyle.common.session.Program()
        program['name'] = 'baz'
        program['public'] = True
        program.save()
        self.assertTrue('baz' in program_list(self.request))

    def test_private_programs(self):
        pass

    def test_user_list(self):
        from mobyle.web import views

        users = views.user_list(self.request).values()
        user = users[0]
        self.assertTrue('email' in user)
        self.assertTrue('group:admin' in user['groups'])
        self.assertTrue(user['type'] == "registered")



