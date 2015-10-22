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

    $("#start_button").click(() => {
        let time = Number($("#task_time_text").val()) * 60;
        if(isNaN(time) || time < 0) return false;
        bg.startTimer(time);
        flushButtonArea();
    });
    $("#end_button").click(() => {
        let message = `${Math.round(bg.limitSeconds / 60)}分かかると見積もった作業を${Math.round(bg.elapsedSeconds / 60) + 5}分で終えました! #UGEN ${new Date()}`;
        bg.tweet(message, () => { bg.alert("tweetしたよ^_^"); });
        bg.notifyRank();
        bg.stopTimer();
        flushButtonArea();
    });
    $("#goto_option").click(() => {
        let optionsUrl = chrome.extension.getURL("config.html");
        open(optionsUrl);
    });
    flushButtonArea();
});
