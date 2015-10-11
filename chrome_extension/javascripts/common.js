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

function onRegisterNgSiteButtonClickHandler(info, tab) {
  chrome.tabs.query({currentWindow: true, active: true}, tabs => {
    let currentTab = tabs[0];
    let urlList = JSON.parse(localStorage.getItem("urlList"));
    let domain = (currentTab.url.split("/"))[2];
    let index = urlList.findIndex(url => url == domain);
    
    if(info.menuItemId == "register_ngsite_button" && index ==-1){
      urlList.push(domain);
      localStorage.setItem("urlList", JSON.stringify(urlList));
      new Notification(domain + "をNGサイトに登録しました");
    }
    if(info.menuItemId == "remove_ngsite_button" && index != -1){
      urlList.splice(index, 1);
      localStorage.setItem("urlList", JSON.stringify(urlList));
      new Notification(domain + "をNGサイトから除外しました");
    }
  });
}