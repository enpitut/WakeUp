var form = document.createElement("form");


var timeText = document.createElement("input");
timeText.id = "timetext";
timeText.type = "text";
timeText.value = "10";
form.appendChild(timeText);
document.body.appendChild(form);


var startButton = document.createElement("input");
startButton.id = "startbutton";
startButton.type = "button";
startButton.value = "監視スタート";
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
    var bg = chrome.extension.getBackgroundPage();
    var time = Number(timeText.value) * 60;
    console.log(time);
    timeText.style.visibility = "hidden";
    startButton.style.visibility = "hidden";
    //bg.setTimer(time);
    //bg.mainLoop();
}

function stopTimer(){
    var bg = chrome.extension.getBackgroundPage();
    //bg.stopTimer();
}



var addUrlListForm = document.createElement("form");



var addUrlListText = document.createElement("input");
addUrlListText.id = "addUrlListText";
addUrlListText.type = "text";
addUrlListText.value = "http://xxxx.com";
addUrlListForm.appendChild(addUrlListText);
document.body.appendChild(addUrlListForm);

var addUrlListBtn = document.createElement("input");
addUrlListBtn.id = "addUrlListBtn";
addUrlListBtn.type = "button";
addUrlListBtn.value = "ブロックリスト追加";

addUrlListForm.appendChild(addUrlListBtn);
addUrlListBtn.addEventListener("click",addUrlList,false);
document.body.appendChild(addUrlListForm);


