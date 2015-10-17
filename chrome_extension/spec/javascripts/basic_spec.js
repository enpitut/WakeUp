"use strict";

describe("基本機能", () => {
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
            $("#popup").load(() => {
                popup = $("#popup").get(0).contentWindow;
                popup.chrome.extension.getBackgroundPage = () => background;
                done();
            });
            $("#popup").attr("src", "../popup.html");
        });
        $("#background").attr("src", "../background.html");
    });
    it("タスクを見積もり時間内に終わらせると見積もり時間と実際にかかった時間をツイートする", done => {
        setMock(background, {
            tweet: message => {
                expect(message).toContain("1分かかると見積もった作業を0分で終えました");
                done();
            },
        });
        setMock(popup, {});
        popup.$("#task_time_text").val("1");
        popup.$("#start_button").click();
        popup.$("#end_button").click();
    });
    it("タスクが見積もり時間内に終わらないと謝罪ツイートをする", done => {
        setMock(background, {
            tweet: message => {
                expect(message).toContain("申し訳ありません");
                done();
            },
        });
        setMock(popup, {});
        popup.$("#task_time_text").val("0");
        popup.$("#start_button").click();
    });
    it("ブロックサイトを一定時間閲覧し続けていると警告を表示する", done => {
        setMock(background, {
            setTimeout(func, ms) {
                setTimeout(func, 0);
            },
            chrome: {
                tabs: {
                    query(parameter, callback) {
                        callback([{
                            id: 0,
                            windowId: 0,
                            url: "http://www.nicovideo.jp/",
                            title: "niconico",
                        }]);
                    },
                },
            },
            alert(message) {
                expect(message).toContain("あと 5 秒 niconico に滞在すると");
                done();
            },
        });
        setMock(popup, {});
        popup.$("#task_time_text").val("1");
        popup.$("#start_button").click();
    });
    it("警告を無視してブロックサイトを閲覧し続けているとサボり通知ツイートをして「新しいタブ」ページへ飛ばす", done => {
        let count = 2;
        function partiallyDone() {
            count--;
            if (count == 0) done();
        }
        setMock(background, {
            setTimeout(func, ms) {
                setTimeout(func, 0);
            },
            chrome: {
                tabs: {
                    query(parameter, callback) {
                        callback([{
                            id: 0,
                            windowId: 0,
                            url: "http://www.nicovideo.jp/",
                            title: "niconico",
                        }]);
                    },
                    update(id, parameter) {
                        expect(parameter.url).toEqual("chrome://newtab/");
                        partiallyDone();
                    },
                },
            },
            tweet(message) {
                expect(message).toContain("作業をサボっていました");
                partiallyDone();
            },
        });
        setMock(popup, {});
        popup.$("#task_time_text").val("1");
        popup.$("#start_button").click();
    });
    it("タスク終了予定時刻まで残り1分超のとき、残り分数をバッジに青地で表示する", done => {
        let count = 2;
        function partiallyDone() {
            count--;
            if (count == 0) done();
        }
        setMock(background, {
            chrome: {
                browserAction: {
                    setBadgeText(parameter) {
                        expect(parameter.text).toEqual("2");
                        partiallyDone();
                    },
                    setBadgeBackgroundColor(parameter) {
                        expect(parameter.color).toEqual([0, 0, 255, 100]);
                        partiallyDone();
                    },
                },
            },
        });
        setMock(popup, {});
        popup.$("#task_time_text").val("2");
        popup.$("#start_button").click();
    });
    it("タスク終了予定時刻まで残り1分以下のとき、残り秒数をバッジに赤地で表示する", done => {
        let count = 2;
        function partiallyDone() {
            count--;
            if (count == 0) done();
        }
        setMock(background, {
            chrome: {
                browserAction: {
                    setBadgeText(parameter) {
                        expect(parameter.text).toEqual("60");
                        partiallyDone();
                    },
                    setBadgeBackgroundColor(parameter) {
                        expect(parameter.color).toEqual([255, 0, 0, 100]);
                        partiallyDone();
                    },
                },
            },
        });
        setMock(popup, {});
        popup.$("#task_time_text").val("1");
        popup.$("#start_button").click();
    });
    it("タスク終了予定時刻まで残り1分以下になった瞬間、警告を表示する", done => {
        setMock(background, {
            setTimeout(func, ms) {
                setTimeout(func, 0);
            },
            chrome: {
                tabs: {
                    query(parameter, callback) {
                        callback([{
                            id: 0,
                            windowId: 0,
                            url: "http://www.nicovideo.jp/",
                            title: "niconico",
                        }]);
                    },
                },
            },
            tweet() {},
            Notification: function (message) {
                this.close = () => {};
                expect(message).toContain("あと1分でtweetされます");
                done();
            },
        });
        setMock(popup, {});
        popup.$("#task_time_text").val("1");
        popup.$("#start_button").click();
    });
});
