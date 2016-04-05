#!/usr/bin/env python
import sys
import csv
import json

reader = csv.DictReader(sys.stdin)
outfile = sys.stdout

outfile.writelines('{\n')
for line in reader:
    if line['iata_code'] != '':
        prefix = '\t"%s": ' % (line['iata_code'])
        obj = [line['name']]
        if line['municipality'] != '':
            obj.append(line['municipality'])
        data = json.dumps(obj)
        outfile.writelines(prefix + data + ',\n')
outfile.writelines('}\n')
