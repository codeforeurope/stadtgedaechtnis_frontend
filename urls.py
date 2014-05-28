"""
Created on 26.02.2014

@author: jpi
"""

from django.conf.urls import patterns, url, include
from django.conf import settings
from stadtgedaechtnis_frontend.views import EntryView, ExtraContextTemplateView

urlpatterns = patterns('',
                       url(r'^$', ExtraContextTemplateView.as_view(template_name='stadtgedaechtnis/index.html',
                                                                   extra_context={
                                                                       "GOOGLE_API_KEY": settings.GOOGLE_API_KEY
                                                                   })),
                       url(r'^i18n/', include('django.conf.urls.i18n')),
                       url(r'^entry/(?P<pk>\d+)/$', EntryView.as_view()),
                       )