/**
 * Basic process
 *
 * - Click browser action
 *     - If content script isn't in the page, inject it and some simple CSS
 *     - Run script in abbr mode
 *         - Don't replace anything that's already been replaced
 *     - Get count of replaced elements
 *     - Set icon badge to count of replacements for that tab
 *         - Set error icon and different colour if it didn't work
 */

var codeData;

var colors = {
    good: 'hsl(126, 93%, 33%)',
    warning: 'hsl(56, 83%, 43%)',
    bad: 'hsl(16, 83%, 43%)'
};

function injectContentScriptIfNeeded(tab) {
    return new Promise(function (resolve, reject) {
        chrome.tabs.executeScript(tab.id, {
            code: 'document.documentElement.dataset.airportCodesInstalled;'
        }, function (results) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                return;
            }
            if (results && results[0]) {
                resolve(tab);
            } else {
                chrome.tabs.executeScript(tab.id, {
                    file: 'airport-codes.js'
                }, function () {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    resolve(tab);
                });
                chrome.tabs.insertCSS(tab.id, {
                    file: 'airport-codes.css'
                });
            }
        });
    });
}

function setBadgeCount(tab, count) {
    var badgeOptions = {tabId: tab.id, text: ''};
    if (count != null && count !== '') {
        badgeOptions.text = '' + count;
    }
    chrome.browserAction.setBadgeText(badgeOptions);
}

function setBadgeColor(tab, color) {
    chrome.browserAction.setBadgeBackgroundColor({
        tabId: tab.id,
        color: color
    });
}

function replaceAndGetCount(tab) {
    return new Promise(function (resolve) {
        chrome.tabs.executeScript(tab.id, {
            code: 'airportCodes.replaceElement(document.body);'
        }, function () {
            resolve();
        });
    });
}

function runConverter(tab) {
    injectContentScriptIfNeeded(tab)
        .then(replaceAndGetCount)
    .catch(function (err) {
        console.error('Airport codes conversion error:', err, tab);
        setBadgeColor(tab, colors.bad);
        setBadgeCount(tab, 'x');
    });
}

function contentScriptMessageHandler(request, sender, sendResponse) {
    if (sender.tab && request.msg) {
        if (request.msg === 'codeDataPlease') {
            sendResponse({codes: codeData});
        } else if (request.msg === 'replacedElements') {
            setBadgeColor(sender.tab, colors.good);
            setBadgeCount(sender.tab, request.count);
        }
    }
}

chrome.browserAction.onClicked.addListener(runConverter);
chrome.runtime.onMessage.addListener(contentScriptMessageHandler);

// Get and cache the code data
fetch('codes.json').then(function (response) {
    return response.json();
}).then(function (data) {
    codeData = data;
});
