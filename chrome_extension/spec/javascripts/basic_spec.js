"use strict";

describe("基本機能", () => {
    let background;
    let popup;
    function setMock(globalObject, mock) {
        $.extend(true, globalObject, mock);
        globalObject.$.fire();
    }
    beforeEach(done => {
        let prefix = location.protocol == "http:" ? "base/" : "";
        localStorage.clear();
        jasmine.getFixtures().fixturesPath = `${prefix}spec/javascripts/fixtures`;
        loadFixtures("fixture.html");
        $("#background").load(() => {
            background = $("#background").get(0).contentWindow;
            $("#popup").load(() => {
                popup = $("#popup").get(0).contentWindow;
                popup.chrome.extension.getBackgroundPage = () => background;
                done();
            });
            $("#popup").attr("src", `${prefix}popup.html`);
        });
        $("#background").attr("src", `${prefix}background.html`);
    });
    it("タスクを見積もり時間内に終わらせると見積もり時間と実際にかかった時間をツイートする", done => {
        setMock(background, {
            tweet(message) {
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
            tweet(message) {
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
            setTimeout: (originalSetTimeout => {
                return (func, ms) => originalSetTimeout(func, 0);
            })(background.setTimeout),
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
            Notification: function (message) {
                this.close = () => {};
                expect(message).toContain("あと 5 秒 niconico に滞在すると");
                done();
            },
        });
        setMock(popup, {});
        popup.$("#task_time_text").val("2");
        popup.$("#start_button").click();
    });
    it("警告を無視してブロックサイトを閲覧し続けているとサボり通知ツイートをして「新しいタブ」ページへ飛ばす", done => {
        let count = 2;
        function partiallyDone() {
            count--;
            if (count == 0) done();
        }
        setMock(background, {
            setTimeout: (originalSetTimeout => {
                return (func, ms) => originalSetTimeout(func, 0);
            })(background.setTimeout),
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
    it("作業内容を入力してタスクが見積もり時間内に終わったとき作業内容をツイートする", done => {
        setMock(background, {
            tweet(message) {
                expect(message).toContain("動作確認作業");
                done();
            },
        });
        setMock(popup, {});
        // setTimeoutを使う理由: blur()の直後にfocus()は効かない
        // http://stackoverflow.com/questions/11380392/the-focus-method-in-jquery-doesnt-work
        setTimeout(() => {
            popup.$("#task_time_text").val("1");
            popup.$("#task_description_text").focus();
            popup.$("#task_description_text").val("動作確認作業");
            popup.$("#task_description_text").blur();
            popup.$("#start_button").click();
            popup.$("#end_button").click();
        }, 0);
    });
    it("作業内容を入力してタスクが見積もり時間内に終わらなかったとき作業内容をツイートする", done => {
        setMock(background, {
            tweet(message) {
                expect(message).toContain("動作確認作業");
                done();
            },
        });
        setMock(popup, {});
        setTimeout(() => {
            popup.$("#task_time_text").val("0");
            popup.$("#task_description_text").focus();
            popup.$("#task_description_text").val("動作確認作業");
            popup.$("#task_description_text").blur();
            popup.$("#start_button").click();
        }, 0);
    });
    it("作業内容を入力してブロックサイトを閲覧し続けていたとき作業内容をツイートする", done => {
        setMock(background, {
            setTimeout: (originalSetTimeout => {
                return (func, ms) => originalSetTimeout(func, 0);
            })(background.setTimeout),
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
            tweet(message) {
                expect(message).toContain("動作確認作業");
                done();
            },
        });
        setMock(popup, {});
        setTimeout(() => {
            popup.$("#task_time_text").val("1");
            popup.$("#task_description_text").focus();
            popup.$("#task_description_text").val("動作確認作業");
            popup.$("#task_description_text").blur();
            popup.$("#start_button").click();
        }, 0);
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
    it("監視を停止・再開する", () => {
        setMock(background, {});
        setMock(popup, {});
        expect(background.timerState).toBe("off");
        popup.$("#task_time_text").val("1");
        popup.$("#start_button").click();
        expect(background.timerState).toBe("on");
        popup.$("#pause_button").click();
        expect(background.timerState).toBe("pause");
        popup.$("#restart_button").click();
        expect(background.timerState).toBe("on");
    });
    it("監視を停止・再開するのに合わせてポップアップの画像が切り替わる", () => {
        setMock(background, {});
        setMock(popup, {});
        expect(background.timerState).toBe("off");
        popup.$("#task_time_text").val("1");
        expect(popup.$("#idling_image")).toHaveCss({display: "block"});
        expect(popup.$("#running_image")).toHaveCss({display: "none"});
        popup.$("#start_button").click();
        expect(popup.$("#idling_image")).toHaveCss({display: "none"});
        expect(popup.$("#running_image")).toHaveCss({display: "block"});
        popup.$("#pause_button").click();
        expect(popup.$("#idling_image")).toHaveCss({display: "block"});
        expect(popup.$("#running_image")).toHaveCss({display: "none"});
        popup.$("#restart_button").click();
        expect(popup.$("#idling_image")).toHaveCss({display: "none"});
        expect(popup.$("#running_image")).toHaveCss({display: "block"});
    });
    it("監視停止中はブロックサイトを閲覧してもサボり通知ツイートがされたり「新しいタブ」ページへ飛ばされたりしない", done => {
        let isDone = false;
        setMock(background, {
            setTimeout: (originalSetTimeout => {
                return (func, ms) => originalSetTimeout(func, 0);
            })(background.setTimeout),
            chrome: {
                tabs: {
                    query(parameter, callback) {
                        if (background.timerState == "pause") {
                            callback([{
                                id: 0,
                                windowId: 0,
                                url: "http://www.nicovideo.jp/",
                                title: "niconico",
                            }]);
                        } else {
                            callback([{
                                id: 0,
                                windowId: 0,
                                url: "http://example.com/",
                                title: "Example",
                            }]);
                        }
                    },
                    update(id, parameter) {
                        if (!isDone) {
                            fail("chrome.tabs.update()が呼ばれた");
                            isDone = true;
                            done();
                        }
                    },
                },
            },
            tweet(message) {
                if (!isDone) {
                    fail("tweet()が呼ばれた");
                    isDone = true;
                    done();
                }
            },
        });
        setMock(popup, {});
        popup.$("#task_time_text").val("100");
        popup.$("#start_button").click();
        popup.$("#pause_button").click();
        setTimeout(() => {
            if (!isDone) {
                expect(true).toBe(true);
                isDone = true;
                done();
            }
        }, 500);
    });
});
