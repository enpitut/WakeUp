var bg = chrome.extension.getBackgroundPage();

$(function () {
    $("#add_url_button").click(function () {
        bg.urlList.push($("#add_url_text").val());
    });
});
