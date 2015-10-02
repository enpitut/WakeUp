"use strict";

function listNgSites() {
    $("#url_list").empty();
    for (let url of JSON.parse(localStorage.getItem("urlList"))) {
        $("#url_list").append($(document.createElement("li")).text(url));
    }
}

function flushReplyAccount() {
    $("#account").text(`現在の宛先: ${localStorage.getItem("replyAccount")}`);
}

$(() => {
    $("#add_url_button").click(() => {
        let urlList = JSON.parse(localStorage.getItem("urlList"));
        urlList.push($("#add_url_text").val());
        localStorage.setItem("urlList", JSON.stringify(urlList));
        listNgSites();
        $("#add_url_text").val("http://");
    });
    listNgSites();

    $("#modify_account_text").val(localStorage.getItem("replyAccount"));
    flushReplyAccount();
    $("#modify_account_button").click(() => {
        localStorage.setItem("replyAccount", $("#modify_account_text").val());
        flushReplyAccount();
    });

    $("#oauth_button").click(() => {
        let message = {
            method: "POST",
            action: "https://api.twitter.com/oauth/request_token",
            parameters: {
                oauth_callback: "oob"
            }
        };
        OAuth.completeRequest(message, {
            consumerKey: CONSUMER_KEY,
            consumerSecret: CONSUMER_SECRET
        });
        $.ajax({
            type: message.method,
            url: message.action,
            headers: {
                "Authorization": OAuth.getAuthorizationHeader("", message.parameters)
            },
            dataType: "text",
            success: responseText => {
                chrome.tabs.query({currentWindow: true, active: true}, tabs => {
                    let currentTab = tabs[0];
                    let queryMap = OAuth.getParameterMap(responseText);
                    queryMap["window_id"] = currentTab.windowId.toString();
                    open(OAuth.addToURL("pin.html", queryMap), "", "width=300, height=100");
                });
            },
            error: responseObject => {
                alert(`Error: ${responseObject.status} ${responseObject.statusText}\n${responseObject.responseText}`);
            }
        });
    });

    $("#tweet_tabinfo_checkbox").change(function () {
        if ($(this).is(":checked")) {
            localStorage.setItem("tweetTabinfo", "True");
        } else {
            localStorage.setItem("tweetTabinfo", "False");
        }
    });
    if (localStorage.getItem("tweetTabinfo") === "True") {
        $("#tweet_tabinfo_checkbox").prop("checked", true);
    }
});
