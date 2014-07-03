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

Tips and Tricks
===============
You must enter the correct username/passwork into openstack-stats/settings.py for the MariaDB/MySQL database.  Then, to generate the appropriate database structure, execute the following:<br />
<code>
    python manage.py syncdb
</code><br />
The service that actually queries Gerrit and saves the resultant data into the database is found in <code>aggregatorService.py</code>.  This service must be started manually, or set to autorun on boot.

Copyright 2014 Gabriel Loewen
