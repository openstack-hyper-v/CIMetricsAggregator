#!/bin/sh
/etc/init.d/mysql start
/etc/init.d/php5-fpm start
nginx
uwsgi --ini /CIMetricsTool/conf.d/uwsgi.ini &
python /CIMetricsTool/statsproj/openstack_stats/aggregatorService.py &
sleep 20
