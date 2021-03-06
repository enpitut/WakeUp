"use strict";

$(() => {
    let bg = chrome.extension.getBackgroundPage();
    
    function refreshPageContent() {
        $("#start_button").parent().css("display", "none");
        $("#loop_button").parent().css("display", "none");
        $("#restart_button").parent().css("display", "none");
        $("#end_button").parent().css("display", "none");
        $({
            off: loadConfig().showLoopButton ? "#loop_button" : "#start_button",
            pause: "#restart_button",
            on: "#end_button",
        }[bg.timerState]).parent().css("display", "block");

        $("#guide_message").text({
            off: "ボタンを押すと監視がはじまるよ！",
            pause: "ボタンを押すと監視を再開するよ！",
            on: "監視中",
        }[bg.timerState]);
        
        $("#periodically_time_select").css("background-color", "lightgray");
        $("#loop_periodically_time_select").css("background-color", "lightgray");

        $("#idling_image").css("display", "none");
        $("#resting_image").css("display", "none");
        $("#running_image").css("display", "none");
        $({
            off: "#idling_image",
            pause: "#resting_image",
            on: "#running_image",
        }[bg.timerState]).css("display", "block");
       
        if (loadConfig().authInfo === null) {
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
            $("#task_description_text").css("color", "#555555");
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
    
    $("#periodically_time_checkbox").click(() => {
        if($("#periodically_time_checkbox").prop("checked")){
            $("#periodically_time_select")
            .css("background-color", "transparent")
            .prop("disabled", false);
        }else{
            $("#periodically_time_select")
            .css("background-color", "lightgray")
            .prop("disabled", true);
        }
    });
    
    $("#loop_periodically_time_checkbox").click(() => {
        if($("#loop_periodically_time_checkbox").prop("checked")){
            $("#loop_periodically_time_select")
            .css("background-color", "transparent")
            .prop("disabled", false);
        }else{
            $("#loop_periodically_time_select")
            .css("background-color", "lightgray")
            .prop("disabled", true);
        }
    });

    $("#start_button").click(() => {
        let time = Math.floor(Number($("#task_time_text").val()) * 60);
        let periodicallyAlertTimes = Math.floor(Number($("#periodically_time_select").val()) * 60);
        if(!$("#periodically_time_checkbox").prop("checked"))periodicallyAlertTimes = Infinity;
        if(isNaN(time) || time < 0) return false;
        bg.startTimer(time, isEmptyDescription ? "" : $("#task_description_text").val(), periodicallyAlertTimes);
        refreshPageContent();
    });
    
    $("#loop_button").click(() => {
        let restTime = Math.floor(Number($("#rest_loop_time_text").val()) * 60);
        let taskTime = Math.floor(Number($("#task_loop_time_text").val()) * 60);
        let loopCount = Math.floor(Number($("#loop_time_text").val()));
        let periodicallyAlertTimes = Math.floor(Number($("#loop_periodically_time_select").val()) * 60);
        if(!$("#loop_periodically_time_checkbox").prop("checked"))periodicallyAlertTimes = Infinity;
        if (isNaN(restTime) || restTime < 0) return false;
        if (isNaN(taskTime) || taskTime < 0) return false;
        if (isNaN(loopCount) || loopCount < 0) return false;
        bg.loopTimer(taskTime,restTime,loopCount,isEmptyDescription ? "" : $("#task_loop_description_text").val(), periodicallyAlertTimes);
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
        let now = new Date();
        let message = generateTweet(
            element => sprintf(TWEET_PHRASES.SUCCESSED, {taskDescription: element, estimatedMinutes: Math.round(bg.limitSeconds / 60), actualMinutes: Math.round(bg.elapsedSeconds / 60), date: now}),
            {
                element: bg.taskDescription,
                formatter(element, upperLimitLength, getShortenedString) {
                    if (element == "") return "作業";
                    if (element.length + 2 <= upperLimitLength) return `「${element}」`;
                    return `「${getShortenedString(5)}...」`;
                }
            }
        );
        if (loadConfig().postAutomatically.successed || bg.confirmTweet(message, true)) {
            bg.tweet(message).then(() => { bg.notificate("tweetしたよ^_^", 5); }).catch(e => { bg.alert(e.message); });
        }
        bg.saveTaskLog(true);
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
    
    $("#goto_tasklog").click(() => {
        let taskLogUrl = chrome.extension.getURL("task_log.html");
        open(taskLogUrl);
    });
    
    $("#oauth_button").click(onOAuthButtonClickHandler);
    refreshPageContent();
});
