# -*- encoding: utf-8 -*-
#
# etis.py
#

import xml.etree.ElementTree as ET
import datetime
import urllib
import urllib2
from HTMLParser import HTMLParser

from rjetis.common import namespacify, NS

URL_GET_JOURNEY = 'http://www.etis.skanetrafiken.se/Journey/Service.asmx/GetJourney'
URL_GET_JOURNEY_PATH = 'http://www.etis.skanetrafiken.se/Journey/Service.asmx/GetJourneyPath'


def get_journey(p_from, p_to, when):
    query = {
        'FromPointId': '%s#%s' % p_from,
        'FromPointType': 3,
        'ToPointId': '%s#%s' % p_to,
        'ToPointType': 3,
        'JourneyDateTime': when.strftime('%Y-%m-%d %H:%M'),
        'ViaPointId': '',
        'WaitingTime': '',
        'Direction': '',
        'NoOfJourneysBefore': '',
        'NoOfJourneysAfter': '',
        'ChangeTime': '',
        'Priority': '',
        'SelectedMeansOfTransport': '',
        'SelectionType': '',
        'Accessibility': '',
        'MaxWalkDistance': '',
        'DetailedResult': '',
        'WalkSpeed': '',
        'VehicleAccessibility': '',
    }

    url = URL_GET_JOURNEY + '?' + urllib.urlencode(query)
    print url
    rsp = urllib2.urlopen(url)
    content = rsp.read()
    return content


def get_journey_path(key):
    query = {
        'JourneyResultKey': key,
        'seq': '0'
    }

    url = URL_GET_JOURNEY_PATH + '?' + urllib.urlencode(query)
    print url
    rsp = urllib2.urlopen(url)
    content = rsp.read()
    journey_path = ET.fromstring(content)
    result_xml = journey_path.find(namespacify(NS, 'ResultXML')).text
    h = HTMLParser()
    return h.unescape(result_xml)


def sample_query():
    p_from = (6178568, 1337848)
    p_to = (6178008, 1335468)
    when = datetime.datetime.now()
    result = get_journey(p_from, p_to, when)
    print result

    key = '1387012469348168205'
    result = get_journey_path(key)
    print result

if __name__ == '__main__':
    sample_query()
