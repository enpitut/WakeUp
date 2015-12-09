"use strict";

function callTwitterApi(method, action, parameters, tokens) {
    if (typeof(tokens) == "undefined") {
        tokens = {
            token: loadConfig().authInfo.accessToken,
            tokenSecret: loadConfig().authInfo.accessTokenSecret
        };
    }
    return new Promise((resolve, reject) => {
        let getsToken = (action == "https://api.twitter.com/oauth/request_token" ||
            action == "https://api.twitter.com/oauth/access_token");
        let message = {
            method: method,
            action: action,
            parameters: parameters
        };
        let originalParameters = $.extend({}, message.parameters);
        OAuth.completeRequest(message, $.extend({
            consumerKey: "mqnjswbYNsvfnwp8N3aoPs5TU",
            consumerSecret: "dbaio9YDq5S1X3cL5AceWbFgsaADOaA9B8TrRU2TnDLlYZTVLP"
        }, tokens));
        $.ajax({
            type: message.method,
            url: message.action,
            timeout: 30000,
            headers: {
                "Authorization": OAuth.getAuthorizationHeader("", message.parameters)
            },
            data: OAuth.formEncode(getsToken ? {} : originalParameters),
            dataType: getsToken ? "text" : "json",
            success: response => {
                resolve(getsToken ? OAuth.getParameterMap(response) : response);
            },
            error: response => {
                let error = new Error(`Could not call Twitter API (${response.status} ${response.statusText}): ${response.responseText}`);
                error.response = response;
                reject(error);
            }
        });
    });
}
function tweet(message, tokens) {
    return callTwitterApi("POST", "https://api.twitter.com/1.1/statuses/update.json", {status: message}, tokens);
}
function searchTweets(str, tokens) {
    return callTwitterApi("GET", "https://api.twitter.com/1.1/search/tweets.json", {q: str, count: 100}, tokens);
}
function readTimeline(id, tokens) {
    return callTwitterApi("GET", "https://api.twitter.com/1.1/statuses/user_timeline.json", {user_id: id, count: 1000}, tokens);
}
function getMentions(tokens) {
    return callTwitterApi("GET", "https://api.twitter.com/1.1/statuses/mentions_timeline.json", {count: 200}, tokens);
}
function getUser(idOrScreenName, tokens) {
    let parameters = (typeof(idOrScreenName) == "number" ? {user_id: idOrScreenName} : {screen_name: idOrScreenName});
    return callTwitterApi("GET", "https://api.twitter.com/1.1/users/show.json", parameters, tokens);
}
function getScreenName(id, tokens) {
    return new Promise((resolve, reject) => {
        let screenNameMap = loadConfig().screenNameMap;
        if (screenNameMap.hasOwnProperty(id) && new Date().getTime() - screenNameMap[id].lastModified < 3600000) {
            resolve(screenNameMap[id].screenName);
        } else {
            getUser(id).then(user => {
                modifyConfig(config => {
                    config.screenNameMap[id] = {
                        screenName: user["screen_name"],
                        lastModified: new Date().getTime()
                    };
                });
                resolve(user["screen_name"]);
            }).catch(() => {
                resolve(screenNameMap.hasOwnProperty(id) ? screenNameMap[id].screenName : "???");
            });
        }
    });
}
function getUserId(screenName, tokens) {
    return getUser(screenName).then(user => Promise.resolve(user["id"]));
}

