from django.conf.urls import patterns, include, url
from views import proxy

urlpatterns = patterns('',
	url(r'^proxy$', proxy),
)
