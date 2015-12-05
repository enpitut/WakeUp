"use strict";

var limitSeconds;
var elapsedSeconds;
var stayNgSiteSeconds;
var taskDescription;
var timerState = "off";
var oneMinuteNotified = false;
var wait = 1000;

const ALERT_TIME = 5;
const TWEET_TIME = 10;

let timerId;

function mainLoop() {
    function next() {
        if (timerState == "on") timerId = setTimeout(mainLoop, wait);
    }

    elapsedSeconds++;
    let remainingSeconds = limitSeconds - elapsedSeconds;
    if (remainingSeconds > 60) {
        chrome.browserAction.setBadgeText({text: Math.ceil(remainingSeconds / 60).toString()});
        chrome.browserAction.setBadgeBackgroundColor({color:[0, 0, 255, 100]});
    } else {
        if (!oneMinuteNotified){
            notificate("あと1分でtweetされます", 2);
            oneMinuteNotified = true;
        }
        chrome.browserAction.setBadgeText({text: Math.round(remainingSeconds).toString()});
        chrome.browserAction.setBadgeBackgroundColor({color:[255, 0, 0, 100]});
    }
    if (elapsedSeconds >= limitSeconds) {

        let replyAccountId = JSON.parse(localStorage.getItem("replySetting"))[localStorage.getItem("userId")].replyAccountId;
        if (replyAccountId == -1) {
            let now = new Date();
            tweet(generateTweet(
                element => sprintf(TWEET_PHRASES.FAILED.WITHOUT_RECIPIENT, {taskDescription: element, date: now}),
                {
                    element: taskDescription,
                    formatter(element, upperLimitLength, getShortenedString) {
                        if (element == "") return "作業";
                        if (element.length + 5 <= upperLimitLength) return `「${element}」の作業`;
                        return `「${getShortenedString(8)}...」の作業`;
                    }
                }
            )).then(() => { alert("tweetしたよ^_^"); }).catch(e => { alert(e.message); });
        } else {
            getScreenName(replyAccountId).then(screenName => {
                let now = new Date();
                tweet(generateTweet(
                    element => sprintf(TWEET_PHRASES.FAILED.WITH_RECIPIENT, {recipient: screenName, taskDescription: element, date: now}),
                    {
                        element: taskDescription,
                        formatter(element, upperLimitLength, getShortenedString) {
                            if (element == "") return "作業";
                            if (element.length + 5 <= upperLimitLength) return `「${element}」の作業`;
                            return `「${getShortenedString(8)}...」の作業`;
                        }
                    }
                )).then(() => { alert("tweetしたよ^_^"); }).catch(e => { alert(e.message); });
            });
        }
        stopTimer();
        return;
    }

    getCurrentTab().then(currentTab => {
        if (!isNgSite(currentTab.url)) return next();

        stayNgSiteSeconds++;
        switch (stayNgSiteSeconds) {
        case ALERT_TIME:
            notificate(`あと ${TWEET_TIME - ALERT_TIME} 秒 ${currentTab.title} に滞在するとTwitterに報告されます`, 2);
            break;
        case TWEET_TIME:
            if(localStorage.getItem("tweetTabInfo") === "True") {
                let now = new Date();
                tweet(generateTweet(
                    (element1, element2) => sprintf(TWEET_PHRASES.WATCHED_NG_SITES.WITH_TAB_INFO, {taskDescription: element1, siteName: element2, siteUrl: currentTab.url, date: now}),
                    {
                        element: taskDescription,
                        formatter(element, upperLimitLength, getShortenedString) {
                            if (element == "") return "作業";
                            if (element.length + 2 <= upperLimitLength) return `「${element}」`;
                            return `「${getShortenedString(5)}...」`;
                        }
                    },
                    {
                        element: currentTab.title,
                        formatter(element, upperLimitLength, getShortenedString) {
                            if (element.length <= upperLimitLength) return element;
                            else return `${getShortenedString(3)}...`;
                        }
                    }
                )).then(() => { alert("tweetしたよ^_^"); }).catch(e => { alert(e.message); });;
            } else {
                let now = new Date();
                tweet(generateTweet(
                    element => sprintf(TWEET_PHRASES.WATCHED_NG_SITES.WITHOUT_TAB_INFO, {taskDescription: element, date: now}),
                    {
                        element: taskDescription,
                        formatter(element, upperLimitLength, getShortenedString) {
                            if (element == "") return "作業";
                            if (element.length + 2 <= upperLimitLength) return `「${element}」`;
                            return `「${getShortenedString(5)}...」`;
                        }
                    }
                )).then(() => { alert("tweetしたよ^_^"); }).catch(e => { alert(e.message); });;
            }
            chrome.tabs.update(currentTab.id, {url: "chrome://newtab/"});
            stayNgSiteSeconds = 0;
            break;
        }
        next();
    }).catch(e => { alert(e.message); });
}

