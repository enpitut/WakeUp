var bg = chrome.extension.getBackgroundPage();

var form = document.createElement("form");

var taskTimeText = document.createElement("input");
$(taskTimeText).val("10").attr("type","text").attr("id","tasktimetext");
var minutesText = document.createTextNode("分");
var br = document.createElement("br");
form.appendChild(taskTimeText);
form.appendChild(minutesText);
form.appendChild(br);
document.body.appendChild(form);

var startButton = document.createElement("input");
$(startButton).val("監視スタート").attr("type","button").attr("id","startbutton");
if(!bg.startButtonVisible)startButton.style.visibility = "hidden";
form.appendChild(startButton);
document.body.appendChild(form);
startButton.addEventListener("click", callBackGround, false);

var endButton = document.createElement("input");
$(endButton).val("タスク完了").attr("type","button").attr("id","endbutton");
form.appendChild(endButton);
document.body.appendChild(form);
endButton.addEventListener("click", stopTimer, false);

window.onload = function(){
    //alert("popup.htmlのonloadです！");
};

function callBackGround(){
    var time = Number(taskTimeText.value) * 60;
    console.log(time);
    //bg.setTimer(time);
    //bg.mainLoop();
}

function stopTimer(){
    //bg.stopTimer();
}