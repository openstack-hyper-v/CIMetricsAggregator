CIMetricsAggregator
===================

Tool for aggregating and caching metrics regarding Openstack CI testing results built in Python using Django 1.6.5

Dependencies
============
MariaDB (or MySQL) server<br />
Django 1.6.5<br />
nginx<br />
mysql-python<br />
ijson<br />
uwsgi

Deployment Instructions
=======================
Step 1:<br />
Install the dependencies (listed above)<br /><br />
Step 2:<br />
Clone the github repo into /CIMetricsTool if on a *nix machine.  If deploying to Windows, clone into any directory, but be sure to change the project locations in <code>nginx.conf</code> and <code>uwsgi.ini</code>.<br /><br />
Step 3:<br />
You must enter the correct username/password into openstack-stats/settings.py for the MariaDB/MySQL database.<br /><br />
Step 4:<br />
Generate the SQL structure using the following command:</br>
<code>
    python manage.py syncdb
</code><br /><br />
Step 5:<br />
The service that actually queries Gerrit and saves the resultant data into the database is found in <code>aggregatorService.py</code>.  This service must be started manually, or set to autorun on boot.<br /><br />

Copyright 2014 Gabriel Loewen
