# Airport code explainer

A small utility to expand IATA airport codes in text to avoid having to look them up.

So far this script comes in 2 parts: A standalone JS library and a Chrome browser extension.


## JS library

(Documentation coming at some point...)


## Chrome extension

The extension can be installed at <https://chrome.google.com/webstore/detail/airport-code-explainer/mceehpfaopbngcflhlgkabgjonnngmjf>.

I originally made this just to be lazy when I’m looking at Twitter, so it’s very simple at the moment.
People on social media will often post details of where they’re flying by just referencing airport codes.
This is fine **if** you know which airports the (sometimes obscure) codes refer to.
But when you don’t know, just press the plane icon to add a tooltip to every known airport code found in the current page.

![Example screenshot of using the Chrome extension](chrome-webstore/screenshot-01-1280.png)


## Credits

* This code is [MIT licensed](LICENSE) open source.
* Airport data provided in the Public Domain by [OurAirports](http://ourairports.com/data/).
* Icon from [EmojiOne](http://emojione.com/), licensed CC-BY 4.0.
