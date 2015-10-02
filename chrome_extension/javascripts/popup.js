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
<<<<<<< HEAD
    $("#end_button").click(function () {
        chrome.browserAction.setIcon({path: "../images/icon16.png"});
        if(bg.isTimerOn){
            var message = Math.round(bg.limitSeconds / 60).toString() + "分かかると見積もった作業を" + Math.round(bg.elapsedSeconds / 60).toString() + "分で終えました!" + new Date().toString();
            bg.tweet(message, function(){ bg.alert("tweetしたよ^_^");});
        }
        bg.showRank();
=======
    $("#end_button").click(() => {
        let message = `${Math.round(bg.limitSeconds / 60)}分かかると見積もった作業を${Math.round(bg.elapsedSeconds / 60)}分で終えました! #UGEN ${new Date()}`;
        bg.tweet(message, () => { bg.alert("tweetしたよ^_^"); });
>>>>>>> master
        bg.stopTimer();
        flushButtonArea();
    });
    flushButtonArea();
});
