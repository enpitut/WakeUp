var stayNgSiteSeconds = 0;
var elapsedSeconds = 0;
var limitSeconds = 0;
var ALERT_TIME = 5;
var TWEET_TIME = 10;
var isTimerOn = false;

var startButtonVisible = true;
var taskTimeTextVisible = true;

function mainLoop() {
    function next() {
        setTimeout(mainLoop, 1000);
    }

    function checkElapsedTime() {
        if (elapsedSeconds >= limitSeconds) {
            tweet("@UGEN_teacher 突然のメンション失礼致します。このたび私事ながら作業が間に合いませんでした。誠に申し訳ありません。 "+ new Date().toString());
            stopTimer();
        }
    }

    if(!isTimerOn) return next();

    checkElapsedTime();
    elapsedSeconds++;
    var remainingSeconds = limitSeconds - elapsedSeconds;
    if(remainingSeconds > 60){
        chrome.browserAction.setBadgeText({"text": Math.round((remainingSeconds) / 60).toString()});
        chrome.browserAction.setBadgeBackgroundColor({color:[0, 0, 255, 100]});
    }else{
        chrome.browserAction.setBadgeText({"text": Math.round((remainingSeconds)).toString()});
        chrome.browserAction.setBadgeBackgroundColor({color:[255, 0, 0, 100]});
        
    }

    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        var currentTab = tabs[0];
        if (currentTab == null) return next();
        if (!isNgSite(currentTab.url)) return next();

        stayNgSiteSeconds++;
        switch (stayNgSiteSeconds) {
        case ALERT_TIME:
            alert("あと" + (TWEET_TIME - ALERT_TIME) + "秒ニコニコ動画に滞在するとTwitterに報告されます " + new Date().toString());
            break;
        case TWEET_TIME:
            chrome.tabs.update(currentTab.id, {url: "chrome://newtab/"});
            tweet("サボりました！有言不実行！！ " + new Date().toString());
            stayNgSiteSeconds = 0;
            break;
        }
        next();
    });
}

function setTimer(arg) {
    isTimerOn = true;
    limitSeconds = arg;
}

function stopTimer() {
    isTimerOn = false;
    elapsedSeconds = 0;
    chrome.browserAction.setBadgeText({"text": ""})
}

function isNgSite(url) {
    if (url.match(/^https?:\/\/[^/]+\.nicovideo\.jp\//)) return true;
    return false;
}

function tweet(str){
    var OAUTH_CONSUMER_KEY = "mqnjswbYNsvfnwp8N3aoPs5TU";
    var OAUTH_CONSUMER_SECRET = "dbaio9YDq5S1X3cL5AceWbFgsaADOaA9B8TrRU2TnDLlYZTVLP";
    var OAUTH_ACCESS_TOKEN = "3315564288-FJpzTyav8c4STsgiJw9FTU2STSPPn7Fqh1asjMH";
    var OAUTH_ACCESS_SECRET = "trRn3vIiKNQdLee8kpl2OWRfVv6rFNVd4VD1RJo8XeRT0";

    var message = {
        method: "POST",
        action: "https://api.twitter.com/1.1/statuses/update.json",
        parameters: {
            oauth_signature_method: "HMAC-SHA1",
            oauth_consumer_key: OAUTH_CONSUMER_KEY,
            oauth_token: OAUTH_ACCESS_TOKEN,
            status: str
        }
    };
    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, {
        consumerSecret: OAUTH_CONSUMER_SECRET,
        tokenSecret: OAUTH_ACCESS_SECRET
    });
    var target = OAuth.addToURL(message.action, message.parameters);
    $.ajax({
        type: message.method,
        url: target,
        dataType: "json",
        success: function(data) {
            console.log(data);
        },
        error: function(a) {
            console.log(a.responseText);
        }
    });
};
