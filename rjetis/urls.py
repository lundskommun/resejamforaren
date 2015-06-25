from django.conf.urls import patterns, url
from views import search

urlpatterns = patterns('',
	url(r'^search', search),
)
