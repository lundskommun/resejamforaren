NS = '{http://www.etis.fskab.se/v1.0/ETISws}'

def namespacify(ns, path):
    parts = path.split('/')
    prefixed_parts = map(lambda p: ns + p, parts)
    return '/'.join(prefixed_parts)

