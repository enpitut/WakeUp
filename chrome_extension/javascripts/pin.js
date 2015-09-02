var queryMap = OAuth.getParameterMap(location.search.replace(/\?/, ""));
chrome.tabs.create({
    windowId: parseInt(queryMap["window_id"], 10),
    url: OAuth.addToURL("http://twitter.com/oauth/authorize", {
        oauth_token: queryMap["oauth_token"]
    })
});

$(function () {
    $("#pin_button").click(function () {
        var message = {
            method: "POST",
            action: "https://api.twitter.com/oauth/access_token",
            parameters: {
                oauth_verifier: $("#pin_text").val()
            }
        };
        OAuth.completeRequest(message, {
            consumerKey: CONSUMER_KEY,
            consumerSecret: CONSUMER_SECRET,
            token: queryMap["oauth_token"],
            tokenSecret: queryMap["oauth_token_secret"]
        });
        $.ajax({
            type: message.method,
            url: message.action,
            headers: {
                "Authorization": OAuth.getAuthorizationHeader("", message.parameters)
            },
            dataType: "text",
            success: function (responseText) {
                var accessTokenMap = OAuth.getParameterMap(responseText.replace(/\n/g, ""));
                localStorage.setItem("accessToken", accessTokenMap["oauth_token"]);
                localStorage.setItem("accessTokenSecret", accessTokenMap["oauth_token_secret"]);
                $("body > p").text("Twitter連携の設定が完了しました。");
                setTimeout(close, 2000);
            },
            error: function (responseObject) {
                $("body > p").empty()
                    .append(document.createTextNode("Error: " + responseObject.status + " " + responseObject.statusText))
                    .append(document.createElement("br"))
                    .append(document.createTextNode(responseObject.responseText));
            }
        });
    });
});
