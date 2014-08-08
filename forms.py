# -*- coding: utf-8 -*-
__author__ = 'Jan'

from django import forms
from django.utils.translation import ugettext_lazy as _


class PlaceHolderInput(forms.TextInput):
    """
    Field that provides the possibility to set a placeholder value for an input field
    """
    placeholder = ""

    def __init__(self, attrs=None, placeholder=""):
        self.placeholder = placeholder
        super(PlaceHolderInput, self).__init__(attrs)

    def render(self, name, value, attrs=None):
        final_attrs = self.build_attrs(attrs, placeholder=self.placeholder)
        return super(PlaceHolderInput, self).render(name, value, final_attrs)


class MediaFileInput(forms.widgets.FileInput):
    """
    Widget that prints a file input with an 'accept'-attribute.
    """
    # Subclasses should overwrite this
    accept_type = "*"

    def render(self, name, value, attrs=None):
        # set the accept attribute
        final_attrs = self.build_attrs(attrs, accept=self.accept_type)
        return super(MediaFileInput, self).render(name, value, final_attrs)


class AudioFileInput(MediaFileInput):
    """
    Widget that accepts audio files only.
    """
    accept_type = "audio/*"


class ImageFileInput(MediaFileInput):
    """
    Widget that accepts image files only.
    """
    accept_type = "image/*"


class VideoFileInput(MediaFileInput):
    """
    Widget that accepts video files only.
    """
    accept_type = "video/*"


class NewStoryTitleForm(forms.Form):
    """
    Form with a title to enter
    """
    title = forms.CharField(
        widget=PlaceHolderInput(placeholder=_("z.Bsp. Sambafest in Coburg")),
        label=_("Titel"))

    def get_media_type(self):
        return ""


class NewStoryImageForm(NewStoryTitleForm):
    """
    Form for initial uploading of media for a new entry.
    """
    # overwrite this with the respective input widget (AudioFileInput, ImageFileInput or VideoFileInput)
    input_widget = ImageFileInput

    # overwrite this with the correct lazy translation for the input widget
    file_label = _(u"Bild auswählen:")

    file = forms.FileField(widget=input_widget, label=file_label)

    def get_media_type(self):
        return _("ein Bild")


class NewStoryVideoForm(NewStoryImageForm):
    input_widget = VideoFileInput
    file_label = _(u"Video auswählen:")
    file = forms.FileField(widget=input_widget, label=file_label)

    def get_media_type(self):
        return _("ein Video")


class NewStoryAudioForm(NewStoryImageForm):
    input_widget = AudioFileInput
    file_label = _(u"Tonaufnahme auswählen:")
    file = forms.FileField(widget=input_widget, label=file_label)

    def get_media_type(self):
        return _("eine Tonaufnahme")