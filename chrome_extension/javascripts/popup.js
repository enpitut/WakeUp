"use strict";

$(() => {
    let bg = chrome.extension.getBackgroundPage();
    function refreshPageContent() {
        $("#start_button").parent().css("display", "none");
        $("#restart_button").parent().css("display", "none");
        $("#end_button").parent().css("display", "none");
        $({
            off: "#start_button",
            pause: "#restart_button",
            on: "#end_button",
        }[bg.timerState]).parent().css("display", "block");
        $("#guide_message").text({
            off: "ボタンを押すと監視がはじまるよ！",
            pause: "ボタンを押すと監視を再開するよ！",
            on: "監視中",
        }[bg.timerState]);

        if(!getLocalStorageData("accessToken") || !getLocalStorageData("accessTokenSecret")) {
            $("#guide_message").text("Twitter連携をしてね！");
            $("#start_control").css("display", "none");
            $("#oauth_control").css("display", "block");
        } else {
            $("#start_control").css("display", "block");
            $("#oauth_control").css("display", "none");
        }
    }

    let isEmptyDescription;
    $("#task_description_text").focus(() => {
        if (isEmptyDescription) {
            $("#task_description_text").val("");
            $("#task_description_text").css("color", "#000000");
        }
    });
    $("#task_description_text").blur(() => {
        isEmptyDescription = ($("#task_description_text").val() == "");
        if (isEmptyDescription) {
            $("#task_description_text").val("（空欄でも可）");
            $("#task_description_text").css("color", "#999999");
        }
    });
    $("#task_description_text").blur();
    $("#start_button").click(() => {
        let time = Number($("#task_time_text").val()) * 60;
        if(isNaN(time) || time < 0) return false;
        bg.startTimer(time, isEmptyDescription ? "" : $("#task_description_text").val());
        refreshPageContent();
    });
    $("#pause_button").click(() => {
        bg.pauseTimer();
        refreshPageContent();
    });
    $("#restart_button").click(() => {
        bg.restartTimer();
        refreshPageContent();
    });
    $("#end_button").click(() => {
        bg.tweet(bg.generateTweet(
            element => sprintf(tweet_phrases.phrases.successed[Math.floor(Math.random() * tweet_phrases.phrases.successed.length)], Math.round(bg.limitSeconds / 60), element, Math.round(bg.elapsedSeconds / 60), new Date()),
            {
                element: bg.taskDescription,
                formatter(element, upperLimitLength, getShortenedString) {
                    if (element == "") return "作業";
                    if (element.length + 2 <= upperLimitLength) return `「${element}」`;
                    return `「${getShortenedString(5)}...」`;
                },
            }
        ), () => { bg.alert("tweetしたよ^_^"); });
        bg.notifyRank();
        bg.stopTimer();
        refreshPageContent();
        $("#task_description_text").val("");
        $("#task_description_text").blur();
    });
    $("#goto_option").click(() => {
        let optionsUrl = chrome.extension.getURL("config.html");
        open(optionsUrl);
    });
    $("#oauth_button").click(onOAuthButtonClickHandler);
    refreshPageContent();
});
