/**
 * Basic process
 *
 * - Click browser action
 *     - If content script isn't in the page, inject it
 *         - getData() pulls from extension background instead of local file
 *     - Run script in abbr mode
 *         - Don't replace anything that's already been replaced
 *     - Get count of replaced elements
 *     - Set icon badge to count of replacements for that tab ID
 *     - Register listener for tab navigation
 * - On tab navigation (if listener registered)
 *     - Remove icon badge
 *     - Unregister listener
 */

var codeData;

function injectContentScriptIfNeeded(tab) {
    // TODO: The "if needed" bit
    return new Promise(function (resolve, reject) {
        chrome.tabs.executeScript(tab.id, {
            file: 'airport-codes.js'
        }, function () {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                return;
            }
            resolve();
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

function removeBadge(tab) {
    setBadgeCount(tab, '');
}

function runConverter(tab) {
    injectContentScriptIfNeeded(tab).then(function () {
        console.log('injected');
    }).catch(function (err) {
        alert(err);
        // TODO: Update badge with error icon and show error somehow?
    });
}

function contentScriptMessageHandler(request, sender, sendResponse) {
    if (sender.tab && request.msg && request.msg === 'codeDataPlease') {
        sendResponse({codes: codeData});
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
