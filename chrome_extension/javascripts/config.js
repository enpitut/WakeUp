"use strict";

$(() => {
    function addRow(targetUrl) {
        let tr = $('<tr><td class="col-lg-4"></td><td><input type="button" value="×" class="btn btn-danger"></td></tr>');
        tr.children(":first").text(targetUrl);
        tr.find("input").click(() => {
            tr.remove();
            modifyConfig(config => {
                config.urlList.splice(config.urlList.findIndex(url => url == targetUrl), 1);
            });
        });
        $("#url_list > tbody").append(tr);
    }
    for (let url of loadConfig().urlList) {
        addRow(url);
    }
    $("#add_url_button").click(() => {
        modifyConfig(config => {
            config.urlList.push($("#add_url_text").val());
        });
        addRow($("#add_url_text").val());
        $("#add_url_text").val("");
    });

    function flushCurrentRecipient() {
        let recipientId = loadConfig().replySetting[loadConfig().authInfo.userId].recipientId;
        (recipientId === null ? Promise.resolve("無し") : getScreenName(recipientId)).then(screenName => {
            $("#current_recipient").text(`現在の宛先: ${screenName}`);
        });
    }
    function flushRecipients() {
        let myReplySetting = loadConfig().replySetting[loadConfig().authInfo.userId];
        $("#modify_recipient_select").empty();
        $("#modify_recipient_select").append($('<option value="null">無し</option>'));
        Promise.all([].concat(
            myReplySetting.recipientIds.map(recipientId =>
                getScreenName(recipientId).then(screenName =>
                    Promise.resolve($(document.createElement("option")).attr("value", recipientId).text(screenName))
                )
            ),
            Object.keys(myReplySetting.replyIdForPermissionMap).map(str => parseInt(str, 10)).map(recipientId =>
                getScreenName(recipientId).then(screenName =>
                    Promise.resolve($(document.createElement("option")).attr("value", recipientId).prop("disabled", true).text(`${screenName}（許可待ち）`))
                )
            )
        )).then(options => {
            options.sort((x, y) => x.text() < y.text() ? 1 : -1);
            for (let option of options) {
                $("#modify_recipient_select").append(option);
            }
            $("#modify_recipient_select").val(String(myReplySetting.recipientId));
        });
    }
    flushCurrentRecipient();
    getMentions().then(statuses => {
        let config = loadConfig();
        let myReplySetting = config.replySetting[config.authInfo.userId];

        let replyIdToRecipientId = {};
        for (let recipientId of Object.keys(myReplySetting.replyIdForPermissionMap).map(str => parseInt(str, 10))) {
            let replyId = myReplySetting.replyIdForPermissionMap[recipientId];
            replyIdToRecipientId[replyId] = recipientId;
        }

        for (let status of statuses) {
            if (replyIdToRecipientId.hasOwnProperty(status["in_reply_to_status_id"]) && replyIdToRecipientId[status["in_reply_to_status_id"]] == status["user"]["id"]) {
                let recipientId = replyIdToRecipientId[status["in_reply_to_status_id"]];
                delete myReplySetting.replyIdForPermissionMap[recipientId];
                myReplySetting.recipientIds.push(recipientId);
                getScreenName(recipientId).then(screenName => {
                    notificate(`@${screenName}からリプライの許可が下りました`, 5);
                });
            }
        }

        saveConfig(config);
    }).catch(() => Promise.resolve()).then(flushRecipients);
    $("#modify_recipient_button").click(() => {
        modifyConfig(config => {
            config.replySetting[config.authInfo.userId].recipientId = ($("#modify_recipient_select").val() == "null" ? null : parseInt($("#modify_recipient_select").val(), 10));
        });
        flushCurrentRecipient();
    });

    $("#new_recipient_text").on("keydown", () => {
        setTimeout(() => {
            $("#new_recipient_button").prop("disabled", $("#new_recipient_text").val() == "");
            $("#new_recipient").text($("#new_recipient_text").val());
            $("#permission_message").text(sprintf(TWEET_PHRASES.GET_PERMISSION, {recipient: $("#new_recipient_text").val()}));
        }, 0);
    });
    $("#new_recipient_text").trigger("keydown");
    $("#new_recipient_button").click(() => {
        let screenName = $("#new_recipient_text").val();
        $("#new_recipient_text").val("");
        $("#new_recipient_text").trigger("keydown");
        getUserId(screenName).then(recipientId => {
            if (loadConfig().replySetting[loadConfig().authInfo.userId].recipientIds.indexOf(recipientId) == -1) {
                let message = sprintf(TWEET_PHRASES.GET_PERMISSION, {recipient: screenName});
                if (confirmTweet(message, false)) {
                    return tweet(message).then(status => {
                        modifyConfig(config => {
                            config.replySetting[config.authInfo.userId].replyIdForPermissionMap[recipientId] = status["id"];
                        });
                        flushRecipients();
                        notificate(`@${screenName}にリプライを送りました`, 5);
                    });
                }
            } else {
                notificate(`@${screenName}からは既に許可を得ています`, 5);
            }
        }).catch(e => { alert(e.message); });
    });

    if (loadConfig().authInfo !== null) {
        getUser(loadConfig().authInfo.userId).then(user => {
            $("#authenticated_user_profile_image").attr("src", user["profile_image_url_https"]);
            $("#authenticated_user_name").text(user["name"]);
            $("#authenticated_user_screen_name").text(user["screen_name"]);
            $("#authenticated_user_twitter_link").attr("href", `https://twitter.com/${user["screen_name"]}`);
        }).catch(() => {
            $("#authenticated_user div[class='panel-body']").text("エラーにより表示できませんでした");
        });
    } else {
        $("#authenticated_user").css("display", "none");
    }
    $("#oauth_button").click(onOAuthButtonClickHandler);

    $("#post_automatically_checkbox_group input").each(function () {
        let joinedPropertyNames = $(this).data("property");
        let propertyNames = joinedPropertyNames.split(/\./);
        $(this).prop("checked", getValue(loadConfig().postAutomatically, ...propertyNames));
        $(this).change(() => {
            let newValue = $(this).is(":checked");
            modifyConfig(config => {
                setValue(config.postAutomatically, ...propertyNames, newValue);
            });
        });
        $(this).next(".show_tweet_example").on("mouseover", () => {
            $("#tweet_example").css("display", "block");
            $("#tweet_example").text({
                "watchedNgSites.withTabInfo": sprintf(TWEET_PHRASES.WATCHED_NG_SITES.WITH_TAB_INFO, {taskDescription: "「打ち合わせ資料作成」", siteName: "niconico", siteUrl: "http://www.nicovideo.jp/", date: new Date()}),
                "watchedNgSites.withoutTabInfo": sprintf(TWEET_PHRASES.WATCHED_NG_SITES.WITHOUT_TAB_INFO, {taskDescription: "「打ち合わせ資料作成」", date: new Date()}),
                "failed.withRecipient": sprintf(TWEET_PHRASES.FAILED.WITH_RECIPIENT, {recipient: "UGEN_teacher", taskDescription: "「打ち合わせ資料作成」の作業", date: new Date()}),
                "failed.withoutRecipient": sprintf(TWEET_PHRASES.FAILED.WITHOUT_RECIPIENT, {taskDescription: "「打ち合わせ資料作成」の作業", date: new Date()}),
                "successed": sprintf(TWEET_PHRASES.SUCCESSED, {taskDescription: "「打ち合わせ資料作成」", estimatedMinutes: 60, actualMinutes: 45, date: new Date()})
            }[joinedPropertyNames]);
        });
        $(this).next(".show_tweet_example").on("mousemove", e => {
            $("#tweet_example").css("left", `${e.pageX + 10}px`);
            $("#tweet_example").css("top", `${e.pageY - 20}px`);
        });
        $(this).next(".show_tweet_example").on("mouseout", () => {
            $("#tweet_example").css("display", "none");
        });
    });

    $("#tweet_tab_info_checkbox").prop("checked", loadConfig().tweetTabInfo);
    $("#tweet_tab_info_checkbox").change(function () {
        let newValue = $(this).is(":checked");
        modifyConfig(config => {
            config.tweetTabInfo = newValue;
        });
    });

    $("#show_register_ngsite_button_checkbox").prop("checked", loadConfig().showRegisterNgSiteButton);
    $("#show_register_ngsite_button_checkbox").change(function () {
        let newValue = $(this).is(":checked");
        modifyConfig(config => {
            config.showRegisterNgSiteButton = newValue;
        });
        if (newValue) {
            createRegisterNgSiteButton();
        } else {
            chrome.contextMenus.removeAll();
        }
    });
});
