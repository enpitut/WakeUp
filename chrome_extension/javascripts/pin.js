"use strict";

let queryMap = OAuth.getParameterMap(location.search.replace(/\?/, ""));
chrome.tabs.create({
    windowId: parseInt(queryMap["window_id"], 10),
    url: OAuth.addToURL("http://twitter.com/oauth/authorize", {
        oauth_token: queryMap["oauth_token"]
    })
});

$(() => {
    $("#pin_button").click(co.wrap(function* () {
        try {
            let accessTokenMap = yield callTwitterApi("POST", "https://api.twitter.com/oauth/access_token", {
                oauth_verifier: $("#pin_text").val()
            }, {
                token: queryMap["oauth_token"],
                tokenSecret: queryMap["oauth_token_secret"],
            });
            localStorage.setItem("accessToken", accessTokenMap["oauth_token"]);
            localStorage.setItem("accessTokenSecret", accessTokenMap["oauth_token_secret"]);
            $("body > p").text("Twitter連携の設定が完了しました。");
            yield sleep(2);
            close();
        } catch (e) {
            alert(e.message);
        }
    }));
});
