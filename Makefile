datasrc := data/airports.csv
dataparsed := data/codes.json

extdir := chrome-extension

iconsrc := src/emojione-plane-512.png
iconsizes := {16,19,38,48,128,256}
icondir := $(extdir)/icons
iconfiles := $(shell echo $(icondir)/icon-$(iconsizes).png)


$(datasrc):
	curl http://ourairports.com/data/airports.csv > $(datasrc)

$(dataparsed): $(datasrc)
	cat $(datasrc) | ./scripts/csv2json.py > $(dataparsed)

$(icondir)/icon-%.png:
	@mkdir -p $(@D)
	convert $(iconsrc) -resize $* $@

icons: $(iconfiles)

extsrc: icons $(dataparsed)
	cp src/airport-codes.js $(dataparsed) $(extdir)

.PHONY: icons extsrc
