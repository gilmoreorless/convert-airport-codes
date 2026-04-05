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
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => document.documentElement.dataset.airportCodesInstalled,
        }).then(function (results) {
            console.log('[executeScript results]', results);
            if (results?.[0]?.result) {
                resolve(tab);
                return;
            }
            return chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['airport-codes.js'],
            })
            .then(function () {
                return chrome.scripting.insertCSS({
                    target: { tabId: tab.id },
                    files: ['airport-codes.css'],
                });
            })
            .then(function () {
                resolve(tab);
            });
        })
        .catch(reject);
    });
}

function setBadgeCount(tab, count) {
    var badgeOptions = {tabId: tab.id, text: ''};
    if (count != null && count !== '') {
        badgeOptions.text = '' + count;
    }
    chrome.action.setBadgeText(badgeOptions);
}

function setBadgeColor(tab, color) {
    chrome.action.setBadgeBackgroundColor({
        tabId: tab.id,
        color: color
    });
}

function replaceAndGetCount(tab) {
    return chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => airportCodes.replaceElement(document.body),
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

chrome.action.onClicked.addListener(runConverter);
chrome.runtime.onMessage.addListener(contentScriptMessageHandler);

// Get and cache the code data
fetch('codes.json').then(function (response) {
    return response.json();
}).then(function (data) {
    codeData = data;
});
