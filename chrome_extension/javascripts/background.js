"use strict";

var limitSeconds;
var elapsedSeconds;
var stayNgSiteSeconds;
var taskDescription;
var timerState = "off";
var oneMinuteNotified = false;
var saboriNum = 0;

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
            notificate("あと1分でtweetされます", 2);
            oneMinuteNotified = true;
        }
        chrome.browserAction.setBadgeText({"text": Math.round(remainingSeconds).toString()});
        chrome.browserAction.setBadgeBackgroundColor({color:[255, 0, 0, 100]});
    }
    if (elapsedSeconds >= limitSeconds) {
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
        stopTimer();
        saveTaskLog(false);
        return;
    }

    chrome.tabs.query({currentWindow: true, active: true}, tabs => {
        if (tabs.length == 0) return next();
        let currentTab = tabs[0];
        if (!isNgSite(currentTab.url)) return next();

        stayNgSiteSeconds++;
        switch (stayNgSiteSeconds) {
        case ALERT_TIME:
            notificate(`あと ${TWEET_TIME - ALERT_TIME} 秒 ${currentTab.title} に滞在するとTwitterに報告されます`, 2);
            break;
        case TWEET_TIME:
            saboriNum++;
            if(localStorage.getItem("tweetTabinfo") === "True") {
                tweet(generateTweet(
                    (element1, element2) => `私は${element1}をサボって ${element2}( ${currentTab.url} ) を見ていました ${new Date()} #UGEN`,
                    {
                        element: taskDescription,
                        formatter(element, upperLimitLength, getShortenedString) {
                            if (element == "") return "作業";
                            if (element.length + 2 <= upperLimitLength) return `「${element}」`;
                            return `「${getShortenedString(5)}...」`;
                        },
                    },
                    {
                        element: currentTab.title,
                        formatter(element, upperLimitLength, getShortenedString) {
                            if (element.length <= upperLimitLength) return element;
                            else return `${getShortenedString(3)}...`;
                        },
                    }
                ), () => { alert("tweetしたよ^_^"); });
            } else {
                tweet(generateTweet(
                    element => `私は${element}をサボっていました ${new Date()} #UGEN`,
                    {
                        element: taskDescription,
                        formatter(element, upperLimitLength, getShortenedString) {
                            if (element == "") return "作業";
                            if (element.length + 2 <= upperLimitLength) return `「${element}」`;
                            return `「${getShortenedString(5)}...」`;
                        },
                    }
                ), () => { alert("tweetしたよ^_^"); });
            }
            chrome.tabs.update(currentTab.id, {url: "chrome://newtab/"});
            stayNgSiteSeconds = 0;
            break;
        }
        next();
    });
}
function startTimer(limitSecondsAsParameter, taskDescriptionAsParameter) {
    if (timerState != "off") throw new Error("Illegal state.");
    limitSeconds = limitSecondsAsParameter;
    elapsedSeconds = -1;
    stayNgSiteSeconds = -1;
    taskDescription = taskDescriptionAsParameter;
    timerState = "on";
    chrome.browserAction.setIcon({path: "../images/watchicon16.png"});
    oneMinuteNotified = false;
    saboriNum = 0;
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

// 1個以上の文字数が不明な文字列を用いて140文字以内のツイートを作る、という問題の解決を助ける関数
function generateTweet(baseMessageGenerator) {
    let elementHolders = Array.from(arguments).slice(1);
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
    if (localStorage.getItem("taskLog") === null) {
        localStorage.setItem("taskLog", JSON.stringify([{ date: new Date().toDateString() , workMinutes: 0, taskNum: 0, saboriNum: 0, successNum: 0}]));
    }
});

function saveTaskLog(isSuccess) {
    let taskLog = JSON.parse(localStorage.getItem("taskLog"));
    let lastLog = taskLog[taskLog.length-1];
    
    let today = new Date();
    let workMinutes = Math.floor(elapsedSeconds / 60);
    let taskNum = 1;
    let successNum = (isSuccess == true) ? 1 : 0;
    
    if(new Date(lastLog.date).toDateString() == today.toDateString()){
        workMinutes += lastLog.workMinutes;
        taskNum += lastLog.taskNum;
        saboriNum += lastLog.saboriNum;
        if(isSuccess == true)successNum += lastLog.successNum;
        taskLog[taskLog.length-1] = { date: today.toString(), workMinutes: workMinutes, taskNum: taskNum, saboriNum: saboriNum, successNum: successNum};
    } else {
        taskLog.push({ date: today.toString(), workMinutes: workMinutes, taskNum: taskNum, saboriNum: saboriNum, successNum: successNum});
    }
    localStorage.setItem("taskLog", JSON.stringify(taskLog));
}
