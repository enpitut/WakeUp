"use strict";

var limitSeconds;
var elapsedSeconds;
var stayNgSiteSeconds;
var taskDescription;
var timerState = "off";
var oneMinuteNotified = false;
<<<<<<< HEAD
var saboriNum = 0;
=======
var wait = 1000;
>>>>>>> master

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
            notificate("あと1分でtweetされます", 5);
            oneMinuteNotified = true;
        }
        chrome.browserAction.setBadgeText({text: Math.round(remainingSeconds).toString()});
        chrome.browserAction.setBadgeBackgroundColor({color:[255, 0, 0, 100]});
    }
    if (elapsedSeconds >= limitSeconds) {
<<<<<<< HEAD
        saveTaskLog(false);
        tweet(generateTweet(
            element => `@${localStorage.getItem("replyAccount")} 突然のリプライ失礼致します。このたび私事ながら${element}作業時間の見積もりに失敗しました。誠に申し訳ありません ${new Date()} #UGEN`,
            {
                element: taskDescription,
                formatter(element, upperLimitLength, getShortenedString) {
                    if (element == "") return "";
                    if (element.length + 3 <= upperLimitLength) return `「${element}」の`;
                    return `「${getShortenedString(6)}...」の`;
                },
            }
        ), () => { alert("tweetしたよ^_^"); });
=======
        let recipientId = loadConfig().replySetting[loadConfig().authInfo.userId].recipientId;
        if (recipientId !== null) {
            getScreenName(recipientId).then(screenName => {
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
                )).then(() => { notificate("tweetしたよ^_^", 5); }).catch(e => { alert(e.message); });
            });
        } else {
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
            )).then(() => { notificate("tweetしたよ^_^", 5); }).catch(e => { alert(e.message); });
        }
>>>>>>> master
        stopTimer();
        return;
    }

    getCurrentTab().then(currentTab => {
        if (!isNgSite(currentTab.url)) return next();

        stayNgSiteSeconds++;
        switch (stayNgSiteSeconds) {
        case ALERT_TIME:
            notificate(`あと ${TWEET_TIME - ALERT_TIME} 秒 ${currentTab.title} に滞在するとTwitterに報告されます`, 5);
            break;
        case TWEET_TIME:
<<<<<<< HEAD
            saboriNum++;
            if(localStorage.getItem("tweetTabinfo") === "True") {
=======
            if (loadConfig().tweetTabInfo) {
                let now = new Date();
>>>>>>> master
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
                )).then(() => { notificate("tweetしたよ^_^", 5); }).catch(e => { alert(e.message); });;
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
                )).then(() => { notificate("tweetしたよ^_^", 5); }).catch(e => { alert(e.message); });;
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
    saboriNum = 0;
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

function isNgSite(targetUrl) {
    return loadConfig().urlList.map(url => new RegExp(url.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1"))).some(re => targetUrl.match(re));
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
            .concat([loadConfig().authInfo.userId])
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
          let myWorkTime = Math.round((elapsedSeconds / 60) + workTimeMap.get(loadConfig().authInfo.userId));
          let myRank = [...workTimeMap.values()].filter(workTime => workTime > myWorkTime).length + 1;
          notificate(`今日のあなたの作業時間合計は${myWorkTime}分で、${workTimeMap.size}人中${myRank}位です！`, 5);
      });
}

$(() => {
    if (loadConfig() === null) {
        saveConfig({
            version: 1,
            urlList: ["nicovideo.jp", "youtube.com"],
            authInfo: null,
            replySetting: {},
            screenNameMap: {},
            tweetTabInfo: false,
            showRegisterNgSiteButton: false
        });
    }

    if (loadConfig().showRegisterNgSiteButton) {
        createRegisterNgSiteButton();
    }
    
     if (localStorage.getItem("taskLog") === null) {
        localStorage.setItem("taskLog", JSON.stringify([{ date: new Date().toDateString(), taskDescriptions: [], workMinutes: 0, saboriNum: 0, successNum: 0}]));
    }
});

function saveTaskLog(isSuccess) {
    let taskLog = JSON.parse(localStorage.getItem("taskLog"));
    let lastLog = taskLog[taskLog.length-1];
    
    let today = new Date();
    let workMinutes = Math.floor(elapsedSeconds / 60);
    
    if(lastLog.date == today.toDateString()){
        lastLog.workMinutes += workMinutes;
        lastLog.task_descriptions.push((taskDescription=="") ? null : taskDescription);
        lastLog.saboriNum += saboriNum;
        if(isSuccess)lastLog.successNum++;
        taskLog[taskLog.length-1] = lastLog;
    } else {
        taskLog.push({ date: today.toDateString(), task_descriptions:[(taskDescription=="") ? "-" : taskDescription], workMinutes: workMinutes, saboriNum: saboriNum, successNum: (isSuccess) ? 1 : 0});
    }
    localStorage.setItem("taskLog", JSON.stringify(taskLog));
}