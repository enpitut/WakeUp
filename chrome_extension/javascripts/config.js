function listNgSites() {
    var urlList = JSON.parse(localStorage.getItem("urlList"));
    $("#url_list").empty();
    for (var i = 0; i < urlList.length; i++) {
        $("#url_list").append($(document.createElement("li")).text(urlList[i]));
    }
}

$(function () {
    $("#add_url_button").click(function () {
        var urlList = JSON.parse(localStorage.getItem("urlList"));
        urlList.push($("#add_url_text").val());
        localStorage.setItem("urlList", JSON.stringify(urlList));
        listNgSites();
        $("#add_url_text").val("http://");
    });
    listNgSites();

    $("#modify_account_text").val(localStorage.getItem("replyAccount"));
    $("#modify_account_button").click(function () {
        localStorage.setItem("replyAccount", $("#modify_account_text").val());
    });

    $("#oauth_button").click(function () {
        var message = {
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
            success: function (responseText) {
                chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
                    var currentTab = tabs[0];
                    var queryMap = OAuth.getParameterMap(responseText);
                    queryMap["window_id"] = currentTab.windowId.toString();
                    open(OAuth.addToURL("pin.html", queryMap), "", "width=300, height=100");
                });
            },
            error: function (responseObject) {
                alert("Error: " + responseObject.status + " " + responseObject.statusText + "\n" + responseObject.responseText);
            }
        });
    });
});
