"use strict";

describe("詳細設定から設定できる機能", () => {
    let background;
    let popup;
    let config;
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
                $("#config").load(() => {
                    config = $("#config").get(0).contentWindow;
                    config.chrome.extension.getBackgroundPage = () => background;
                    done();
                });
                $("#config").attr("src", "../config.html");
            });
            $("#popup").attr("src", "../popup.html");
        });
        $("#background").attr("src", "../background.html");
    });
    it("詳細設定ページからブロックサイトを追加・削除する", () => {
        setMock(background, {});
        setMock(popup, {});
        setMock(config, {});
        expect(background.isNgSite("http://www.pixiv.net/")).toBe(false);
        config.$("#add_url_text").val("pixiv.net");
        config.$("#add_url_button").click();
        expect(background.isNgSite("http://www.pixiv.net/")).toBe(true);
        config.$("#url_list tr").filter(":contains('pixiv.net')").find("input").click();
        expect(background.isNgSite("http://www.pixiv.net/")).toBe(false);
    });
    it("タスクが見積もり時間内に終わらなかった時にリプライを送る相手を変更する", done => {
        setMock(background, {
            tweet(message) {
                expect(message).toContain("@tos");
                done();
            },
        });
        setMock(popup, {});
        setMock(config, {});
        config.$("#modify_account_text").val("tos");
        config.$("#modify_account_button").click();
        popup.$("#task_time_text").val("0");
        popup.$("#start_button").click();
    });
    it("サボり通知ツイートにタブの情報を含める", done => {
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
            tweet(message) {
                expect(message).toContain("niconico(http://www.nicovideo.jp/)");
                done();
            },
        });
        setMock(popup, {});
        setMock(config, {});
        config.$("#tweet_tabinfo_checkbox").click();
        popup.$("#task_time_text").val("1");
        popup.$("#start_button").click();
    });
    it("コンテキストメニューからブロックサイトを追加・削除する", () => {
        setMock(background, {});
        setMock(popup, {});
        setMock(config, {});
        expect(background.isNgSite("http://www.pixiv.net/")).toBe(false);
        config.$("#show_register_ngsite_button_checkbox").click();
        config.chrome.contextMenus.onClicked.dispatch({
            menuItemId: "register_ngsite_button",
        }, {
            id: 0,
            windowId: 0,
            url: "http://www.pixiv.net/",
            title: "[pixiv]",
        });
        expect(background.isNgSite("http://www.pixiv.net/")).toBe(true);
        config.chrome.contextMenus.onClicked.dispatch({
            menuItemId: "remove_ngsite_button",
        }, {
            id: 0,
            windowId: 0,
            url: "http://www.pixiv.net/",
            title: "[pixiv]",
        });
        expect(background.isNgSite("http://www.pixiv.net/")).toBe(false);
    });
});
