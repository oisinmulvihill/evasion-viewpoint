"""
Project's setuptool configuration.

This should eggify and in theory upload to pypi without problems.

Oisin Mulvihill
2009-04-05

"""
from setuptools import setup, find_packages

Name='evasion-viewpoint'
ProjecUrl="" #""
Version='1.0.0'
Author='Oisin Mulvihill'
AuthorEmail='oisin dot mulvihill at gmail dot com'
Maintainer=' Oisin Mulvihill'
Summary='Internal module used in building of installers.'
License='Evasion Project CDDL License'
ShortDescription=Summary
Description=Summary

TestSuite = ''

needed = [
]

EagerResources = [
    'lib/viewpoint'
]

ProjectScripts = [
]

PackageData = {
    # If any package contains *.txt or *.rst files, include them:
    '': ['*.*'],
}

setup(
#    url=ProjecUrl,
    name=Name,
    zip_safe=False,
    version=Version,
    author=Author,
    author_email=AuthorEmail,
    description=ShortDescription,
    long_description=Description,
    license=License,
    test_suite=TestSuite,
    scripts=ProjectScripts,
    install_requires=needed,
    packages=find_packages('lib'),
    package_data=PackageData,
    package_dir = {'': 'lib'},
    eager_resources = EagerResources,
)
