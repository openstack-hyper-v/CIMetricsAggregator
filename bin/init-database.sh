/etc/init.d/mysql start
mysql -e "create database Metrics; GRANT ALL PRIVILEGES ON Metrics.* TO cimetrics@localhost IDENTIFIED BY 'cimetrics'"
mysql -e "SHOW DATABASES"
python /CIMetricsTool/statsproj/openstack_stats/manage.py syncdb
