"use strict";

var limitSeconds;
var elapsedSeconds;
var stayNgSiteSeconds;
var taskDescription;
var timerState = "off";
var oneMinuteNotified = false;
var saboriNum = 0;
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
        chrome.browserAction.setBadgeText({ text: Math.ceil(remainingSeconds / 60).toString() });
        chrome.browserAction.setBadgeBackgroundColor({ color: [0, 0, 255, 100] });
    } else {
        if (!oneMinuteNotified) {
            notificate("あと1分でtweetされます", 5);
            oneMinuteNotified = true;
        }
        chrome.browserAction.setBadgeText({ text: Math.round(remainingSeconds).toString() });
        chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 100] });
    }
    if (elapsedSeconds >= limitSeconds) {
        let recipientId = loadConfig().replySetting[loadConfig().authInfo.userId].recipientId;
        if (recipientId !== null) {
            getScreenName(recipientId).then(screenName => {
                let now = new Date();
                let message = generateTweet(
                    element => sprintf(TWEET_PHRASES.FAILED.WITH_RECIPIENT, { recipient: screenName, taskDescription: element, date: now }),
                    {
                        element: taskDescription,
                        formatter(element, upperLimitLength, getShortenedString) {
                            if (element == "") return "作業";
                            if (element.length + 5 <= upperLimitLength) return `「${element}」の作業`;
                            return `「${getShortenedString(8) }...」の作業`;
                        }
                    }
                );
                if (loadConfig().postAutomatically.failed.withRecipient || confirmTweet(message, true)) {
                    tweet(message).then(() => { notificate("tweetしたよ^_^", 5); }).catch(e => { alert(e.message); });
                }
            });
        } else {
            let now = new Date();
            let message = generateTweet(
                element => sprintf(TWEET_PHRASES.FAILED.WITHOUT_RECIPIENT, { taskDescription: element, date: now }),
                {
                    element: taskDescription,
                    formatter(element, upperLimitLength, getShortenedString) {
                        if (element == "") return "作業";
                        if (element.length + 5 <= upperLimitLength) return `「${element}」の作業`;
                        return `「${getShortenedString(8) }...」の作業`;
                    }
                }
            );
            if (loadConfig().postAutomatically.failed.withoutRecipient || confirmTweet(message, true)) {
                tweet(message).then(() => { notificate("tweetしたよ^_^", 5); }).catch(e => { alert(e.message); });
            }
        }
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
                if (loadConfig().tweetTabInfo) {
                    saboriNum++;
                    let now = new Date();
                    let message = generateTweet(
                        (element1, element2) => sprintf(TWEET_PHRASES.WATCHED_NG_SITES.WITH_TAB_INFO, { taskDescription: element1, siteName: element2, siteUrl: currentTab.url, date: now }),
                        {
                            element: taskDescription,
                            formatter(element, upperLimitLength, getShortenedString) {
                                if (element == "") return "作業";
                                if (element.length + 2 <= upperLimitLength) return `「${element}」`;
                                return `「${getShortenedString(5) }...」`;
                            }
                        },
                        {
                            element: currentTab.title,
                            formatter(element, upperLimitLength, getShortenedString) {
                                if (element.length <= upperLimitLength) return element;
                                else return `${getShortenedString(3) }...`;
                            }
                        }
                    );
                    if (loadConfig().postAutomatically.watchedNgSites.withTabInfo || confirmTweet(message, true)) {
                        tweet(message).then(() => { notificate("tweetしたよ^_^", 5); }).catch(e => { alert(e.message); });
                    }
                } else {
                    let now = new Date();
                    let message = generateTweet(
                        element => sprintf(TWEET_PHRASES.WATCHED_NG_SITES.WITHOUT_TAB_INFO, { taskDescription: element, date: now }),
                        {
                            element: taskDescription,
                            formatter(element, upperLimitLength, getShortenedString) {
                                if (element == "") return "作業";
                                if (element.length + 2 <= upperLimitLength) return `「${element}」`;
                                return `「${getShortenedString(5) }...」`;
                            }
                        }
                    );
                    if (loadConfig().postAutomatically.watchedNgSites.withoutTabInfo || confirmTweet(message, true)) {
                        tweet(message).then(() => { notificate("tweetしたよ^_^", 5); }).catch(e => { alert(e.message); });
                    }
                }
                chrome.tabs.update(currentTab.id, { url: "chrome://newtab/" });
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
    chrome.browserAction.setIcon({ path: "images/watchicon16.png" });
    oneMinuteNotified = false;
    saboriNum = 0;
    mainLoop();
}

function pauseTimer() {
    if (timerState != "on") throw new Error("Illegal state.");
    timerState = "pause";
    chrome.browserAction.setIcon({ path: "images/icon16.png" });
    clearTimeout(timerId);
}

function restartTimer() {
    if (timerState != "pause") throw new Error("Illegal state.");
    timerState = "on";
    chrome.browserAction.setIcon({ path: "images/watchicon16.png" });
    mainLoop();
}

function stopTimer() {
    if (timerState != "on") throw new Error("Illegal state.");
    timerState = "off";
    chrome.browserAction.setBadgeText({ "text": "" });
    chrome.browserAction.setIcon({ path: "images/icon16.png" });
    clearTimeout(timerId);
}

function isNgSite(targetUrl) {
    return loadConfig().urlList.map(url => new RegExp(url.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1"))).some(re => targetUrl.match(re));
}

function notifyRank() {
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
    if (loadConfig().version == 1) {
        modifyConfig(config => {
            config.version++;
            config.taskLog = [];
        });
    }
    if (loadConfig().version == 2) {
        modifyConfig(config => {
            config.version++;
            config.postAutomatically = {
                watchedNgSites: {withTabInfo: false, withoutTabInfo: false},
                failed: {withRecipient: false, withoutRecipient: false},
                successed: false
            };
        });
    }

    if (loadConfig().showRegisterNgSiteButton) {
        createRegisterNgSiteButton();
    }

});

function saveTaskLog(isSuccess) {
    let config = loadConfig();
    let taskLog = config.taskLog;
    let today = new Date();

    if (taskLog.length == 0 || taskLog[taskLog.length - 1].date != today.toDateString()) {
        taskLog.push({
            date: today.toDateString(),
            taskDescriptions: [],
            workMinutes: 0,
            saboriNum: 0,
            successNum: 0
        });
    }

    let lastLog = taskLog[taskLog.length - 1];
    lastLog.taskDescriptions.push(taskDescription);
    lastLog.workMinutes += Math.floor(elapsedSeconds / 60);
    lastLog.saboriNum += saboriNum;
    if (isSuccess) lastLog.successNum++;

    saveConfig(config);
}
