#!/usr/bin/env python
import re
import sys
import csv
import json

iata_re = re.compile('^[A-Z0-9]{3}$')
exclude_re = re.compile('\[Duplicate\]|Erase Me')
reader = csv.DictReader(sys.stdin)
outfile = sys.stdout

outfile.writelines('{\n')
joiner = ' '
for line in reader:
    if iata_re.match(line['iata_code']):
        prefix = '  %s "%s": ' % (joiner, line['iata_code'].upper())
        if exclude_re.match(line['name']):
            continue
        obj = [line['name']]
        if line['municipality'] != '':
            obj.append(line['municipality'])
        data = json.dumps(obj)
        outfile.writelines(prefix + data + '\n')
        joiner = ','
outfile.writelines('}\n')
