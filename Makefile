datasrc := data/airports.csv
dataparsed := data/codes.json

extdir := chrome-extension
extzip := chrome-extension.zip

iconsrc := src/emojione-plane-512.png
iconsizes := {16,19,38,48,128,256}
icondir := $(extdir)/icons
iconfiles := $(shell echo $(icondir)/icon-$(iconsizes).png)


$(datasrc):
	curl http://ourairports.com/data/airports.csv > $(datasrc)

$(dataparsed): $(datasrc)
	cat $(datasrc) | ./scripts/csv2json.py > $(dataparsed)

$(icondir)/icon-%.png: $(iconsrc)
	@mkdir -p $(@D)
	convert $(iconsrc) -resize $* $@

$(extdir): $(iconfiles) $(dataparsed) src/airport-codes.*
	cp src/airport-codes.* $(dataparsed) $(extdir)
	@touch $(extdir)  # To mark the directory as updated for other dependent commands

chrome-extension.zip: $(extdir)
	zip -r $(extzip) $(extdir) -x \*\/.DS_Store


icons: $(iconfiles)

extsrc: $(extdir)

zip: $(extzip)

.PHONY: icons extsrc zip
