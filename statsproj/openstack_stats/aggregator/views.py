from django.db.models import Count
from django.shortcuts import render_to_response
from django.db import connection
from django.template import RequestContext, loader
from django.http import HttpResponse
from aggregator.models import Change
from datetime import timedelta, datetime
import time

def index(request):
   data = Change.objects
   template = loader.get_template('aggregator/index.html')
   context = RequestContext(request, {
      'workers': data.values('worker').distinct(),
   })
   return HttpResponse(template.render(context))

def detail(request, name):
   #cursor = connection.cursor()
   data = Change.objects.filter(worker=name)
   others = Change.objects.exclude(worker=name)
   startDate = (data.order_by('date').latest('date').date - timedelta(days=30)).strftime('%Y-%m-%d')
   endDate = data.order_by('date').latest('date').date.strftime('%Y-%m-%d')
   if request.method == "POST":
      startDate = request.POST.get("start","")
      endDate = request.POST.get("end","")
   s = datetime.strptime(startDate,'%Y-%m-%d')
   e = datetime.strptime(endDate,'%Y-%m-%d') + timedelta(days=1)
   data = data.filter(date__range=[s, e])

   novaData = data.filter(project="openstack/nova")
   novaSuccess = novaData.filter(success=True).order_by('date')
   novaFail = novaData.filter(success=False,missed=False).order_by('date')
   novaMiss = novaData.filter(missed=True).order_by('date')

   neutronData = data.filter(project="openstack/neutron")
   neutronSuccess = neutronData.filter(success=True).order_by('date')
   neutronFail = neutronData.filter(success=False,missed=False).order_by('date')
   neutronMiss = neutronData.filter(missed=True).order_by('date')

   totalSuccess = data.filter(success=True)
   totalFail = data.filter(success=False,missed=False)
   totalMissed = data.filter(missed=True)

   for d in novaSuccess:
      d.date = int((d.date + timedelta(days=1)).strftime('%s'))*1000
   for d in novaFail:
      d.date = int((d.date + timedelta(days=1)).strftime('%s'))*1000
   for d in novaMiss:
      d.date = int((d.date + timedelta(days=1)).strftime('%s'))*1000

   for d in neutronSuccess:
      d.date = int((d.date + timedelta(days=1)).strftime('%s'))*1000
   for d in neutronFail:
      d.date = int((d.date + timedelta(days=1)).strftime('%s'))*1000
   for d in neutronMiss:
      d.date = int((d.date + timedelta(days=1)).strftime('%s'))*1000

   context = {
      'data': data,
      'totalsuccess': totalSuccess,
      'totalfail': totalFail,
      'totalmissed': totalMissed,
      'novasuccesses': novaSuccess, 
      'novafailures': novaFail,
      'novamiss': novaMiss,
      'neutronsuccesses': neutronSuccess, 
      'neutronfailures': neutronFail,
      'neutronmiss': neutronMiss,
      'start': startDate,
      'end': endDate,
      'projects': data.values('project').distinct(),
   }

   return render_to_response("aggregator/detail.html", context, context_instance = RequestContext(request))
