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
        let prefix = location.protocol == "http:" ? "base/" : "";
        localStorage.clear();
        localStorage.setItem("userId", "3315564288");
        localStorage.setItem("replySetting", JSON.stringify({
            "3315564288": {
                replyAccountId: -1,
                replyAccountIds: [],
                replyIdForPermissionMap: {}
            }
        }));
        jasmine.getFixtures().fixturesPath = `${prefix}spec/javascripts/fixtures`;
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
                $("#config").attr("src", `${prefix}config.html`);
            });
            $("#popup").attr("src", `${prefix}popup.html`);
        });
        $("#background").attr("src", `${prefix}background.html`);
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
    it("タスクが見積もり時間内に終わらなかったときにリプライを送る相手を追加する際、リプライを送る相手を表示する", done => {
        setMock(background, {});
        setMock(popup, {});
        setMock(config, {});
        config.$("#new_account_text").val("UGEN_teacher");
        config.$("#new_account_text").trigger("keydown");
        setTimeout(() => {
            expect(config.$("#permission_message_destination").text()).toBe("UGEN_teacher");
            expect(config.$("#permission_message").text()).toContain("@UGEN_teacher");
            setTimeout(done, 0);
        }, 100);
    });
    it("タスクが見積もり時間内に終わらなかったときにリプライを送る相手を追加する", done => {
        setMock(background, {});
        setMock(popup, {});
        setMock(config, {
            tweet(message) {
                expect(message).toContain("@UGEN_teacher");
                return Promise.resolve({id: 42});
            },
            notificate(message) {
                let myReplySetting = JSON.parse(localStorage.getItem("replySetting"))[localStorage.getItem("userId")];
                expect(myReplySetting.replyIdForPermissionMap["3356282660"]).toEqual(42);
                expect(message).toEqual("@UGEN_teacherにリプライを送りました");
                setTimeout(done, 0);
            }
        });
        config.$("#new_account_text").val("UGEN_teacher");
        config.$("#new_account_text").trigger("keydown");
        config.$("#new_account_button").click();
    });
    it("タスクが見積もり時間内に終わらなかったときにリプライを送る相手を変更する", done => {
        setMock(background, {});
        {
            let replySetting = JSON.parse(localStorage.getItem("replySetting"));
            replySetting[localStorage.getItem("userId")].replyIdForPermissionMap["3356282660"] = 42;
            localStorage.setItem("replySetting", JSON.stringify(replySetting));
        }
        setMock(popup, {});
        setMock(config, {
            getMentions: () => Promise.resolve([{user: {id: 3356282660}, in_reply_to_status_id: 42}]),
            notificate(message) {
                let myReplySetting = JSON.parse(localStorage.getItem("replySetting"))[localStorage.getItem("userId")];
                expect(myReplySetting.replyIdForPermissionMap.hasOwnProperty("3356282660")).toBe(false);
                expect(myReplySetting.replyAccountIds).toContain(3356282660);
                expect(message).toEqual("@UGEN_teacherからリプライの許可が下りました");
                setTimeout(done, 0);
            }
        });
        config.$("#modify_account_select").val("3356282660");
        config.$("#modify_account_button").click();
    });
    it("リプライ相手を設定していてタスクが見積もり時間内に終わらなかったとき謝罪リプライをする", done => {
        setMock(background, {
            tweet(message) {
                expect(message).toContain("@UGEN_teacher");
                expect(message).toContain("申し訳ありません");
                setTimeout(done, 0);
                return Promise.resolve();
            }
        });
        {
            let replySetting = JSON.parse(localStorage.getItem("replySetting"));
            let myReplySetting = replySetting[localStorage.getItem("userId")];
            myReplySetting.replyAccountIds.push(3356282660);
            myReplySetting.replyAccountId = 3356282660;
            localStorage.setItem("replySetting", JSON.stringify(replySetting));
        }
        setMock(popup, {});
        setMock(config, {});
        popup.$("#task_time_text").val("0");
        popup.$("#start_button").click();
    });
    it("サボり通知ツイートにタブの情報を含める", done => {
        setMock(background, {
            wait: 10,
            getCurrentTab: () => Promise.resolve({
                id: 0,
                windowId: 0,
                url: "http://www.nicovideo.jp/",
                title: "niconico"
            }),
            tweet(message) {
                expect(message).toContain("niconico( http://www.nicovideo.jp/ )");
                setTimeout(done, 0);
                return Promise.resolve();
            }
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
            title: "[pixiv]"
        });
        expect(background.isNgSite("http://www.pixiv.net/")).toBe(true);
        config.chrome.contextMenus.onClicked.dispatch({
            menuItemId: "remove_ngsite_button",
        }, {
            id: 0,
            windowId: 0,
            url: "http://www.pixiv.net/",
            title: "[pixiv]"
        });
        expect(background.isNgSite("http://www.pixiv.net/")).toBe(false);
    });
});
;
