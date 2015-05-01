from django.http import HttpResponse, HttpResponseBadRequest
import urllib2
import cgi
import sys, os

# Designed to prevent Open Proxy type stuff.

allowedHosts = [
	"www.openlayers.org",
	"beta.geocoding.cloudmade.com",
	"www.labs.skanetrafiken.se",
	"api.trafiklab.se",
	"kartor.lund.se",
	"routes.cloudmade.com",
	"beta.geocoding.cloudmade.com",
	"91.123.201.52",
	"91.123.201.52:8080"
	]

def proxy(req):
	method = req.method

	if method == 'POST':
		url = req.POST['url']
	else:
		url = req.GET['url']
		
	host = url.split("/")[2]
	if allowedHosts and not host in allowedHosts:
		return HttpResponseBadRequest('Not allowed')
	elif url.startswith("http://") or url.startswith("https://"):
		if method == 'POST':
			length = len(req.body)
			headers = {"Content-Type": req.META["CONTENT_TYPE"]}
			r = urllib2.Request(url, req.body, headers)
			y = urllib2.urlopen(r)
		else:
			y = urllib2.urlopen(url)
		
		# print content type header
		i = y.info()
		if i.has_key("Content-Type"):
			response = HttpResponse(y.read(), content_type=i['Content-Type'])
		else:
			response = HttpResponse(y.read(), content_type="text/plain")
		y.close()
		return response
	else:
		return HttpResponseBadRequest('Internal Error')
