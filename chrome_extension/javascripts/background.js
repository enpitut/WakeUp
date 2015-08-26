var previousUrl = "chrome://newtab";
var cumulativeVisitDuration = 0;
var currentTab = {url: "chrome://newtab"};

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    currentTab = tab;
});

var timerID = setTimeout(function mainLoop() {
    clearTimeout(timerID);

    var url = currentTab.url;

    if (isNgSite(previousUrl) && isNgSite(url)) {
      cumulativeVisitDuration++;
      if (cumulativeVisitDuration == 5) {
        alert("あと5秒ニコニコ動画に滞在するとTwitterに報告されます");
      }
      if (cumulativeVisitDuration == 10) {
        tweet("有言不実行！ " + new Date().toString());
        cumulativeVisitDuration++;
      }
      if (cumulativeVisitDuration >= 10 && isNgSite(url)) {
        chrome.tabs.update(currentTab.id, {url: "chrome://newtab"});
        cumulativeVisitDuration = 0;
      }
    }
    previousUrl = url;
    timerID = setTimeout(mainLoop, 1000);
}, 0);

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
