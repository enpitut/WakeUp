var bg = chrome.extension.getBackgroundPage();

var form = document.createElement("form");

var timeText = document.createElement("input");
timeText.id = "timetext";
timeText.type = "text";
timeText.value = "10";
var minutesText = document.createTextNode("分");
var br = document.createElement("br");
form.appendChild(timeText);
form.appendChild(minutesText);
form.appendChild(br);
if(!bg.timeTextVisible){
    timeText.style.visibility = "hidden";
    form.removeChild(minutesText);
}
document.body.appendChild(form);

var startButton = document.createElement("input");
startButton.id = "startbutton";
startButton.type = "button";
startButton.value = "監視スタート";
if(!bg.startButtonVisible)startButton.style.visibility = "hidden";
form.appendChild(startButton);
document.body.appendChild(form);
startButton.addEventListener("click", callBackGround, false);

var endButton = document.createElement("input");
endButton.id = "endbutton";
endButton.type = "button";
endButton.value = "タスク完了";
form.appendChild(endButton);
document.body.appendChild(form);
endButton.addEventListener("click", stopTimer, false);

window.onload = function(){
    //alert("popup.htmlのonloadです！");
};

function callBackGround(){
    var time = Number(timeText.value) * 60;
    console.log(time);
    bg.timeTextVisible = false;
    timeText.style.visibility = "hidden";
    bg.startButtonVisible = false;
    startButton.style.visibility = "hidden";
    form.removeChild(minutesText);
    //bg.setTimer(time);
    //bg.mainLoop();
}

function stopTimer(){
    //bg.stopTimer();
}