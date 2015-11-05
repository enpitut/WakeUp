"use strict";

$(() => {
    let bg = chrome.extension.getBackgroundPage();
    function flushButtonArea() {
        if (bg.isTimerOn) {
            $("#start_button").parent().css("display", "none");
            $("#end_button").parent().css("display", "block");
        } else {
            $("#start_button").parent().css("display", "block");
            $("#end_button").parent().css("display", "none");
        }
    }
    function refreshGuideMessage() {
        if (bg.isTimerOn) {
            $("#guide_message").text("監視中");
        } else {
            $("#guide_message").text("ボタンを押すと監視がはじまるよ！");
        }
    }

    $("#start_button").click(() => {
        let time = Number($("#task_time_text").val()) * 60;
        if(isNaN(time) || time < 0) return false;
        flushButtonArea();
    });

    $("#loop_button").click(function () {
	    var bg = chrome.extension.getBackgroundPage();
        var taskTime = Number($("#task_time_text").val()) * 60;
        var restTime = Number($("#rest_time_text").val()) * 60 * 1000;
        var loopCount = Number($("#loop_count_text").val());
        if(isNaN(taskTime) || taskTime < 0) return false;
		loopTimer(taskTime,restTime,loopCount,true);
        flushButtonArea();
        refreshGuideMessage();
    });


    $("#end_button").click(() => {
        let message = `${Math.round(bg.limitSeconds / 60)}分かかると見積もった作業を${Math.round(bg.elapsedSeconds / 60)}分で終えました! #UGEN ${new Date()}`;
        bg.tweet(message, () => { bg.alert("tweetしたよ^_^"); });
        bg.stopTimer();
        flushButtonArea();
        refreshGuideMessage();
    });
    $("#goto_option").click(() => {
        let optionsUrl = chrome.extension.getURL("config.html");
        open(optionsUrl);
    });
    flushButtonArea();
    refreshGuideMessage();
});
