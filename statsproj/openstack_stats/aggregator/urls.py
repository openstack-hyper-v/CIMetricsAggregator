from django.conf.urls import patterns, url

from aggregator import views

urlpatterns = patterns('',
   url(r'^$', views.index, name='index'),
   url(r'^(?P<name>[a-zA-Z0-9!$* \t\r\n\-\.]+)/$', views.detail, name='detail'),
)