// 1個以上の文字数が不明な文字列を用いて140文字以内のツイートを作る、という問題の解決を助ける関数
function generateTweet(baseMessageGenerator, ...elementHolders) {
    // RFC3986定義の厳密なHTTP URIの正規表現
    // http://sinya8282.sakura.ne.jp/?p=1064
    let uriPattern = /https?:(\/\/(([-.0-9_a-z~]|%[0-9a-f][0-9a-f]|[!$&-,:;=])*@)?(\[(([0-9a-f]{1,4}:){6}([0-9a-f]{1,4}:[0-9a-f]{1,4}|(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5]))|::([0-9a-f]{1,4}:){5}([0-9a-f]{1,4}:[0-9a-f]{1,4}|(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5]))|([0-9a-f]{1,4})?::([0-9a-f]{1,4}:){4}([0-9a-f]{1,4}:[0-9a-f]{1,4}|(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5]))|(([0-9a-f]{1,4}:)?[0-9a-f]{1,4})?::([0-9a-f]{1,4}:){3}([0-9a-f]{1,4}:[0-9a-f]{1,4}|(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5]))|(([0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::([0-9a-f]{1,4}:){2}([0-9a-f]{1,4}:[0-9a-f]{1,4}|(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5]))|(([0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:([0-9a-f]{1,4}:[0-9a-f]{1,4}|(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5]))|(([0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::([0-9a-f]{1,4}:[0-9a-f]{1,4}|(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5]))|(([0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(([0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::|v[0-9a-f]+\.[!$&-.0-;=_a-z~]+)\]|(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])|([-.0-9_a-z~]|%[0-9a-f][0-9a-f]|[!$&-,;=])*)(:\d*)?(\/([-.0-9_a-z~]|%[0-9a-f][0-9a-f]|[!$&-,:;=@])*)*|\/(([-.0-9_a-z~]|%[0-9a-f][0-9a-f]|[!$&-,:;=@])+(\/([-.0-9_a-z~]|%[0-9a-f][0-9a-f]|[!$&-,:;=@])*)*)?|([-.0-9_a-z~]|%[0-9a-f][0-9a-f]|[!$&-,:;=@])+(\/([-.0-9_a-z~]|%[0-9a-f][0-9a-f]|[!$&-,:;=@])*)*)?(\?([-.0-9_a-z~]|%[0-9a-f][0-9a-f]|[!$&-,/:;=?@])*)?(#([-.0-9_a-z~]|%[0-9a-f][0-9a-f]|[!$&-,/:;=?@])*)?/ig;
    // 自由に使える文字数 = 140 - ベースとなる文字列の文字数
    // URIはt.coで短縮されて23文字になるので考慮しておく
    let freeLength = 140 - baseMessageGenerator(...new Array(baseMessageGenerator.length).fill("")).replace(uriPattern, "x".repeat(23)).length;
    // 各文字数が不明な文字列が使える文字数の上限を割り振る
    // 自由に使える文字数が74文字で、文字数が不明な文字列が3個ならば、[25文字, 25文字, 24文字]のように割り振る
    let upperLimitLengths = new Array(elementHolders.length).fill()
        .map((_, i) => Math.floor(freeLength / elementHolders.length) + (i < freeLength % elementHolders.length ? 1 : 0));
    return baseMessageGenerator(...elementHolders.map((elementHolder, i) => {
        // 文字数が不明な文字列中の@#をエスケープしてリプライ誤爆やハッシュタグ誤爆を防ぐ
        let element = elementHolder.element.replace(/([@#＠＃])/g, "$1\u200c");
        return elementHolder.formatter(
            element,
            upperLimitLengths[i],
            // elementの先頭を、使える文字数の上限だけ切り取り、さらに末尾cutLength文字切った文字列を返す関数
            // 末尾を切った結果、末尾が@#になってしまうと、リプライ誤爆やハッシュタグ誤爆を起こしかねないので、その際は末尾の@#も切る
            cutLength => element.substring(0, upperLimitLengths[i] - cutLength).replace(/[@#＠＃]$/, "")
        );
    }));
}

function confirmTweet(message, isSkippable) {
    return confirm(`以下の内容でツイートします。よろしければOKを押してください。${isSkippable ? "（この確認ダイアログは詳細設定で消せます）" : ""}\n${message}`);
}

function notificate(message, displaySeconds) {
    let notification = new Notification(message, {
        icon: "images/ugenchan.png"
    });
    if (displaySeconds > 0) {
        setTimeout(() => {
            notification.close();
        }, displaySeconds * 1000);
    }
    let audio = new Audio();
    audio.autoplay = true;
    audio.src = "sounds/alert.wav";
}

function getCurrentTab() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({currentWindow: true, active: true}, tabs => {
            if (tabs.length == 1) resolve(tabs[0]);
            else reject(new Error("Could not find current tab."));
        });
    });
}

function createRegisterNgSiteButton(){
    chrome.contextMenus.create({
        title: "現在のタブをNGサイトに登録",
        type: "normal",
        id: "register_ngsite_button"
    });
    chrome.contextMenus.create({
        title: "現在のタブをNGサイトから除外",
        type: "normal",
        id: "remove_ngsite_button"
    });
    chrome.contextMenus.onClicked.addListener((info, currentTab) => {
        let domain = currentTab.url.split("/")[2];
        let index = loadConfig().urlList.findIndex(url => url == domain);

        if (info.menuItemId == "register_ngsite_button" && index == -1) {
            modifyConfig(config => {
                config.urlList.push(domain);
            });
            notificate(`${domain}をNGサイトに登録しました`, 5);
        }
        if (info.menuItemId == "remove_ngsite_button" && index != -1) {
            modifyConfig(config => {
                config.urlList.splice(index, 1);
            });
            notificate(`${domain}をNGサイトから除外しました`, 5);
        }
    });
}

function onOAuthButtonClickHandler() {
    getCurrentTab().then(currentTab =>
        callTwitterApi("POST", "https://api.twitter.com/oauth/request_token", {oauth_callback: "oob"}, {}).then(queryMap => {
            queryMap["window_id"] = currentTab.windowId.toString();
            open(OAuth.addToURL("pin.html", queryMap), "", "width=300, height=100");
        })
    ).catch(e => { alert(e.message); })
}

function loadConfig() {
    return JSON.parse(localStorage.getItem("config"));
}
function saveConfig(config) {
    localStorage.setItem("config", JSON.stringify(config));
}
function modifyConfig(modify) {
    let config = loadConfig();
    modify(config);
    saveConfig(config);
}

function getValue(object, ...propertyNames) {
    if (propertyNames.length == 0) return object;
    if (typeof(object) == "undefined" || object === null) return void(0);
    return getValue(object[propertyNames[0]], ...propertyNames.slice(1));
}
function setValue(object) {
    let propertyNames = Array.from(arguments).slice(1, -1);
    let newValue = arguments[arguments.length - 1];
    if (propertyNames.length == 1) {
        object[propertyNames[0]] = newValue;
    } else {
        if (typeof(object[propertyNames[0]]) == "undefined") object[propertyNames[0]] = {};
        setValue(object[propertyNames[0]], ...propertyNames.slice(1), newValue);
    }
}

