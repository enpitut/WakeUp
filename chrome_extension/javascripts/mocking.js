"use strict";

if (location.protocol != "chrome-extension:") {
    window.alert = () => {};
    window.open = () => ({
        close() {}
    });
    window.close = () => {};
    window.Notification = function () {};
    window.Notification.prototype.close = () => {};
    window.chrome = {
        browserAction: {
            setBadgeText() {},
            setBadgeBackgroundColor() {},
            setIcon() {},
        },
        contextMenus: {
            create() {},
            onClicked: {
                addListener() {},
            },
        },
        extension: {},
        tabs: {
            update() {},
            create() {},
            query: () => ({
                windowId: 0,
                url: "http://example.com/",
                title: "Example",
            }),
        },
    };
    () => {
        let original$ = window.$;
        let onloadFuncs = [];
        window.$ = onloadFunc => {
            onloadFuncs.push(onloadFunc);
        };
        window.$.fire = () => {
            window.$ = original$;
            for (let onloadFunc of onloadFuncs) {
                onloadFunc();
            }
        };
    }();
}
