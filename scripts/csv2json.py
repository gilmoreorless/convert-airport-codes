#!/usr/bin/env python3
import re
import sys
import csv
import json

iata_re = re.compile('^[A-Z0-9]{3}$')
exclude_re = re.compile('[\[(]Duplicate[\])]|Erase Me')
reader = csv.DictReader(sys.stdin)
outfile = sys.stdout

data = []

for line in reader:
    code = line['iata_code']
    if iata_re.match(code):
        if exclude_re.match(line['name']):
            continue
        obj = [line['name']]
        if line['municipality'] != '':
            obj.append(line['municipality'])
        data.append([code, obj])

outfile.writelines('{\n')
joiner = ' '
for line in sorted(data, key=lambda x: x[0]):
    code, details = line
    prefix = '  %s "%s": ' % (joiner, code)
    outfile.writelines(prefix + json.dumps(details) + '\n')
    joiner = ','
outfile.writelines('}\n')
