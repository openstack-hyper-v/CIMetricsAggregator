# Django view controller for Openstack CI metrics tool
# Copyright 2014 Gabriel Loewen
# Microsoft Openstack CI Lab team

from django.contrib.auth.decorators import login_required
from django.db.models import Count
from django.core.serializers import serialize
from django.shortcuts import render_to_response
from django.db import connection
from django.template import RequestContext, loader
from django.http import HttpResponse
from aggregator.models import Change
from datetime import timedelta, datetime
import time
import simplejson

# Simple index page renderer
@login_required
def index(request):
   data = Change.objects
   template = loader.get_template('aggregator/index.html')
   context = RequestContext(request, {
      'workers': data.values('worker').distinct(),
   })
   return HttpResponse(template.render(context))

# Calculate the details for the specified worker, then render the template with the corresponding data
@login_required
def detail(request, name):
   # Get the data for the specified worker
   mainDataSet = getWorkerSpecifiedData(request, name)
   mainData = mainDataSet[2]
   timeGranular = False
   if request.method == "POST":
      tg = request.POST.get("timeGranular","")
      if tg:
         timeGranular = True
   mainResults = getWorkerDetails(mainData, timeGranular, True)

   if (name != "Jenkins"):
      # Get the upstream data (Jenkins)
      upstreamDataSet = getWorkerSpecifiedData(request, "Jenkins")
      upstreamData = upstreamDataSet[2]
      upstreamResults = getWorkerDetails(upstreamData, timeGranular, False)
      context = {
	 'novaSuccess': list(mainResults[0]),
	 'novaFail': list(mainResults[1]),
	 'novaMiss': list(mainResults[2]),
	 'neutronSuccess': list(mainResults[3]), 
	 'neutronFail': list(mainResults[4]),
	 'neutronMiss': list(mainResults[5]),
	 'totalSuccess': mainResults[6],
	 'totalFail': mainResults[7],
	 'totalMiss': mainResults[8],
	 'upstreamNovaSuccess': list(upstreamResults[0]),
	 'upstreamNovaFail': list(upstreamResults[1]),
	 'upstreamNovaMiss': list(upstreamResults[2]),
	 'upstreamNeutronSuccess': list(upstreamResults[3]),
	 'upstreamNeutronFail': list(upstreamResults[4]),
	 'upstreamNeutronMiss': list(upstreamResults[5]),
         'name': name,
	 'start': mainDataSet[0],
	 'end': mainDataSet[1],
         'granular': timeGranular,
      }
   else:
      context = {
	 'novaSuccess': list(mainResults[0]),
	 'novaFail': list(mainResults[1]),
	 'novaMiss': list(mainResults[2]),
	 'neutronSuccess': list(mainResults[3]), 
	 'neutronFail': list(mainResults[4]),
	 'neutronMiss': list(mainResults[5]),
	 'totalSuccess': mainResults[6],
	 'totalFail': mainResults[7],
	 'totalMiss': mainResults[8],
	 'upstreamNovaSuccess': list(),
	 'upstreamNovaFail': list(),
	 'upstreamNovaMiss': list(),
	 'upstreamNeutronSuccess': list(),
	 'upstreamNeutronFail': list(),
	 'upstreamNeutronMiss': list(),
         'name': name,
	 'start': mainDataSet[0],
	 'end': mainDataSet[1],
         'granular': timeGranular,
      }

   return render_to_response("aggregator/detail.html", context, context_instance = RequestContext(request))

# Get a filtered queryset fot the worker.  Default date range is p[rior 30 days unless
# specified differently vis POST.
def getWorkerSpecifiedData(request, name):
   data = Change.objects.filter(worker=name)
   startDate = (data.order_by('date').latest('date').date - timedelta(days=30)).strftime('%Y-%m-%d')
   endDate = data.order_by('date').latest('date').date.strftime('%Y-%m-%d')
   if request.method == "POST":
      startDate = request.POST.get("start","")
      endDate = request.POST.get("end","")
   s = datetime.strptime(startDate,'%Y-%m-%d')
   e = datetime.strptime(endDate,'%Y-%m-%d')
   return [startDate, endDate, data.filter(date__range=[s, e])]

# Insert data into a dict of date/counts, or increase the count
def insertOrIncrement(container, val):
   if val in container:
      container[val] += 1
   else:
      container[val] = 1

# Get details for the worker, both Nova and Neutron data
def getWorkerDetails(data, timeGranular, getTotals):
   # Retrieve and process nova data
   novaData = data.filter(project="openstack/nova").order_by("time")
   _novaSuccess = {}
   _novaFail = {}
   _novaMiss = {}

   # get correct date format
   for d in novaData:
      d.date = int(d.date.strftime('%s'))*1000

   for d in novaData:
      if timeGranular:
         timeOffset = d.date + (d.time.hour * 3600 * 1000)
      else:
         timeOffset = d.date
      if d.success:
         insertOrIncrement(_novaSuccess, timeOffset)
      elif d.missed:
         insertOrIncrement(_novaMiss, timeOffset)
      else:
         insertOrIncrement(_novaFail, timeOffset) 

   novaSuccess = []
   novaFail = []
   novaMiss = []
   for key in _novaSuccess:
      novaSuccess += [[key,_novaSuccess[key]]]
   for key in _novaFail:
      novaFail += [[key,_novaFail[key]]]
   for key in _novaMiss:
      novaMiss += [[key,_novaMiss[key]]]

   novaSuccess = sorted(novaSuccess, key=lambda l:l[0])
   novaFail = sorted(novaFail, key=lambda l:l[0])
   novaMiss = sorted(novaMiss, key=lambda l:l[0])

   # Retrieve and process neutron data
   neutronData = data.filter(project="openstack/neutron").order_by("time")
   _neutronSuccess = {}
   _neutronFail = {}
   _neutronMiss = {}

   # get correct date format
   for d in neutronData:
      d.date = int(d.date.strftime('%s'))*1000

   for d in neutronData:
      if timeGranular:
         timeOffset = d.date + (d.time.hour * 3600 * 1000)
      else:
         timeOffset = d.date
      if d.success:
         insertOrIncrement(_neutronSuccess, timeOffset)
      elif d.missed:
         insertOrIncrement(_neutronMiss, timeOffset)
      else:
         insertOrIncrement(_neutronFail, timeOffset) 

   neutronSuccess = []
   neutronFail = []
   neutronMiss = []
   for key in _neutronSuccess:
      neutronSuccess += [[key,_neutronSuccess[key]]]
   for key in _neutronFail:
      neutronFail += [[key,_neutronFail[key]]]
   for key in _neutronMiss:
      neutronMiss += [[key,_neutronMiss[key]]]
 
   # Sort the neutron data based on date/timestamp 
   neutronSuccess = sorted(neutronSuccess, key=lambda l:l[0])
   neutronFail = sorted(neutronFail, key=lambda l:l[0])
   neutronMiss = sorted(neutronMiss, key=lambda l:l[0])

   # Get the total counts, if necessary
   if getTotals:
      totalSuccess = len(list(data.filter(success=True)))
      totalFail = len(list(data.filter(success=False,missed=False)))
      totalMissed = len(list(data.filter(missed=True)))
      return [novaSuccess, novaFail, novaMiss, neutronSuccess, neutronFail, neutronMiss, totalSuccess, totalFail, totalMissed]
   else:
      return [novaSuccess, novaFail, novaMiss, neutronSuccess, neutronFail, neutronMiss]
