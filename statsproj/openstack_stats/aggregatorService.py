#!/usr/bin/env python

# Aggregator service for pulling changes from gerrit upstream
# Written by: Gabriel Loewen

import urllib2,urllib,ijson,re,os,threading,thread
from datetime import datetime
from time import sleep

# Add headers to url request to masquerade as a JSON request
def addheaders(req):
   req.add_header('Content-Disposition', 'attachment')
   req.add_header('X-Content-Type-Options', 'nosniff')
   req.add_header('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate')
   req.add_header('Pragma', 'no-cache')
   req.add_header('Content-Type', 'application/json; charset=UTF-8')
   return req

# Retrieve a list of details about a particular change ID
def getGerritChangeRequest(cid):
   url = "https://review.openstack.org/changes/"+str(cid)+"/detail"
   req = addheaders(urllib2.Request(url))
   res = urllib2.urlopen(req)
   # ignore first line
   for line in res:
      break
   return res

# For a particular project, get a list of associated change ID's
def getChanges(project):
   url = "https://review.openstack.org/changes/?q=project:"+project
   req = addheaders(urllib2.Request(url))
   res = urllib2.urlopen(req)
   # ignore first line
   for line in res:
      break
   parser = ijson.parse(res)
   cids = []
   for prefix, event, value in parser:
      if prefix == 'item._number':
         cids.append(value)
   return cids

# Merge the change details for a worker/project into the DB
def mergeDetails(cids, worker, project):
   data = []
   missed = []
   count = 0
   for cid in cids:
      found = 0
      res = getGerritChangeRequest(cid)
      parser = ijson.parse(res)
      author = ''
      date = ''
      time = ''
      patch = ''
      missedpatch = ''
      count += 1
      print "(%s - %s): Completed %d / %d" % (worker,project,count,len(cids))
      for prefix, event, value in parser:
         if prefix == 'messages.item.author.name':
            author = value
         if prefix == 'messages.item.date':
            cutoff = len(value)-3
            date = datetime.strptime(value[:cutoff],"%Y-%m-%d %H:%M:%S.%f")
         if prefix == 'messages.item.message' and author == worker:
            dat = value.strip().split(':')
            if 'patch' in dat[0].lower():
               patch = dat[0].split()
               patch = re.sub("[^0-9]","",patch[len(patch)-1])
            if 'success' in value.lower() or 'succeed' in value.lower():
               success = True 
            try:
               item = [int(cid),int(patch),date.date(),date.time(),success]
               data += [item] 
            except:
               continue
            success = False
         elif prefix == 'messages.item.message' and author != worker:
            dat = value.strip().split(':')
            if 'patch' in dat[0].lower():
               missedpatch = dat[0].split()
               missedpatch = re.sub("[^0-9]","",missedpatch[len(missedpatch)-1])
            try:
               missed += [[int(cid),int(missedpatch),date.date(),date.time()]]
            except:
               continue
      if len(data) >= 10:
         mergeChunk(data,missed,worker,project)
         data = []
         missed = []

   mergeChunk(data,missed,worker,project)

# Merge a chunk of changes.  Helps with making the output seem to be more realtime
def mergeChunk(data, missed, worker, project):
   missed = [x for x in missed if not match(x,data)] 
   missed = unique(missed)
   for item in data:
      try:
         c, created = Change.objects.get_or_create(cid=item[0],pid=item[1],       \
                                                   worker=worker,project=project, \
                                                   date=item[2],time=item[3],     \
                                                   success=item[4],missed=False)
      except Exception, e:
         print str(e)
         continue
   for item in missed:
      try:
         c, created = Change.objects.get_or_create(cid=item[0],pid=item[1],       \
                                                   worker=worker,project=project, \
                                                   date=item[2],time=item[3],     \
                                                   success=False,missed=True)
      except Exception, e:
         print str(e)
         continue  

# Get a list of unique changes (i.e. matching CID and PID across a list)
def unique(data):
   res = []
   for x in data:
      for y in data:
         if x[0] == y[0] and x[1] == y[1]:
            found = False
            for z in res:
               if z[0] == x[0] and z[1] == x[1]:
                  found = True
            if not found:
               res.append(x)
   return res

# Predicate function to check if an item (CID/PID) exists in a list
def match(item, data):
   for x in data:
      if x[0] == item[0] and x[1] == item[1]:
         return True
   return False

# Perform a change merge request for a project/worker
def workerThread(project, worker):
   cids = getChanges(project)
   mergeDetails(cids, worker, project)

def foundIn(item, objects):
   for c in objects:
      if item.cid==c.cid and item.pid==c.pid:
         return True
   return False

# Look for any jobs marked as missed that were later submitted
# (i.e. fix up the false negatives)
def fixup(project,worker, change):
   missed = change.objects.filter(project=project,worker=worker,missed=True)
   unMissed = change.objects.filter(project=project,worker=worker,missed=False)
   erroneous = [x for x in missed if foundIn(x,unMissed)]
   for c in erroneous:
      c.delete()

if __name__ == "__main__":
   os.environ.setdefault("DJANGO_SETTINGS_MODULE", "openstack_stats.settings")
   from aggregator.models import Source, Change
   while True:
      sources = Source.objects.all()
      threads = []
      for source in sources:
         project = source.project
         worker = source.worker
         fixup(project, worker, Change)
         threads.append(threading.Thread(target=workerThread, args=(project, worker)))
      # start threads
      for thread in threads:
         thread.start()
      # join threads
      for thread in threads:
         thread.join()
      sleep(7200) # sleep 2 hours
