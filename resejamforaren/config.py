# config.py

try:
    from localconf import *
except:
    MAPQUEST_KEY = 'NOT_CONFIGURED'
    RESROBOT_KEY = 'NOT_CONFIGURED'
    STREETSMART_URL = 'NOT_CONFIGURED'
    GOOGLE_ANALYTICS_KEY = 'NOT_CONFIGURED'
    PRICE_PETROL = 0
    PRICE_DRIVING = 0
    PRICE_UPDATED = 'NOT_CONFIGURED'
    MAP_CENTER_POINT = [0, 0]
