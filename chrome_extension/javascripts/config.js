$(function () {
    $("#add_url_button").click(function () {
        var urlList = JSON.parse(localStorage.getItem("urlList"));
        urlList.push($("#add_url_text").val());
        localStorage.setItem("urlList", JSON.stringify(urlList));
    });
});
