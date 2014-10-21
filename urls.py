"""
Created on 26.02.2014

@author: jpi
"""

from django.conf.urls import patterns, url, include
from django.conf import settings
from stadtgedaechtnis_frontend.views import *
from stadtgedaechtnis_frontend.forms import NewStoryAudioForm, NewStoryImageForm, NewStoryVideoForm, NewStoryTitleForm

js_info_dict = {
    'packages': ('stadtgedaechtnis_frontend',),
}

urlpatterns = patterns(
   '',
   url(r'^$', ExtraContextTemplateView.as_view(
       template_name='stadtgedaechtnis/index.html',
       extra_context={
           "GOOGLE_API_KEY": settings.GOOGLE_API_KEY
       }), name="home"),
   url(r'^i18n/', include('django.conf.urls.i18n')),
   url(r'^entry/(?P<pk>\d+)/$', EntryView.as_view(), name="entry-view"),
   url(r'^entry-exact/(?P<pk>\d+)/$', ExactEntryView.as_view(), name="entry-view-exact"),
   url(r'^entry-preview/(?P<pk>\d+)/$', EntryPreviewView.as_view(), name="entry-view-preview"),
   url(r'^imprint.html$', TemplateView.as_view(
       template_name='stadtgedaechtnis/imprint.html'
   ), name="imprint"),
   url(r'^privacy.html$', TemplateView.as_view(
       template_name='stadtgedaechtnis/privacy.html'
   ), name="privacy"),
   url(r'^jsurls.js$', 'django_js_utils.views.jsurls', {}, 'jsurls'),
   url(r'^jsi18n/$', 'django.views.i18n.javascript_catalog', js_info_dict),
   url(r'^forms/location/$', TemplateView.as_view(
       template_name='stadtgedaechtnis/new_entry_location.html'
   ), name="new-story-location"),
   url(r'^forms/image/$', NewStoryMediaFormView.as_view(
           form_class=NewStoryImageForm), name="new-story-img"),
   url(r'^forms/audio/$', NewStoryMediaFormView.as_view(
           form_class=NewStoryAudioForm), name="new-story-aud"),
   url(r'^forms/video/$', NewStoryMediaFormView.as_view(
           form_class=NewStoryVideoForm), name="new-story-vid"),
   url(r'^forms/text/$', NewStoryMediaFormView.as_view(
           form_class=NewStoryTitleForm), name="new-story-txt"),
   url(r'^forms/entry/$', TemplateView.as_view(
       template_name="stadtgedaechtnis/new_entry_story.html"), name="new-story-text"),
   url(r'^asset/(?P<pk>\d+)/$', AssetView.as_view(), name="asset-view"),
   url(r'^forms/intro/$', TemplateView.as_view(
       template_name='stadtgedaechtnis/new_entry_intro.html'), name="new-story-intro"),
   url(r'^forms/additional/$', TemplateView.as_view(
       template_name='stadtgedaechtnis/new_entry_additional.html'), name='new-story-additional'),
   url(r'^forms/preview/$', TemplateView.as_view(
       template_name='stadtgedaechtnis/new_entry_preview.html'), name='new-story-preview'),
   )