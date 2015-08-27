var staySeconds = 0;

function mainLoop() {
    function next() {
        setTimeout(mainLoop, 1000);
    }

    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        var currentTab = tabs[0];
        if (currentTab == null) return next();
        if (!isNgSite(currentTab.url)) return next();

        staySeconds++;
        switch (staySeconds) {
        case 5:
            alert("あと5秒ニコニコ動画に滞在するとTwitterに報告されます");
            break;
        case 10:
            chrome.tabs.update(currentTab.id, {url: "chrome://newtab/"});
            tweet("有言不実行！ " + new Date().toString());
            staySeconds = 0;
            break;
        }
        next();
    });
}
mainLoop();

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
