#!/usr/bin/env python
import re
import sys
import csv
import json

iata_re = re.compile('^[a-zA-Z0-9]{3}$')
reader = csv.DictReader(sys.stdin)
outfile = sys.stdout

outfile.writelines('{\n')
for line in reader:
    if iata_re.match(line['iata_code']):
        prefix = '\t"%s": ' % (line['iata_code'].upper())
        obj = [line['name']]
        if line['municipality'] != '':
            obj.append(line['municipality'])
        data = json.dumps(obj)
        outfile.writelines(prefix + data + ',\n')
outfile.writelines('}\n')
