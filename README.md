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
</code>

Copyright 2014 Gabriel Loewen
