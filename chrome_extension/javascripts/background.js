"use strict";

var limitSeconds;
var elapsedSeconds;
var stayNgSiteSeconds;
var timerState = "off";
var oneMinuteNotified = false;

const ALERT_TIME = 5;
const TWEET_TIME = 10;

let timerId;

function mainLoop() {
    function next() {
        timerId = setTimeout(mainLoop, 1000);
    }

    elapsedSeconds++;
    let remainingSeconds = limitSeconds - elapsedSeconds;
    if (remainingSeconds > 60) {
        chrome.browserAction.setBadgeText({"text": Math.ceil(remainingSeconds / 60).toString()});
        chrome.browserAction.setBadgeBackgroundColor({color:[0, 0, 255, 100]});
    } else {
        if (!oneMinuteNotified){
            var options = {
                body : "",
                icon : "../images/ugenchan.png"
            }
            var notification = new Notification("あと1分でtweetされます",options);
            setTimeout(notification.close.bind(notification),2000);
            oneMinuteNotified = true;
        }
        chrome.browserAction.setBadgeText({"text": Math.round(remainingSeconds).toString()});
        chrome.browserAction.setBadgeBackgroundColor({color:[255, 0, 0, 100]});
    }
    if (elapsedSeconds >= limitSeconds) {
        tweet(`@${localStorage.getItem("replyAccount")} 突然のリプライ失礼致します。このたび私事ながら作業時間の見積もりに失敗しました。誠に申し訳ありません ${new Date()} #UGEN`,
                () => { alert("tweetしたよ^_^"); });
        stopTimer();
        return;
    }

    chrome.tabs.query({currentWindow: true, active: true}, tabs => {
        if (tabs.length == 0) return next();
        let currentTab = tabs[0];
        if (!isNgSite(currentTab.url)) return next();

        stayNgSiteSeconds++;
        switch (stayNgSiteSeconds) {
        case ALERT_TIME:
            new Notification(`あと ${TWEET_TIME - ALERT_TIME} 秒 ${currentTab.title} に滞在するとTwitterに報告されます`);
            break;
        case TWEET_TIME:
            if(localStorage.getItem("tweetTabinfo") === "True") {
                tweet(`私は作業をサボって ${currentTab.title.substr(0, 40).replace(/(@|#|＃|＠)/g, "$1\u200c")}(${currentTab.url}) を見ていました ${new Date()}`.substr(0, 135) + " #UGEN",
                    () => { alert("tweetしたよ^_^"); });
            } else {
                tweet(`私は作業をサボっていました ${new Date()} #UGEN`,
                    () => { alert("tweetしたよ^_^"); });
            }
            chrome.tabs.update(currentTab.id, {url: "chrome://newtab/"});
            stayNgSiteSeconds = 0;
            break;
        }
        next();
    });
}
function startTimer(arg) {
    if (timerState != "off") throw new Error("Illegal state.");
    limitSeconds = arg;
    elapsedSeconds = -1;
    stayNgSiteSeconds = -1;
    timerState = "on";
    chrome.browserAction.setIcon({path: "../images/watchicon16.png"});
    oneMinuteNotified = false;
    mainLoop();
}

function pauseTimer() {
    if (timerState != "on") throw new Error("Illegal state.");
    timerState = "pause";
    chrome.browserAction.setIcon({path:"../images/icon16.png"});
    clearTimeout(timerId);
}

function restartTimer() {
    if (timerState != "pause") throw new Error("Illegal state.");
    timerState = "on";
    chrome.browserAction.setIcon({path: "../images/watchicon16.png"});
    mainLoop();
}

function stopTimer() {
    if (timerState != "on") throw new Error("Illegal state.");
    timerState = "off";
    chrome.browserAction.setBadgeText({"text": ""});
    chrome.browserAction.setIcon({path:"../images/icon16.png"});
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

function tweet(str, callBack){
    let message = {
        method: "POST",
        action: "https://api.twitter.com/1.1/statuses/update.json",
        parameters: {
            status: str
        }
    };
    let originalParameters = $.extend({}, message.parameters);
    OAuth.completeRequest(message, {
        consumerKey: CONSUMER_KEY,
        consumerSecret: CONSUMER_SECRET,
        token: localStorage.getItem("accessToken"),
        tokenSecret: localStorage.getItem("accessTokenSecret")
    });
    $.ajax({
        type: message.method,
        url: message.action,
        headers: {
            "Authorization": OAuth.getAuthorizationHeader("", message.parameters)
        },
        data: OAuth.formEncode(originalParameters),
        dataType: "json",
        success: responseJson => {
            if (callBack !== undefined) callBack();
        },
        error: responseObject => {
            alert(`Error: ${responseObject.status} ${responseObject.statusText}\n${responseObject.responseText}`);
        }
    });
};

function searchTweets(str){
  return new Promise(function(resolve, reject) {
    let message = {
        method: "GET",
        action: "https://api.twitter.com/1.1/search/tweets.json",
        parameters: {
            q: str,
            count: 100
        }
    };
    let originalParameters = $.extend({}, message.parameters);
    OAuth.completeRequest(message, {
        consumerKey: CONSUMER_KEY,
        consumerSecret: CONSUMER_SECRET,
        token: localStorage.getItem("accessToken"),
        tokenSecret: localStorage.getItem("accessTokenSecret")
    });
    $.ajax({
        type: message.method,
        url: message.action,
        timeout: 30000,
        headers: {
            "Authorization": OAuth.getAuthorizationHeader("", message.parameters)
        },
        data: OAuth.formEncode(originalParameters),
        dataType: "json",
        success: responseJson => {
            resolve(responseJson);
        },
        error: responseObject => {
            alert(`Error: ${responseObject.status} ${responseObject.statusText}\n${responseObject.responseText}`);
            reject(null);
        }
    });
  });
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
          new Notification(`今日のあなたの作業時間合計は${myWorkTime}分で、${workTimeMap.size}人中${myRank}位です！`);
      });
}

function readTimeline(id){
    return new Promise(function(resolve, reject) {
        let message = {
            method: "GET",
            action: "https://api.twitter.com/1.1/statuses/user_timeline.json",
            parameters: {
                user_id: id,
                count: 1000
            }
        };
        let originalParameters = $.extend({}, message.parameters);
        OAuth.completeRequest(message, {
            consumerKey: CONSUMER_KEY,
            consumerSecret: CONSUMER_SECRET,
            token: localStorage.getItem("accessToken"),
            tokenSecret: localStorage.getItem("accessTokenSecret")
        });
        $.ajax({
            type: message.method,
            url: message.action,
            timeout: 30000,
            headers: {
                "Authorization": OAuth.getAuthorizationHeader("", message.parameters)
            },
            data: OAuth.formEncode(originalParameters),
            dataType: "json",
            success: responseJson => {
                resolve(responseJson);
            },
            error: responseObject => {
                alert(`Error: ${responseObject.status} ${responseObject.statusText}\n${responseObject.responseText}`);
                reject(null);
            }
        });
    });
}

$(() => {
    if (localStorage.getItem("urlList") === null) {
        localStorage.setItem("urlList", JSON.stringify(["nicovideo.jp", "youtube.com"]));
    }
    if (localStorage.getItem("replyAccount") === null) {
        localStorage.setItem("replyAccount", "UGEN_teacher");
    }
    if (localStorage.getItem("showRegisterNgSiteButton") === "True") {
        $("#show_register_ngsite_button_checkbox").prop("checked", true);
        createRegisterNgSiteButton();
    }
});