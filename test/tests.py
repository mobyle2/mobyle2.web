# -*- coding: utf-8 -*-

import unittest

from pyramid import testing
import pymongo
import copy
import os
import unittest

import mobyle.common.config
cfg = mobyle.common.config.Config(file = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'development.ini')))                                 

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
            self.clear_stats()
            testing.tearDown()


    def test_main_page(self):
        from mobyle.web.views import main_page
        request = testing.DummyRequest()
        info = main_page(request)
        self.assertEqual(info['project'], 'mobyle')


    def test_public_programs(self):
        """tests that 'public' programs are found in the list"""
        from mobyle.web.views import services_list
        prog_list = services_list(self.request)
        for p in self.public_programs_list:
            self.assertTrue(p in prog_list)
        self.assertNotIn('baz', services_list(self.request))
        program = connection.Program()
        program['name'] = 'baz'
        program.save()
        self.assertIn('baz', services_list(self.request))


    def test_private_programs(self):
        pass


    def test_user_list(self):
        from mobyle.web import views
        users = views.user_list(self.request).values()
        user = users[0]
        self.assertIn('email', user)
        self.assertIn('group:admin', user['groups'])
        self.assertEqual(user['type'], "registered")


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
