var stayNgSiteSeconds = 0;
var elapsedSeconds = -1;
var limitSeconds = 0;
var ALERT_TIME = 5;
var TWEET_TIME = 10;
var isTimerOn = false;
var startButtonVisible = true;
var taskTimeTextVisible = true;

var timerId;
function mainLoop() {
    function next() {
        timerId = setTimeout(mainLoop, 1000);
    }

    elapsedSeconds++;
    var remainingSeconds = limitSeconds - elapsedSeconds;
    if (remainingSeconds > 60) {
        chrome.browserAction.setBadgeText({"text": Math.round(remainingSeconds / 60).toString()});
        chrome.browserAction.setBadgeBackgroundColor({color:[0, 0, 255, 100]});
    } else {
        chrome.browserAction.setBadgeText({"text": Math.round(remainingSeconds).toString()});
        chrome.browserAction.setBadgeBackgroundColor({color:[255, 0, 0, 100]});
    }
    if (elapsedSeconds >= limitSeconds) {
        tweet("@UGEN_teacher 突然のメンション失礼致します。このたび私事ながら作業が間に合いませんでした。誠に申し訳ありません。 " + new Date().toString(),
                function(){ alert("tweetしたよ^_^"); });
        stopTimer();
        return;
    }

    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        var currentTab = tabs[0];
        if (currentTab == null) return next();
        if (!isNgSite(currentTab.url)) return next();

        stayNgSiteSeconds++;
        switch (stayNgSiteSeconds) {
        case ALERT_TIME:
            alert("あと" + (TWEET_TIME - ALERT_TIME) + "秒" + currentTab.title + "に滞在するとTwitterに報告されます");
            break;
        case TWEET_TIME:
            chrome.tabs.update(currentTab.id, {url: "chrome://newtab/"});
            tweet("サボりました！有言不実行！！ " + new Date().toString(),
                function(){ alert("tweetしたよ^_^");});
            stayNgSiteSeconds = 0;
            break;
        }
        next();
    });
}
function startTimer(arg) {
    limitSeconds = arg;
    isTimerOn = true;
    mainLoop();
}

function stopTimer() {
    elapsedSeconds = -1;
    chrome.browserAction.setBadgeText({"text": ""})
    chrome.browserAction.setIcon({path:"../images/icon16.png"});
    isTimerOn = false;
    clearTimeout(timerId);
}

if (localStorage.getItem("urlList") === null) {
    localStorage.setItem("urlList", JSON.stringify(["nicovideo.jp", "youtube.com"]));
}
function isNgSite(url) {
    var urlList = JSON.parse(localStorage.getItem("urlList"));
    for(var i = 0; i < urlList.length; i++){
        var str = urlList[i]; 
        var re = new RegExp(str.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1"));
        if (url.match(re)) return true;
    }
    return false;
}

function tweet(str, callBack){
    var message = {
        method: "POST",
        action: "https://api.twitter.com/1.1/statuses/update.json",
        parameters: {
            status: str
        }
    };
    var originalParameters = $.extend({}, message.parameters);
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
        success: function (responseJson) {
            if (callBack !== undefined) callBack();
        },
        error: function (responseObject) {
            alert("Error: " + responseObject.status + " " + responseObject.statusText + "\n" + responseObject.responseText);
        }
    });
};
