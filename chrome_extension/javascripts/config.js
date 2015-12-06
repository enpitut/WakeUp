"use strict";

$(() => {
    function addRow(targetUrl) {
        let tr = $('<tr><td class="col-lg-4"></td><td><input type="button" value="×" class="btn btn-danger"></td></tr>');
        tr.children(":first").text(targetUrl);
        tr.find("input").click(() => {
            tr.remove();
            let urlList = JSON.parse(localStorage.getItem("urlList"));
            urlList.splice(urlList.findIndex(url => url == targetUrl), 1);
            localStorage.setItem("urlList", JSON.stringify(urlList));
        });
        $("#url_list > tbody").append(tr);
    }
    for (let url of JSON.parse(localStorage.getItem("urlList"))) {
        addRow(url);
    }
    $("#add_url_button").click(() => {
        let urlList = JSON.parse(localStorage.getItem("urlList"));
        urlList.push($("#add_url_text").val());
        localStorage.setItem("urlList", JSON.stringify(urlList));
        addRow($("#add_url_text").val());
        $("#add_url_text").val("http://");
    });

    function flushReplyAccount() {
        let replyAccountId = JSON.parse(localStorage.getItem("replySetting"))[localStorage.getItem("userId")].replyAccountId;
        (replyAccountId == -1 ? Promise.resolve("無し") : getScreenName(replyAccountId)).then(screenName => {
            $("#account").text(`現在の宛先: ${screenName}`);
        });
    }
    function flushReplyAccounts() {
        let myReplySetting = JSON.parse(localStorage.getItem("replySetting"))[localStorage.getItem("userId")];
        $("#modify_account_select").empty();
        $("#modify_account_select").append($('<option value="-1">無し</option>'));
        Promise.all([].concat(
            myReplySetting.replyAccountIds.map(replyAccountId =>
                getScreenName(replyAccountId).then(screenName =>
                    Promise.resolve($(document.createElement("option")).attr("value", replyAccountId).text(screenName))
                )
            ),
            Object.keys(myReplySetting.replyIdForPermissionMap).map(replyAccountId =>
                getScreenName(replyAccountId).then(screenName =>
                    Promise.resolve($(document.createElement("option")).attr("value", replyAccountId).prop("disabled", true).text(`${screenName}（許可待ち）`))
                )
            )
        )).then(options => {
            options.sort((x, y) => x.text() < y.text() ? 1 : -1);
            for (let option of options) {
                $("#modify_account_select").append(option);
            }
            $("#modify_account_select").val(myReplySetting.replyAccountId);
        });
    }
    flushReplyAccount();
    getMentions().then(statuses => {
        let replySetting = JSON.parse(localStorage.getItem("replySetting"));
        let myReplySetting = replySetting[localStorage.getItem("userId")];

        let replyIdToUserId = {};
        for (let userId of Object.keys(myReplySetting.replyIdForPermissionMap).map(str => parseInt(str, 10))) {
            let replyId = myReplySetting.replyIdForPermissionMap[userId];
            replyIdToUserId[replyId] = userId;
        }

        for (let status of statuses) {
            if (replyIdToUserId.hasOwnProperty(status["in_reply_to_status_id"]) && replyIdToUserId[status["in_reply_to_status_id"]] == status["user"]["id"]) {
                let userId = replyIdToUserId[status["in_reply_to_status_id"]];
                delete myReplySetting.replyIdForPermissionMap[userId];
                myReplySetting.replyAccountIds.push(userId);
                getScreenName(userId).then(screenName => {
                    notificate(`@${screenName}からリプライの許可が下りました`, 5);
                });
            }
        }

        localStorage.setItem("replySetting", JSON.stringify(replySetting));
    }).catch(() => Promise.resolve()).then(flushReplyAccounts);
    $("#modify_account_button").click(() => {
        let replySetting = JSON.parse(localStorage.getItem("replySetting"));
        replySetting[localStorage.getItem("userId")].replyAccountId = parseInt($("#modify_account_select").val(), 10);
        localStorage.setItem("replySetting", JSON.stringify(replySetting));
        flushReplyAccount();
    });

    $("#new_account_text").on("keydown", () => {
        setTimeout(() => {
            $("#new_account_button").prop("disabled", $("#new_account_text").val() == "");
            $("#permission_message_destination").text($("#new_account_text").val());
            $("#permission_message").text(sprintf(TWEET_PHRASES.GET_PERMISSION, {recipient: $("#new_account_text").val()}));
        }, 0);
    });
    $("#new_account_text").trigger("keydown");
    $("#new_account_button").click(() => {
        let screenName = $("#new_account_text").val();
        $("#new_account_text").val("");
        $("#new_account_text").trigger("keydown");
        getUserId(screenName).then(userId => {
            if (JSON.parse(localStorage.getItem("replySetting"))[localStorage.getItem("userId")].replyAccountIds.indexOf(userId) > -1) {
                notificate(`@${screenName}からは既に許可を得ています`, 5);
            } else {
                return tweet(sprintf(TWEET_PHRASES.GET_PERMISSION, {recipient: screenName})).then(status => {
                    let replySetting = JSON.parse(localStorage.getItem("replySetting"));
                    replySetting[localStorage.getItem("userId")].replyIdForPermissionMap[userId] = status["id"];
                    localStorage.setItem("replySetting", JSON.stringify(replySetting));
                    flushReplyAccounts();
                    notificate(`@${screenName}にリプライを送りました`, 5);
                });
            }
        }).catch(e => { alert(e.message); });
    });

    $("#oauth_button").click(onOAuthButtonClickHandler);

    $("#tweet_tab_info_checkbox").change(function () {
        if ($(this).is(":checked")) {
            localStorage.setItem("tweetTabInfo", "True");
        } else {
            localStorage.setItem("tweetTabInfo", "False");
        }
    });
    if (localStorage.getItem("tweetTabInfo") === "True") {
        $("#tweet_tab_info_checkbox").prop("checked", true);
    }
    
    $("#show_register_ngsite_button_checkbox").change(function () {
        if ($(this).is(":checked")) {
            localStorage.setItem("showRegisterNgSiteButton", "True");
            createRegisterNgSiteButton();
        } else {
            localStorage.setItem("showRegisterNgSiteButton", "False");
            chrome.contextMenus.removeAll();
        }
    });
    if (localStorage.getItem("showRegisterNgSiteButton") === "True") {
        $("#show_register_ngsite_button_checkbox").prop("checked", true);
    }
});