function startTimer(limitSecondsAsParameter, taskDescriptionAsParameter) {
    if (timerState != "off") throw new Error("Illegal state.");
    limitSeconds = limitSecondsAsParameter;
    elapsedSeconds = -1;
    stayNgSiteSeconds = -1;
    taskDescription = taskDescriptionAsParameter;
    timerState = "on";
    chrome.browserAction.setIcon({path: "images/watchicon16.png"});
    oneMinuteNotified = false;
    mainLoop();
}

function pauseTimer() {
    if (timerState != "on") throw new Error("Illegal state.");
    timerState = "pause";
    chrome.browserAction.setIcon({path: "images/icon16.png"});
    clearTimeout(timerId);
}

function restartTimer() {
    if (timerState != "pause") throw new Error("Illegal state.");
    timerState = "on";
    chrome.browserAction.setIcon({path: "images/watchicon16.png"});
    mainLoop();
}

function stopTimer() {
    if (timerState != "on") throw new Error("Illegal state.");
    timerState = "off";
    chrome.browserAction.setBadgeText({"text": ""});
    chrome.browserAction.setIcon({path: "images/icon16.png"});
    clearTimeout(timerId);
}

function isNgSite(url) {
    let urlList = JSON.parse(localStorage.getItem("urlList"));
    for (let str of urlList) {
        let re = new RegExp(str.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1"));
        if (url.match(re)) return true;
    }
    return false;
}

function notifyRank(){
    searchTweets("#UGEN")
    .then(responseJson => {
        let re = /\d+分かかると見積もった.*を(\d+)分で終えました!/;
        let userIds = [...new Set(
            responseJson.statuses
            .filter(status => status.lang == "ja" && status.text.match(re))
            .filter(status => new Date(status.created_at).toDateString() == new Date().toDateString()) //toDateString()で日付だけを取得できる
            .map(status => status.user.id)
            .concat(Number([localStorage.getItem("userId")]))
        )];

    return Promise.all(userIds.map(userId => readTimeline(userId)
        .then(statuses => [
            userId,
            statuses.filter(status => status.text.match(re))
              .filter(status => new Date(status.created_at).toDateString() == new Date().toDateString()) //toDateString()で日付だけを取得できる
              .map(status => Number(status.text.match(re)[1]))
              .reduce((sum, minutes) => sum + minutes, 0)])
          )).then(pairs => new Map(pairs));
      }).then(workTimeMap => {
          let myWorkTime = Math.round((elapsedSeconds / 60) + workTimeMap.get(Number(localStorage.getItem("userId"))));
          let myRank = [...workTimeMap.values()].filter(workTime => workTime > myWorkTime).length + 1;
          notificate(`今日のあなたの作業時間合計は${myWorkTime}分で、${workTimeMap.size}人中${myRank}位です！`, 0);
      });
}

$(() => {
    if (localStorage.getItem("urlList") === null) {
        localStorage.setItem("urlList", JSON.stringify(["nicovideo.jp", "youtube.com"]));
    }
    if (localStorage.getItem("replySetting") === null) {
        localStorage.setItem("replySetting", JSON.stringify({}));
    }
    if (localStorage.getItem("screenNameMap") === null) {
        localStorage.setItem("screenNameMap", JSON.stringify({}))
    }
    if (localStorage.getItem("showRegisterNgSiteButton") === "True") {
        $("#show_register_ngsite_button_checkbox").prop("checked", true);
        createRegisterNgSiteButton();
    }
});
