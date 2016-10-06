# Django model controller for Openstack CI Metrics tool
# Copyright 2014 Gabriel Loewen
# Microsoft Openstack CI Lab team

from django.db import models
import ast

class ListField(models.TextField):
    __metaclass__ = models.SubfieldBase
    description = "Stores a python list"

    def __init__(self, *args, **kwargs):
        super(ListField, self).__init__(*args, **kwargs)

    def to_python(self, value):
        if not value:
            value = []

        if isinstance(value, list):
            return value

        return ast.literal_eval(value)

    def get_prep_value(self, value):
        if value is None:
            return value

        return unicode(value)

    def value_to_string(self, obj):
        value = self._get_val_from_obj(obj)
        return self.get_db_prep_value(value)

# source model.  simple field for storing url's of JSON data objects
class Source(models.Model):
   project = models.CharField(max_length=100)
   worker = models.CharField(max_length=100)
   def __unicode__(self):
      return self.project + ":" + self.worker

class CombinedReport(models.Model):
   name = models.CharField(max_length=100)
   workers = ListField() 

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
