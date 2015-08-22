chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if ("url" in changeInfo) {
        if (tab.url.match(/^https?:\/\/[^/]+\.nicovideo\.jp\//)) {
            chrome.tabs.update(tabId, {url: "chrome://newtab/"});
        }
    }
});
