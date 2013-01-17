# -*- coding: utf-8 -*-
import unittest

from pyramid import testing

import pymongo
import copy
import os


from mobyle.common import session


base_url = "http://localhost:6543"

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
            self.mongouser = session.User()
	    self.mongouser['email']  = 'test@example.org'
	    self.mongouser['groups'] = ['group:admin']
	    self.mongouser['hashed_password'] = 'test'
            add_user(self.mongouser)



	def tearDown(self):
	    user = session.User.find_one({'email' : 'test@example.org'})
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
                program = session.Program()
	        program['name'] = p
	        program['public'] = True
                program.save()

            self.request = testing.DummyRequest()

    def tearDown(self):
	    programs = session.Program.find({})
	    for program in programs:
	        program.delete()
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
        program = session.Program()
        program['name'] = 'baz'
        program['public'] = True
        program.save()
        self.assertTrue('baz' in program_list(self.request))

    def test_private_programs(self):
        pass

    def test_user_list(self):
        from mobyle.web import views
        user = views.user_list(self.request).values()[0]
        self.assertTrue('email' in user)
        self.assertTrue('group:admin' in user['groups'])
        self.assertTrue(user['type'] == "registered")


