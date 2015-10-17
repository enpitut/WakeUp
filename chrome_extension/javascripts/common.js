"use strict";

function createRegisterNgSiteButton(){
    chrome.contextMenus.create({
        title: "現在のタブをNGサイトに登録",
        type :"normal",
        id: "register_ngsite_button",
    });
    chrome.contextMenus.create({
        title: "現在のタブをNGサイトから除外",
        type :"normal",
        id: "remove_ngsite_button",
    });
    chrome.contextMenus.onClicked.addListener(onRegisterNgSiteButtonClickHandler);
}

function onRegisterNgSiteButtonClickHandler(info, currentTab) {
    if (typeof(currentTab) == "undefined") return;
    let urlList = JSON.parse(localStorage.getItem("urlList"));
    let domain = currentTab.url.split("/")[2];
    let index = urlList.findIndex(url => url == domain);
    if (info.menuItemId == "register_ngsite_button" && index == -1) {
        urlList.push(domain);
        localStorage.setItem("urlList", JSON.stringify(urlList));
        let notification = new Notification(`${domain}をNGサイトに登録しました`);
        sleep(2).then(() => { notification.close(); });
    }
    if (info.menuItemId == "remove_ngsite_button" && index > -1) {
        urlList.splice(index, 1);
        localStorage.setItem("urlList", JSON.stringify(urlList));
        let notification = new Notification(`${domain}をNGサイトから除外しました`);
        sleep(2).then(() => { notification.close(); });
    }
}

function callTwitterApi(method, action, parameters, tokens) {
    if (typeof(tokens) == "undefined") {
        tokens = {
            token: localStorage.getItem("accessToken"),
            tokenSecret: localStorage.getItem("accessTokenSecret"),
        };
    }
    return new Promise((resolve, reject) => {
        let getsToken = (action == "https://api.twitter.com/oauth/request_token" ||
            action == "https://api.twitter.com/oauth/access_token");
        let message = {
            method: method,
            action: action,
            parameters: parameters,
        };
        let originalParameters = $.extend({}, message.parameters);
        OAuth.completeRequest(message, $.extend({
            consumerKey: "mqnjswbYNsvfnwp8N3aoPs5TU",
            consumerSecret: "dbaio9YDq5S1X3cL5AceWbFgsaADOaA9B8TrRU2TnDLlYZTVLP",
        }, tokens));
        $.ajax({
            type: message.method,
            url: message.action,
            headers: {
                "Authorization": OAuth.getAuthorizationHeader("", message.parameters)
            },
            data: OAuth.formEncode(getsToken ? {} : originalParameters),
            dataType: getsToken ? "text" : "json",
            success: response => {
                resolve(getsToken ? OAuth.getParameterMap(response) : response);
            },
            error: response => {
                reject(new Error(`could not call Twitter API (${response.status} ${response.statusText}): ${response.responseText}`));
            },
        });
    });
}

function tweet(message, tokens) {
    return callTwitterApi("POST", "https://api.twitter.com/1.1/statuses/update.json", {status: message}, tokens);
}

function getCurrentTab() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({currentWindow: true, active: true}, tabs => {
            if (tabs.length == 1) resolve(tabs[0]);
            else reject(new Error("could not find current window"));
        });
    });
}

var sleep;
() => {
    let cancelMap = new Map();
    sleep = (sec, id) => {
        if (typeof(id) == "undefined") {
            return new Promise((resolve, reject) => {
                setTimeout(resolve, sec * 1000);
            });
        }
        if (cancalMap.has(id)) {
            return Promise.reject(new Error(`timer [${id}] is duplicated`));
        }
        return new Promise((resolve, reject) => {
            let timerId = setTimeout(() => {
                cancelMap.delete(id);
                resolve();
            }, sec * 1000);
            cancelMap.set(id, () => {
                cancelMap.delete(id);
                clearTimeout(timerId);
                reject(new Error(`timer [${id}] was cancelled`));
            });
        });
    }
    sleep.cancel = id => {
        if (cancelMap.has(id)) cancelMap.get(id)();
    };
}();
