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
        function getBaseMessage(string) {
            return `${Math.round(bg.limitSeconds / 60)}分かかると見積もった${string}を${Math.round(bg.elapsedSeconds / 60)}分で終えました! #UGEN ${new Date()}`;
        }
        function getMessage(taskDescription) {
            if (taskDescription == "") return getBaseMessage("作業");
            if (taskDescription.length <= 140 - getBaseMessage("「」").length) return getBaseMessage(`「${taskDescription}」`);
            return getBaseMessage(`「${taskDescription.substring(0, 140 - getBaseMessage("「」").length - 3)}...」`);
        }
        bg.tweet(getMessage(isEmptyDescription ? "" : $("#task_description_text").val()), () => { bg.alert("tweetしたよ^_^"); });
        bg.stopTimer();
        refreshPageContent();
        $("#task_description_text").val("");
        $("#task_description_text").blur();
    });
    $("#goto_option").click(() => {
        let optionsUrl = chrome.extension.getURL("config.html");
        open(optionsUrl);
    });
    refreshPageContent();
});
