from django.contrib import admin
from aggregator.models import Source, Change, CombinedReport

admin.site.register(CombinedReport)
admin.site.register(Source)
admin.site.register(Change)
