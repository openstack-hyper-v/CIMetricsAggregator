FROM ubuntu:14.04

ENV DEBIAN_FRONTEND=noninteractive
ENV MYSQL_ROOT_PASSWORD=cimetrics
ENV MYSQL_DATABASE=Metrics
ENV MYSQL_USER=cimetrics
ENV MYSQL_PASSWORD=cimetrics

RUN apt-get update
RUN apt-get -y install mysql-server
RUN apt-get -y install python-software-properties 
RUN apt-get -y install php5-cli
RUN apt-get -y install php5-fpm
RUN apt-get -y install nginx
RUN apt-get -y install python-pip python-dev build-essential

RUN pip install django==1.6.5
RUN pip install ijson
RUN pip install uwsgi

RUN apt-get -y install libmysqlclient-dev
RUN pip install mysql-python
RUN pip install pymysql

RUN apt-get -y install git
RUN git clone https://github.com/seansp/CIMetricsAggregator.git /CIMetricsTool

EXPOSE 80
EXPOSE 8000
EXPOSE 8001
EXPOSE 3006

WORKDIR /CIMetricsTool/statsproj/openstack_stats

# Initialize the database.
RUN /etc/init.d/mysql start; mysql -e "create database Metrics; GRANT ALL PRIVILEGES ON Metrics.* TO cimetrics@localhost IDENTIFIED BY 'cimetrics'; FLUSH PRIVILEGES;"; python manage.py syncdb --noinput
# Setup the django superuser
RUN /etc/init.d/mysql start; echo "from django.contrib.auth.models import User; User.objects.create_superuser('root', 'admin@example.com', 'cimetrics')" | python manage.py shell

RUN apt-get -y install supervisor
RUN apt-get -y install upstart

RUN cp /CIMetricsTool/conf.d/nginx.conf /etc/nginx/sites-enabled/default
