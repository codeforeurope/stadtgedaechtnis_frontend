__author__ = 'jpi'

from django.views.generic.detail import DetailView
from django.views.generic import TemplateView
from stadtgedaechtnis_backend.models import Entry


class EntryView(DetailView):

    template_name = "stadtgedaechtnis/entry.html"
    model = Entry


class ExtraContextTemplateView(TemplateView):

    extra_context = {}

    def get_context_data(self, **kwargs):
        context = super(ExtraContextTemplateView, self).get_context_data(**kwargs)
        context.update(self.extra_context)
        return context