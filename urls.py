"""
Created on 26.02.2014

@author: jpi
"""

from django.conf.urls import patterns, url, include
from django.conf import settings
from stadtgedaechtnis_frontend.views import *
from stadtgedaechtnis_frontend.forms import NewStoryAudioForm, NewStoryImageForm, NewStoryVideoForm

urlpatterns = patterns(
   '',
   url(r'^$', ExtraContextTemplateView.as_view(
       template_name='stadtgedaechtnis/index.html',
       extra_context={
           "GOOGLE_API_KEY": settings.GOOGLE_API_KEY
       })),
   url(r'^i18n/', include('django.conf.urls.i18n')),
   url(r'^entry/(?P<pk>\d+)/$', EntryView.as_view(), name="entry-view"),
   url(r'^forms/image/$', NewStoryMediaFormView.as_view(
           form_class=NewStoryImageForm), name="new-story-image"),
   url(r'^forms/audio/$', NewStoryMediaFormView.as_view(
           form_class=NewStoryAudioForm), name="new-story-audio"),
   url(r'^forms/video/$', NewStoryMediaFormView.as_view(
           form_class=NewStoryVideoForm), name="new-story-video"),
   )