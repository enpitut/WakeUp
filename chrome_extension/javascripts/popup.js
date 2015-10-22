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
    }

    $("#start_button").click(() => {
        let time = Number($("#task_time_text").val()) * 60;
        if(isNaN(time) || time < 0) return false;
        bg.startTimer(time);
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
        let message = `${Math.round(bg.limitSeconds / 60)}分かかると見積もった作業を${Math.round(bg.elapsedSeconds / 60)}分で終えました! #UGEN ${new Date()}`;
        bg.tweet(message, () => { bg.alert("tweetしたよ^_^"); });
        bg.stopTimer();
        refreshPageContent();
    });
    $("#goto_option").click(() => {
        let optionsUrl = chrome.extension.getURL("config.html");
        open(optionsUrl);
    });
    refreshPageContent();
});
