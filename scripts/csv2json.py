#!/usr/bin/env python3
import re
import sys
import csv
import json

iata_re = re.compile('^[A-Z0-9]{3}$')
exclude_re = re.compile('[\[(]Duplicate[\])]|Erase Me')
reader = csv.DictReader(sys.stdin)
outfile = sys.stdout

IS_DEBUG = (len(sys.argv) > 1 and sys.argv[1] == '--debug')
def logger(prefix):
    def log(msg):
        if IS_DEBUG:
            print('  [%s] %s' % (prefix, msg))
    return log

data = {}
dup_count = 0
dup_disambiguation = {
    # Different airports, both listed as active.
    # Pick the one that appears in the IATA code search:
    # http://www.iata.org/publications/Pages/code-search.aspx
    'BFJ': '318169',
    'HOP': '3586',
    'MXR': '45178',
    'REQ': '41632',
    'SFK': '397',
}
dup_resolved = []


def compare_fields_empty(a, b, field, empty_values=None):
    compare_empty = ['']
    if empty_values != None:
        compare_empty += empty_values
    if a[field] in compare_empty and b[field] not in compare_empty:
        return b
    if b[field] in compare_empty and a[field] not in compare_empty:
        return a
    return None

def compare_fields_value(a, b, field, value):
    if a[field] == value and b[field] != value:
        return a
    if b[field] == value and a[field] != value:
        return b
    return None


'''
Given two lines from the CSV file with identical IATA codes, pick one as the "correct" option.

Returns the best match (`a` or `b`)
'''
def resolve_duplicate(a, b):
    log = logger('resolve_duplicate')
    # Check the known disambiguation list
    if a['iata_code'] in dup_disambiguation:
        res = compare_fields_value(a, b, 'id', dup_disambiguation[a['iata_code']])
        if res != None:
            log('disambiguation list')
            return res
    # Don't pick closed airports
    res = compare_fields_empty(a, b, 'type', ['closed'])
    if res != None:
        log('closed')
        return res
    # Pick airports over heliports
    res = compare_fields_empty(a, b, 'type', ['heliport', 'seaplane_base'])
    if res != None:
        log('heliport/seaplane_base')
        return res
    # When the name is the same, pick the one with more details
    if a['name'] == b['name']:
        # Check if one has a municipality but the other doesn't
        res = compare_fields_empty(a, b, 'municipality')
        if res != None:
            log('municipality')
            return res
        if a['municipality'] == b['municipality']:
            # When the municipality is also the same, pick one with an ident matching the IATA code
            res = compare_fields_value(a, b, 'ident', a['iata_code'])
            if res != None:
                log('identical ident code')
                return res
            # If name and municipality are the same, and neither has a matching ident code,
            # just give up and pick the first one, as the required info is the same anyway.
            log('same name/municipality, pick the first')
            return a
    # Pick the one that has scheduled services if the other one doesn't
    res = compare_fields_value(a, b, 'scheduled_service', 'yes')
    if res != None:
        log('scheduled services')
        return res
    # Pick the one with more GPS code info
    res = compare_fields_empty(a, b, 'gps_code')
    if res != None:
        log('GPS code')
        return res
    # Pick the one with more local code info
    res = compare_fields_empty(a, b, 'local_code')
    if res != None:
        log('local code')
        return res

    # Nothing left to choose between the two. Give up and pick the lowest id.
    ida = int(a['id'])
    idb = int(b['id'])
    log('give up, use lowest id')
    return a if ida < idb else b


for line in reader:
    code = line['iata_code']
    if iata_re.match(code):
        if exclude_re.match(line['name']):
            continue
        item = line
        # Check for duplicates
        if code in data:
            if IS_DEBUG:
                print('Duplicate %s:' % (code))
            best = resolve_duplicate(data[code]['long'], line)
            item = best
            if IS_DEBUG:
                if best != None and code in dup_disambiguation:
                    print('  (Known clash)')
                elif best != None:
                    print('  (Resolved)')
                    dup_resolved.append(code)
                else:
                    print('  ', data[code]['long'])
                    print('  ', line)
                print()
                dup_count += 1
        # Grab only the info required
        details = [item['name']]
        if item['municipality'] != '':
            details.append(item['municipality'])

        data[code] = { 'short': details, 'long': item }

if IS_DEBUG:
    print('=== TOTAL DUPLICATES: %i (resolved: %i, known conflicts: %i) ===' %
        (dup_count, len(dup_resolved), len(dup_disambiguation)))
    exit()

outfile.writelines('{\n')
joiner = ' '
for code in sorted(iter(data)):
    prefix = '  %s "%s": ' % (joiner, code)
    outfile.writelines(prefix + json.dumps(data[code]['short']) + '\n')
    joiner = ','
outfile.writelines('}\n')
