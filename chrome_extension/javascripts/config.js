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
                return tweet(message).then(status => {
                    modifyConfig(config => {
                        config.replySetting[config.authInfo.userId].replyIdForPermissionMap[recipientId] = status["id"];
                    });
                    flushRecipients();
                    notificate(`@${screenName}にリプライを送りました`, 5);
                });
            } else {
                notificate(`@${screenName}からは既に許可を得ています`, 5);
            }
        }).catch(e => { alert(e.message); });
    });

    $("#oauth_button").click(onOAuthButtonClickHandler);

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
