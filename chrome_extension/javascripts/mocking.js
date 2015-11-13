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
            onClicked: () => {
                let listeners = [];
                return {
                    addListener(listener) {
                        listeners.push(listener);
                    },
                    dispatch(info, tab) {
                        for (let listener of listeners) {
                            listener(info, tab);
                        }
                    },
                };
            }(),
        },
        extension: {},
        tabs: {
            update() {},
            create() {},
            query(parameter, callback) {
                callback([{
                    id: 0,
                    windowId: 0,
                    url: "http://example.com/",
                    title: "Example",
                }]);
            },
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
