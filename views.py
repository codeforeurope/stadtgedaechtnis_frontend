__author__ = 'jpi'

from django.views.generic.detail import DetailView
from django.views.generic import TemplateView
from django.views.generic.edit import FormView

from stadtgedaechtnis_backend.models import Story, Asset
from stadtgedaechtnis_frontend.forms import NewStoryImageForm


class EntryView(DetailView):

    template_name = "stadtgedaechtnis/entry.html"
    model = Story


class ExactEntryView(DetailView):

    template_name = "stadtgedaechtnis/entry_exact.html"
    model = Story


class EntryPreviewView(DetailView):

    template_name = "stadtgedaechtnis/entry_preview.html"
    model = Story


class AssetView(DetailView):
    template_name = "stadtgedaechtnis/asset.html"
    model = Asset


class ExtraContextTemplateView(TemplateView):

    extra_context = dict()

    def get_context_data(self, **kwargs):
        context = super(ExtraContextTemplateView, self).get_context_data(**kwargs)
        context.update(self.extra_context)
        return context


class NewStoryMediaFormView(FormView):
    """
    View that creates the form to upload a new media entry.
    """
    template_name = "stadtgedaechtnis/new_entry_title.html"

    # pass this parameter to the as_view()-Method to supply, which form should be displayed
    form_class = NewStoryImageForm
    success_url = "/entry/"

    # passes the media type to the template
    def get_context_data(self, **kwargs):
        context = super(NewStoryMediaFormView, self).get_context_data(**kwargs)
        context.update({"media_type": self.get_form(self.get_form_class()).get_media_type()})
        return context