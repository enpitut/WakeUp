var bg = chrome.extension.getBackgroundPage();

/*監視関係UI設定*/
var form = document.createElement("form");

var taskTimeText = document.createElement("input");
$(taskTimeText).val("10").attr("type","text").attr("id","tasktimetext");

var minutesText = document.createTextNode("分");
$(form).append(taskTimeText).append(minutesText).append($("<br>"));

var startButton = document.createElement("input");
$(startButton).val("監視スタート").attr("type","button").attr("id","startbutton").bind("click",callBackGround);
$(form).append(startButton);

var endButton = document.createElement("input");
$(endButton).val("タスク完了").attr("type","button").attr("id","endbutton").bind("click",stopTimer);
$(form).append(endButton);

document.body.appendChild(form);

/*ブロックリストの追加*/
var addUrlForm = document.createElement("form");

var addUrlText = document.createElement("input");
$(addUrlText).val("http://www.xxx.com").attr("type","text").attr("id","addurltext");
$(addUrlForm).append(addUrlText);

var addUrlButton = document.createElement("input");
$(addUrlButton).val("ブロックサイト追加").attr("type","button").attr("id","addUrlbutton").bind("click",addUrlList);
$(addUrlForm).append(addUrlButton);

document.body.appendChild(addUrlForm);



window.onload = function(){
    //alert("popup.htmlのonloadです！");
};

function callBackGround(){
    var time = Number(taskTimeText.value) * 60;
    console.log(time);
    if(time < 0) return false;
    chrome.browserAction.setIcon({path:"../images/watchicon16.png"});
    bg.setTimer(time);
    bg.mainLoop();
}

function stopTimer(){
    chrome.browserAction.setIcon({path:"../images/icon16.png"});
    if(bg.isTimerOn){
        var message =  Math.round(bg.limitSeconds / 60).toString() + "分かかると見積もった作業を" + Math.round(bg.elapsedSeconds / 60).toString() + "分で終えました!" + new Date().toString();
        bg.tweet(message);
    }
    bg.stopTimer();
}

function stopTimer(){
    var bg = chrome.extension.getBackgroundPage();
    bg.stopTimer();
}

function addUrlList(){
    bg.urlList.push( addUrlText.value );
}

