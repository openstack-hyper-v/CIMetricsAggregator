# Django model controller for Openstack CI Metrics tool
# Copyright 2014 Gabriel Loewen
# Microsoft Openstack CI Lab team

from django.db import models

# source model.  simple field for storing url's of JSON data objects
class Source(models.Model):
   project = models.CharField(max_length=100)
   worker = models.CharField(max_length=100)
   def __unicode__(self):
      return self.project + ":" + self.worker

class Change(models.Model):
   cid = models.PositiveIntegerField()
   pid = models.PositiveIntegerField()
   date = models.DateField()
   time = models.TimeField()
   project = models.CharField(max_length=100)
   worker = models.CharField(max_length=100)
   success = models.BooleanField()
   missed = models.BooleanField()
   def __unicode__(self):
      return '('+str(self.cid)+','+str(self.pid)+') ' + self.worker + " : " + self.project + " : " + ("Failure","Success")[self.success == True]
