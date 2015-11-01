"use strict";

function createRegisterNgSiteButton(){
  chrome.contextMenus.create({
      "title": "現在のタブをNGサイトに登録",
      "type" :"normal",
      "id": "register_ngsite_button"
  });
  chrome.contextMenus.create({
      "title": "現在のタブをNGサイトから除外",
      "type" :"normal",
      "id": "remove_ngsite_button"
  });
  chrome.contextMenus.onClicked.addListener(onRegisterNgSiteButtonClickHandler);
}

function onRegisterNgSiteButtonClickHandler(info, currentTab) {
    let urlList = JSON.parse(localStorage.getItem("urlList"));
    let domain = (currentTab.url.split("/"))[2];
    let index = urlList.findIndex(url => url == domain);
    
    if(info.menuItemId == "register_ngsite_button" && index ==-1){
      urlList.push(domain);
      localStorage.setItem("urlList", JSON.stringify(urlList));
      var notification = new Notification(domain + "をNGサイトに登録しました");
      setTimeout(notification.close.bind(notification),2000);
    }
    if(info.menuItemId == "remove_ngsite_button" && index != -1){
      urlList.splice(index, 1);
      localStorage.setItem("urlList", JSON.stringify(urlList));
      var notification = new Notification(domain + "をNGサイトから除外しました");
      setTimeout(notification.close.bind(notification),2000);
    }
}

function onOAuthButtonClickHandler() {
    let message = {
        method: "POST",
        action: "https://api.twitter.com/oauth/request_token",
        parameters: {
            oauth_callback: "oob"
        }
    };
    OAuth.completeRequest(message, {
        consumerKey: CONSUMER_KEY,
        consumerSecret: CONSUMER_SECRET
    });
    $.ajax({
        type: message.method,
        url: message.action,
        headers: {
            "Authorization": OAuth.getAuthorizationHeader("", message.parameters)
        },
        dataType: "text",
        success: responseText => {
            chrome.tabs.query({currentWindow: true, active: true}, tabs => {
                let currentTab = tabs[0];
                let queryMap = OAuth.getParameterMap(responseText);
                queryMap["window_id"] = currentTab.windowId.toString();
                open(OAuth.addToURL("pin.html", queryMap), "", "width=300, height=100");
            });
        },
        error: responseObject => {
            alert(`Error: ${responseObject.status} ${responseObject.statusText}\n${responseObject.responseText}`);
        }
    });
}

function getLocalStorageData(key) {
    if (localStorage !== null) return localStorage.getItem(key);
    else return null;
}
function setLocalStorageData(key, value) {
    if (localStorage !== null) localStorage.setItem(key, value);
}