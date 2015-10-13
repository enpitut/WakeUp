"use strict";

describe("popup.html", () => {
    let background;
    let popup;
    function setMock(globalObject, mock) {
        $.extend(true, globalObject, mock);
        globalObject.$.fire();
    }
    beforeEach(done => {
        localStorage.clear();
        jasmine.getFixtures().fixturesPath = "javascripts/fixtures";
        loadFixtures("fixture.html");
        $("#background").load(() => {
            background = $("#background").get(0).contentWindow;
            $("#page").load(() => {
                popup = $("#page").get(0).contentWindow;
                popup.chrome.extension.getBackgroundPage = () => background;
                done();
            });
            $("#page").attr("src", "../popup.html");
        });
    });
    it("タスクを見積もり時間内に終わらせると見積もり時間と実際にかかった時間をツイートする", done => {
        setMock(background, {
            tweet: message => {
                expect(message).toMatch(/1分かかると見積もった作業を/);
                expect(message).toMatch(/0分で終えました/);
                done();
            }
        });
        setMock(popup, {});
        popup.$("#task_time_text").val("1");
        popup.$("#start_button").click();
        popup.$("#end_button").click();
    });
    it("タスクが見積もり時間内に終わらないと謝罪ツイートをする", done => {
        setMock(background, {
            tweet: message => {
                expect(message).toMatch(/申し訳ありません/);
                done();
            }
        });
        setMock(popup, {});
        popup.$("#task_time_text").val("0");
        popup.$("#start_button").click();
    });
});
