var stayNgSiteSeconds = 0;
var elapsedSeconds = 0;
var ALERT_TIME = 5;
var TWEET_TIME = 10;
var isTimerEnabled = false;

var startButtonVisible = true;
var taskTimeTextVisible = true;

function mainLoop() {
    function next() {
        setTimeout(mainLoop, 1000);
    }

    elapsedSeconds++;
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        var currentTab = tabs[0];
        if (currentTab == null) return next();
        if (!isNgSite(currentTab.url)) return next();

        stayNgSiteSeconds++;
        switch (stayNgSiteSeconds) {
        case ALERT_TIME:
            alert("あと" + (TWEET_TIME - ALERT_TIME) + "秒ニコニコ動画に滞在するとTwitterに報告されます");
            break;
        case TWEET_TIME:
            chrome.tabs.update(currentTab.id, {url: "chrome://newtab/"});
            tweet("有言不実行！ " + new Date().toString());
            stayNgSiteSeconds = 0;
            break;
        }
        if(isTimerEnabled) next();
    });
}

function setTimer() {
    isTimerEnabled = true;
}

function stopTimer() {
    if (isTimerEnabled) {
        tweet("タスク完了しました！！有限実行！！！本物の男！！！！ #UGEN");
    }
    isTimerEnabled = false;
    elapsedSeconds = 0;
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
