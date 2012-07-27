# -*- coding: utf-8 -*-
import os

from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
README = open(os.path.join(here, 'README.txt')).read()
CHANGES = open(os.path.join(here, 'CHANGES.txt')).read()

requires = [
    'pyramid',
    'pyramid_debugtoolbar',
    'waitress',
    "pyramid_beaker",
    "pymongo",
    "pyramid_mailer",
    "velruse>=0.3dev",
    "py-bcrypt",
    
    ]

setup(name='mobyle',
      version='0.0',
      description='mobyle',
      dependency_links = ['https://github.com/bbangert/velruse/tarball/master#egg=velruse-0.3dev'],
      long_description=README + '\n\n' +  CHANGES,
      classifiers=[
        "Programming Language :: Python",
        "Framework :: Pylons",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
        ],
      author='',
      author_email='',
      url='',
      keywords='web pyramid pylons',
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      install_requires=requires,
      tests_require=requires,
      test_suite="mobyle",
      entry_points = """\
      [paste.app_factory]
      main = mobyle:main
      """,
      )

