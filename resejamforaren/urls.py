from django.conf.urls import patterns, include, url
from django.contrib import admin
from django.shortcuts import redirect

def redirect_to_rjweb(req):
    return redirect('index')


urlpatterns = patterns('',
    url(r'^$', redirect_to_rjweb),
    url(r'^rjweb/', include('rjweb.urls')),
	url(r'^rjproxy/', include('rjproxy.urls')),
    url(r'^i18n/', include('django.conf.urls.i18n')),
    url(r'^admin/', include(admin.site.urls)),
)
