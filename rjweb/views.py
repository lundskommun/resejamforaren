from django.shortcuts import render_to_response, redirect
from resejamforaren.settings import STATIC_URL
from resejamforaren.config import MAPQUEST_KEY, RESROBOT_KEY, STREETSMART_URL, PRICE_PETROL, PRICE_DRIVING, PRICE_UPDATED, GOOGLE_ANALYTICS_KEY, \
    MAP_CENTER_POINT
from django.utils import translation


def index(req):
    context = {
        'django_static_url': STATIC_URL,
        'price_petrol': PRICE_PETROL,
        'price_driving': PRICE_DRIVING,
        'price_updated': PRICE_UPDATED,
    }
    if req.session.has_key(translation.LANGUAGE_SESSION_KEY) and req.session[translation.LANGUAGE_SESSION_KEY].startswith('en'):
        context['other_lang_code'] = 'sv'
        context['other_lang_name'] = 'Swedish'
    else:
        context['other_lang_code'] = 'en'
        context['other_lang_name'] = 'English'
    return render_to_response('rjweb/index.html', context)


def config(req):
    context = {
        'MapQuestKey': MAPQUEST_KEY,
        'ResRobotKey': RESROBOT_KEY,
        'GoogleAnalyticsKey': GOOGLE_ANALYTICS_KEY,
        'StreetSmartUrl': STREETSMART_URL,
        'PriceDriving': PRICE_DRIVING,
        'MapCenterPoint': MAP_CENTER_POINT,
    }
    return render_to_response('rjweb/config.js', context)


def info(req, page):
    context = {
        'django_static_url': STATIC_URL,
        'price_petrol': PRICE_PETROL,
        'price_driving': PRICE_DRIVING,
        'price_updated': PRICE_UPDATED,
    }
    return render_to_response('rjweb/info_%s.html' % (page, ), context)


def set_language(req):
    lang = req.GET['lang']
    translation.activate(lang)
    req.session[translation.LANGUAGE_SESSION_KEY] = lang
    return redirect('index')


def ping(req):
    return render_to_response('rjweb/ping.txt')