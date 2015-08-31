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
        $('#add_url_text').val("http://");
    });
    listNgSites();
});
