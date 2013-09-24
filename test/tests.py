# -*- coding: utf-8 -*-

import unittest

from pyramid import testing
import pymongo
import copy
import os
import unittest
from webob.multidict import MultiDict

import mobyle.common.config
cfg = mobyle.common.config.Config(file = os.path.normpath(os.path.join(os.path.dirname(__file__), 'test.ini')))                                 

from mobyle.common.connection import connection
from mobyle.common.stats.stat import Statistic, HourlyStatistic, DailyStatistic, MonthlyStatistic
import mobyle.common.service
import mobyle.common.users

base_url = "http://localhost:6543"


class LoginTest(unittest.TestCase):

    def setUp(self):
        from webtest import TestApp
        self.testapp = TestApp("config:development.ini", relative_to = os.path.normpath( os.path.join( os.path.dirname(__file__), '..')))
        from mobyle.web.views import add_user

        self.user = {
            'username':'test@example.org',
            'password':'test',
            'groups': ['group:admin'],
            'email': 'test@example.org',
        }
        self.mongouser = connection.User()
        self.mongouser['email']  = 'test@example.org'
        self.mongouser['groups'] = ['group:admin']
        self.mongouser['hashed_password'] = 'test'
        add_user(self.mongouser)



    def tearDown(self):
        user = connection.User.find_one({'email' : 'test@example.org'})
        user.delete()


    def test_login(self):
        url_login = base_url + "/login"
        form = self.user
        r = self.testapp.post(url_login, form)
        self.assertNotIn('not logged in', r.text)


    def test_incorrect_login(self):
        url_login = base_url + "/login"
        form = self.user
        form['password'] = 'incorrect_password'
        r = self.testapp.post(url_login, form)
        self.assertIn('not logged in', r.text)


class ViewTests(unittest.TestCase):

   
    def setUp(self):
        self.config = testing.setUp()
        self.config.include('pyramid_mailer.testing')
        # Define routes
        self.config.add_route('auth_confirm_email','/auth/confirm_email')
        self.config.add_static_view('static', 'mobyle.web:static')
        self.public_programs_list = ['foo', 'bar']
        for p in self.public_programs_list:
            program = connection.Program()
            program['name'] = p
            program.save()
        self.request = testing.DummyRequest()
        from mobyle.web.views import add_user
        mongouser = connection.User()
        mongouser['email']  = 'test@example.org'
        mongouser['groups'] = ['group:admin']
        mongouser['hashed_password'] = 'test'
        mongouser['type'] = 'registered'
        add_user(mongouser)


    def clear_stats(self):
            stats = connection.HourlyStatistic.find({})
            for stat in stats:
                stat.delete()
            stats = connection.DailyStatistic.find({})
            for stat in stats:
                stat.delete()
            stats = connection.MonthlyStatistic.find({})
            for stat in stats:
                stat.delete()

    def tearDown(self):
        programs = connection.Program.find({})
        for program in programs:
            program.delete()
        users = connection.User.find({})
        for user in users:
            user.delete()
        tokens = connection.Token.find({})
        for token in tokens:
            token.delete()

        self.clear_stats()
        testing.tearDown()


    def test_main_page(self):
        from mobyle.web.views import main_page
        self.config.add_static_view('static', 'mobyle.web:static', cache_max_age = 3600)
        request = testing.DummyRequest()
        info = main_page(request)
        self.assertEqual(info.code, 302)
        self.assertEqual(info.location, '/static/app/index.html')


    def test_private_programs(self):
        pass

    def test_user_registration(self):
        from mobyle.web.views import auth_login, auth_confirm_email
        from pyramid_mailer import get_mailer
        mdict = MultiDict()
        mdict.add('username','user@fake.org')
        mdict.add('password','fakepassword')
        request = testing.DummyRequest(mdict)
        request.registry = self.config.registry
        mailer = get_mailer(request)
        request.matchdict['auth'] = 'register'
        info = auth_login(request)
        usertoken = connection.Token.find_one({'user': 'user@fake.org'})
        self.assertTrue(usertoken is not None)
        try:
            userindb = connection.User.find_one({'email': 'user@fake.org'})
            self.assertTrue(userindb is None)
        except Exception:
            # No user in db, this is fine
            pass
        mdict = MultiDict()
        mdict.add('token' ,usertoken['token'])
        request = testing.DummyRequest(mdict)
        info = auth_confirm_email(request)
        try:
            userindb = connection.User.find_one({'email': 'user@fake.org'})
            self.assertTrue(userindb is not None)
        except Exception:
            self.fail("User not created")


    def test_stats(self):
        from mobyle.web import stat_views
        self.clear_stats()
        mystats = stat_views.stats(self.request).values()
        self.assertTrue((not mystats[0]) or (len(mystats[0]["results"]) == 0))
        newstat  = Statistic()
        newstat.add('test','95.30.242.238')
        mystats = stat_views.stats(self.request).values()
        self.assertEqual(len(mystats[0]["results"]), 1)


if __name__ == '__main__':
    unittest.main()
