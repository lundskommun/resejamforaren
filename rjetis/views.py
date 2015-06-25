import datetime
from django.shortcuts import render_to_response
import xml.etree.ElementTree as ET

from rjetis.common import namespacify, NS
from rjetis.etis import get_journey, get_journey_path


def _next_monday(today=None):
    eight_in_morning = datetime.time(hour=8, minute=0)
    if not today:
        today = datetime.datetime.today().date()
    if today.weekday() != 0:
        days_to_add = datetime.timedelta(days=(7 - today.weekday()))
    else:
        days_to_add = datetime.timedelta(days=0)
    print 'what to add'
    print days_to_add
    monday = datetime.datetime.combine(today + days_to_add, eight_in_morning)
    print today
    print monday
    assert monday.weekday() == 0
    assert monday.hour == 8
    assert monday.minute == 0
    assert monday.date() >= today
    return monday



def _calculate_duration(departure_time, arrival_time):
    dep = datetime.datetime.strptime(departure_time.text, '%Y-%m-%dT%H:%M:%S')
    arr = datetime.datetime.strptime(arrival_time.text, '%Y-%m-%dT%H:%M:%S')
    return (arr - dep).seconds / 60.0



def search(req):
    p_from = req.GET['fromY'], req.GET['fromX']
    p_to = req.GET['toY'], req.GET['toX']
    when = _next_monday()
    journey_xml = get_journey(p_from, p_to, when)
    journey = ET.fromstring(journey_xml)
    journey_result_key = journey.find(NS + 'JourneyResultKey')
    print journey_result_key.text
    journey_path_xml = get_journey_path(journey_result_key.text)

    context = {
        'duration': _calculate_duration(journey.find(namespacify(NS, 'Journeys/Journey[1]/DepDateTime')),
                                        journey.find(namespacify(NS, 'Journeys/Journey[1]/ArrDateTime'))),
        'distance': journey.find(namespacify(NS, 'Journeys/Journey[1]/Distance')).text,
        'price_per_trip': journey.find(namespacify(NS, 'Journeys/Journey[1]/Prices/PriceInfo[1]/Price')).text,
        'price_per_month': journey.find(namespacify(NS, 'Journeys/Journey[1]/Prices/PriceInfo[7]/Price')).text,
        'co2': journey.find(namespacify(NS, 'Journeys/Journey[1]/CO2value')).text,
        'journey_path_xml': journey_path_xml,
    }

    print context
    return render_to_response('rjetis/result.xml', context)

if __name__ == '__main__':
    class Request:
        def __init__(self):
            self.GET = {
                'fromX': '6178568',
                'fromY': '1337848',
                'toX': '6178008',
                'toY': '1335468',
            }
    r = Request()
    print search(r)
