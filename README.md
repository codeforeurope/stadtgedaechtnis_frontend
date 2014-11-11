stadtgedaechtnis_frontend
=========================
This is a Django app that is a frontend extension to the stadtgedaechtnis_backend app.
It does NOT work without the stadtgedaechtnis_backend app installed.

This app provides a frontend for both mobile and desktop.

Installation
------------
This is a non-standalone Django-App. To use it, you must have a standard Django installation.
To use this app with a Django installation, clone this repository into your Django-folder and
add 'stadtgedaechtnis_frontend' to INSTALLED_APPS. Then hook up the urlpatterns found in this
repository into your urls.py.

Requirements
------------
There are no additional python module requirements for this app.

When running on windows and translation features are required, you need to install gettext on Windows.

For a standard Django-App with both backend and frontend installed and all the necessary settings,
see the following repository:
```
https://github.com/jessepeng/coburg-city-memory
```
