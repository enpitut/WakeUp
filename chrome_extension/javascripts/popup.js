var form = document.createElement("form");
var btn = document.createElement("input");
btn.id = "button1";
btn.type = "button";
btn.value = "監視スタート";
form.appendChild(btn);
document.body.appendChild(form);
btn.addEventListener("click", callBackGround, false);

window.onload = function(){
	//alert("popup.htmlのonloadです！");
};

function callBackGround(){
	var bg = chrome.extension.getBackgroundPage();
	bg.mainLoop();
}