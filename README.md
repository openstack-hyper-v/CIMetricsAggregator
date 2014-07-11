CIMetricsAggregator
===================

Tool for aggregating and caching metrics regarding Openstack CI testing results built in Python using Django 1.6.5

Dependencies (*nix)
============
MariaDB (or MySQL) server<br />
Django 1.6.5<br />
nginx<br />
mysql-python<br />
ijson<br />
Python 2.7<br />
uwsgi

Dependencies (Windows)
============
WAMP Server<br />
Django 1.6.5<br />
mysql-python (Get binary here: http://www.lfd.uci.edu/~gohlke/pythonlibs/#mysql-python)<br />
ijson<br />
Python 2.7<br />
pyWin32

Deployment Instructions (*nix)
=======================
Step 1:<br />
Install the dependencies (listed above) and create a database named 'Metrics'<br /><br />
Step 2:<br />
Clone the github repo into /CIMetricsTool <br /><br />
Step 3:<br />
You must enter the correct username/password into openstack-stats/settings.py for the MariaDB/MySQL database.<br /><br />
Step 4:<br />
Generate the SQL structure using the following command:</br>
<code>
    python manage.py syncdb
</code><br /><br />
Step 5:<br />
Start both nginx, and uwsgi services using the configurations found in the repo.<br /><br />
Step 6:<br />
Navigate to <your_server>/admin and at least add upstream Jenkins to the source model:<br />
```
    project: openstack/nova
    worker: Jenkins
```<br />
And,<br />
```
    project: openstack/neutron
    worker: Jenkins
```<br />
Step 7:<br />
The service that actually queries Gerrit and saves the resultant data into the database is found in <code>aggregatorService.py</code>.  This service must be started manually, or set to autorun on boot.<br /><br />

Deployment Instructions (Windows)
Step 1:<br />
Install the dependencies (listed above) and create a database named 'Metrics'<br /><br />
Step 2:<br />
Clone the github repo into C:/CIMetricsTool and change the static root location in settings.py to <code>C:\CIMetricsTool\statsproj\openstack_stats\static</code><br /><br />
Step 3:<br />
You must enter the correct username/password into openstack-stats/settings.py for the MySQL database.<br /><br />
Step 4:<br />
Generate the SQL structure using the following command:</br>
<code>
    python manage.py syncdb
</code><br /><br />
Step 5:
Add the following to your httpd.conf file:<br />
```
    WSGIScriptAlias / C:/CIMetricsTool/statsproj/openstack_stats/openstack_stats/wsgi.py
    WSGIPythonPath C:/CIMetricsTool/statsproj/openstack_stats
    <Directory C:/CIMetricsTool/statsproj/openstack_stats/openstack_stats>
    <Files wsgi.py>
    Require all granted
    </Files>
    </Directory>
    Alias /static/ C:/CIMetricsTool/statsproj/openstack_stats/static/
    <Directory C:/CIMetricsTool/statsproj/openstack_stats/static>
    Require all granted
    </Directory>
```
Step 6:<br />
Navigate to <your_server>/admin and at least add upstream Jenkins to the source model:<br />
```
    project: openstack/nova
    worker: Jenkins
```<br />
And,<br />
```
    project: openstack/neutron
    worker: Jenkins
```<br /><br />
Step 7:<br />
Restart apache<br /><br />
Step 8:<br />
The service that actually queries Gerrit and saves the resultant data into the database is found in <code>aggregatorService.py</code>.  This service must be started manually, or set to autorun on boot.<br /><br />
