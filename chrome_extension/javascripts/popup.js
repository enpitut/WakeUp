var bg = chrome.extension.getBackgroundPage();

$(function () {
    $("#start_button").click(function () {
        var time = Number($("#task_time_text").val()) * 60;
        if(time < 0) return false;
        chrome.browserAction.setIcon({path: "../images/watchicon16.png"});
        bg.startTimer(time);
    });
    $("#end_button").click(function () {
        chrome.browserAction.setIcon({path: "../images/icon16.png"});
        if(bg.isTimerOn){
            var message = Math.round(bg.limitSeconds / 60).toString() + "分かかると見積もった作業を" + Math.round(bg.elapsedSeconds / 60).toString() + "分で終えました!" + new Date().toString();
            bg.tweet(message, function(){ bg.alert("tweetしたよ^_^");});
            bg.searchTweets("UGEN", function (rank) { bg.alert("あなたは" + rank + "位です！");});
        }
        bg.stopTimer();
    });
});
