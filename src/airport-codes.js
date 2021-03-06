(function (root) {
    var airportCodes = root.airportCodes = {};

    var rTLA = /\b[A-Z0-9]{3}\b/g;
    var dataPath = '../data/codes.json';
    var codeData, dataPromise;

    var hooks = {
        getData: function () {
            return fetch(dataPath).then(function (response) {
                return response.json();
            });
        }
    };

    if (root.chrome && root.chrome.extension && root.chrome.extension.sendMessage) {
        root.document.documentElement.dataset.airportCodesInstalled = true;

        hooks.getData = function () {
            return new Promise(function (resolve, reject) {
                chrome.runtime.sendMessage({msg: 'codeDataPlease'}, function (response) {
                    if (response && response.codes) {
                        resolve(response.codes);
                    } else {
                        reject(response);
                    }
                });
            });
        };

        hooks.replaceElement = function () {
            var totalReplaced = root.document.querySelectorAll('abbr.airport-codes-inserted').length;
            chrome.runtime.sendMessage({msg: 'replacedElements', count: totalReplaced});
            return totalReplaced;
        };
    }

    function hookPromise(promise, hookName) {
        if (hooks[hookName]) {
            return promise.then(hooks[hookName]);
        }
        return promise;
    }

    function getData() {
        if (!dataPromise) {
            dataPromise = new Promise(function (resolve) {
                return hooks.getData().then(function (data) {
                    codeData = data;
                    resolve(data);
                    return data;
                });
            });
        }
        return dataPromise;
    }

    function hasTLAs(text) {
        return String(text).search(rTLA) > -1;
    }

    function findTLAs(text) {
        var tlas = [];
        var match;
        while ((match = rTLA.exec(text)) !== null) {
            tlas.push({
                text: match[0],
                index: match.index
            });
        }
        return tlas;
    }

    function findCodes(text) {
        return findTLAs(text).filter(function (tla) {
            return codeData.hasOwnProperty(tla.text);
        });
    }

    function codeLocation(iataCode, isShort) {
        var details = codeData[iataCode];
        if (!details || !details.length) {
            return '';
        }
        var text = '';
        if (isShort) {
            text = details[1];
        }
        if (!text) {
            text = details.join(', ');
        }
        return text;
    }

    function replaceText(text) {
        var codes = findCodes(text);
        if (!codes.length) {
            return text;
        }
        var newText = '';
        var textIndex = 0;
        codes.forEach(function (code) {
            newText += text.substring(textIndex, code.index);
            newText += codeLocation(code.text, true) + ' (' + code.text + ')';
            textIndex = code.index + 3;
        });
        newText += text.substr(textIndex);
        return newText;
    }

    function replaceNode(node, options) {
        if (options.method === 'expand') {
            var oldText = node.textContent;
            var newText = replaceText(oldText);
            node.textContent = newText;
            return oldText !== newText;
        }
        // Default: method === 'abbr'
        var codes = findCodes(node.textContent);
        if (!codes.length) {
            return false;
        }
        var origText = node.textContent;
        var textIndex = 0;

        var doc = node.ownerDocument;
        var frag = doc.createDocumentFragment();
        var subTextNode = function (start, end) {
            return doc.createTextNode(origText.substring(start, end));
        };

        codes.forEach(function (code) {
            var abbr = doc.createElement('abbr');
            abbr.textContent = code.text;
            abbr.setAttribute('title', codeLocation(code.text));
            abbr.className = 'airport-codes-inserted';
            frag.appendChild(subTextNode(textIndex, code.index));
            frag.appendChild(abbr);
            textIndex = code.index + 3;
        });
        if (textIndex < origText.length) {
            frag.appendChild(subTextNode(textIndex, origText.length));
        }
        node.parentNode.replaceChild(frag, node);
        return true;
    }

    function replaceElement(elem, options) {
        // Quick short-circuit to avoid more DOM operations if there is no matching text
        var codes = findCodes(elem.textContent);
        if (!codes.length) {
            return [];
        }

        // Set up a DOM node walker
        var NF = root.NodeFilter;
        var whatToShow = NF.SHOW_TEXT;
        var walker = elem.ownerDocument.createTreeWalker(elem, whatToShow, {
            acceptNode: function (node) {
                return hasTLAs(node.textContent) ? NF.FILTER_ACCEPT : NF.FILTER_REJECT;
            }
        });
        var nodeList = [];
        var parentList = [];
        while ((node = walker.nextNode())) {
            nodeList.push(node);
        }
        nodeList.forEach(function (node) {
            var parent = node.parentNode;
            if (parent.nodeName.toLowerCase() === 'abbr') {
                return;
            }
            var replaced = replaceNode(node, options);
            if (replaced) {
                parentList.push(parent);
            }
        });
        // De-duplicate the parent nodes
        var used = [];
        return parentList.filter(function (node) {
            if (used.indexOf(node) > -1) {
                return false;
            }
            used.push(node);
            return true;
        });
    }


    airportCodes.setDataPath = function (path) {
        dataPath = String(path);
    };

    airportCodes.replaceText = function (text) {
        var promise = getData().then(function () {
            return replaceText(text);
        });
        return hookPromise(promise, 'replaceText');
    };

    airportCodes.replaceElement = function (elem, options) {
        var opts = options || {};
        var promise = getData().then(function () {
            return replaceElement(elem, opts);
        });
        return hookPromise(promise, 'replaceElement');
    };
})(this);
