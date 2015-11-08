"use strict";

describe("関数の入出力", () => {
    let background;
    function setMock(globalObject, mock) {
        $.extend(true, globalObject, mock);
        globalObject.$.fire();
    }
    beforeAll(done => {
        let prefix = location.protocol == "http:" ? "base/" : "";
        localStorage.clear();
        jasmine.getFixtures().fixturesPath = `${prefix}spec/javascripts/fixtures`;
        loadFixtures("fixture.html");
        $("#background").load(() => {
            background = $("#background").get(0).contentWindow;
            done();
        });
        $("#background").attr("src", `${prefix}background.html`);
    });
    describe("generateTweet()", () => {
        it("長い文字列1個を省略してツイートを140文字以内に収める", () => {
            let tweet = background.generateTweet(
                element => `${element}yyyyy`,
                {
                    element: "x".repeat(140),
                    formatter(element, upperLimitLength, getShortenedString) {
                        return `${getShortenedString(5)}.....`;
                    },
                }
            );
            expect(tweet).toEqual(`${"x".repeat(130)}.....yyyyy`);
        });
        it("長い文字列2個を省略してツイートを140文字以内に収める", () => {
            let tweet = background.generateTweet(
                (element1, element2) => `${element1}yyyyy${element2}`,
                {
                    element: "x".repeat(140),
                    formatter(element, upperLimitLength, getShortenedString) {
                        return `${getShortenedString(5)}.....`;
                    },
                },
                {
                    element: "z".repeat(140),
                    formatter(element, upperLimitLength, getShortenedString) {
                        return `${getShortenedString(5)}.....`;
                    },
                }
            );
            expect(tweet).toEqual(`${"x".repeat(63)}.....yyyyy${"z".repeat(62)}.....`);
        });
        it("URIを23文字として扱う", () => {
            let tweet = background.generateTweet(
                element => `${element}|https://www.google.co.jp/#q=%E3%83%86%E3%82%B9%E3%83%88 http://search.yahoo.co.jp/search?p=%E3%83%86%E3%82%B9%E3%83%88`,
                {
                    element: "x".repeat(140),
                    formatter(element, upperLimitLength, getShortenedString) {
                        return getShortenedString(0);
                    },
                }
            );
            expect(tweet.split("|")[0]).toEqual("x".repeat(140 - 23 * 2 - 2));
        });
        it("@#をエスケープする", () => {
            let tweet = background.generateTweet(
                element => element,
                {
                    element: "@tos",
                    formatter(element, upperLimitLength, getShortenedString) {
                        return element;
                    },
                }
            );
            expect(tweet).toEqual("@\u200ctos");
        });
        it("長い文字列を省略した結果末尾が@#になりそうなら@#も省略する", () => {
            let tweet = background.generateTweet(
                element => `${element}TwitterJP`,
                {
                    element: `${"x".repeat(130)}@tos`,
                    formatter(element, upperLimitLength, getShortenedString) {
                        return getShortenedString(0);
                    },
                }
            );
            expect(tweet).toEqual(`${"x".repeat(130)}TwitterJP`);
        });
    });
});
