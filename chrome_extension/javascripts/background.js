"use strict";

var limitSeconds;
var elapsedSeconds;
var stayNgSiteSeconds;
var isTimerOn = false;
let oneMinuteNotified;

const ALERT_TIME = 5;
const TWEET_TIME = 10;

let mainLoop = co.wrap(function* () {
    while (true) {
        elapsedSeconds++;
        let remainingSeconds = limitSeconds - elapsedSeconds;
        if (remainingSeconds > 60) {
            chrome.browserAction.setBadgeText({text: Math.round(remainingSeconds / 60).toString()});
            chrome.browserAction.setBadgeBackgroundColor({color: [0, 0, 255, 100]});
        } else {
            if (!oneMinuteNotified) {
                let notification = new Notification("あと1分でtweetされます", {
                    body: "",
                    icon: "../images/ugenchan.png"
                });
                sleep(2).then(() => { notification.close(); })
                oneMinuteNotified = true;
            }
            chrome.browserAction.setBadgeText({text: Math.round(remainingSeconds).toString()});
            chrome.browserAction.setBadgeBackgroundColor({color: [255, 0, 0, 100]});
        }
        if (elapsedSeconds >= limitSeconds) {
            tweet(`@${localStorage.getItem("replyAccount")} 突然のリプライ失礼致します。このたび私事ながら作業時間の見積もりに失敗しました。誠に申し訳ありません ${new Date()} #UGEN`)
                .then(() => { alert("tweetしたよ^_^"); })
                .catch(e => { alert(e.message); });
            stopTimer();
            return;
        }

        let currentTab;
        try {
            currentTab = yield getCurrentTab();
        } catch (e) {
        }
        if (typeof(currentTab) != "undefined" && isNgSite(currentTab.url)) {
            stayNgSiteSeconds++;
            switch (stayNgSiteSeconds) {
            case ALERT_TIME:
                alert(`あと ${TWEET_TIME - ALERT_TIME} 秒 ${currentTab.title} に滞在するとTwitterに報告されます`);
                break;
            case TWEET_TIME:
                if(localStorage.getItem("tweetTabinfo") === "True") {
                    tweet(`私は作業をサボって ${currentTab.title.substr(0, 40).replace(/(@|#|＃|＠)/g, "$1\u200c")}(${currentTab.url}) を見ていました ${new Date()}`.substr(0, 135) + " #UGEN")
                        .then(() => { alert("tweetしたよ^_^"); })
                        .catch(e => { alert(e.message); });
                } else {
                    tweet(`私は作業をサボっていました ${new Date()} #UGEN`)
                        .then(() => { alert("tweetしたよ^_^"); })
                        .catch(e => { alert(e.message); });
                }
                chrome.tabs.update(currentTab.id, {url: "chrome://newtab/"});
                stayNgSiteSeconds = 0;
                break;
            }
        }

        try {
            yield sleep(1, "mainLoop");
        } catch (e) {
            return;
        }
    }
});

function startTimer(arg) {
    limitSeconds = arg;
    elapsedSeconds = -1;
    stayNgSiteSeconds = -1;
    isTimerOn = true;
    oneMinuteNotified = false;
    chrome.browserAction.setIcon({path: "../images/watchicon16.png"});
    mainLoop();
}

function stopTimer() {
    isTimerOn = false;
    chrome.browserAction.setBadgeText({text: ""});
    chrome.browserAction.setIcon({path: "../images/icon16.png"});
    sleep.cancel("mainLoop");
}

if (localStorage.getItem("urlList") === null) {
    localStorage.setItem("urlList", JSON.stringify(["nicovideo.jp", "youtube.com"]));
}

if (localStorage.getItem("replyAccount") === null) {
    localStorage.setItem("replyAccount", "UGEN_teacher");
}

function isNgSite(url) {
    let urlList = JSON.parse(localStorage.getItem("urlList"));
    for (let str of urlList) {
        let re = new RegExp(str.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1"));
        if (url.match(re)) return true;
    }
    return false;
}

$(() => {
    if (localStorage.getItem("showRegisterNgSiteButton") === "True") {
        createRegisterNgSiteButton();
    }
});
