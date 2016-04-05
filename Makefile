datasrc := data/airports.csv
dataparsed := data/codes.json

$(datasrc):
	curl http://ourairports.com/data/airports.csv > $(datasrc)

$(dataparsed): $(datasrc)
	cat $(datasrc) | ./scripts/csv2json.py > $(dataparsed)
