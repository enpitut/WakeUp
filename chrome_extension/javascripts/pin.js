"use strict";

$(() => {
    let queryMap = OAuth.getParameterMap(location.search.replace(/\?/, ""));
    chrome.tabs.create({
        windowId: parseInt(queryMap["window_id"], 10),
        url: OAuth.addToURL("http://twitter.com/oauth/authorize", {
            oauth_token: queryMap["oauth_token"]
        })
    });

    $("#pin_button").click(() => {
        callTwitterApi("POST", "https://api.twitter.com/oauth/access_token", {
            oauth_verifier: $("#pin_text").val()
        }, {
            token: queryMap["oauth_token"],
            tokenSecret: queryMap["oauth_token_secret"]
        }).then(accessTokenMap => {
            localStorage.setItem("accessToken", accessTokenMap["oauth_token"]);
            localStorage.setItem("accessTokenSecret", accessTokenMap["oauth_token_secret"]);
            localStorage.setItem("userId", accessTokenMap["user_id"]);
            let replySetting = JSON.parse(localStorage.getItem("replySetting"));
            if (!replySetting.hasOwnProperty(accessTokenMap["user_id"])) {
                replySetting[accessTokenMap["user_id"]] = {
                    replyAccountId: -1,
                    replyAccountIds: [],
                    replyIdForPermissionMap: {}
                };
                localStorage.setItem("replySetting", JSON.stringify(replySetting));
            }
            $("body > p").text("Twitter連携の設定が完了しました。");
            setTimeout(close, 2000);
        }).catch(e => {
            $("body > p").empty();
            e.message.split(/\n/g).forEach(line => {
                $("body > p").append(document.createTextNode(line));
                $("body > p").append(document.createElement("br"));
            });
        });
    });
});
