"use strict";

if (location.protocol != "chrome-extension:") {
    window.alert = () => {};
    window.open = () => ({
        close() {}
    });
    window.close = () => {};
    window.chrome = {
        browserAction: {
            setBadgeText() {},
            setBadgeBackgroundColor() {},
            setIcon() {}
        },
        contextMenus: {
            create() {},
            onClicked: (() => {
                let listeners = [];
                return {
                    addListener(listener) {
                        listeners.push(listener);
                    },
                    dispatch(info, tab) {
                        for (let listener of listeners) {
                            listener(info, tab);
                        }
                    }
                };
            })()
        },
        extension: {},
        tabs: {
            update() {},
            create() {}
        }
    };
    window.getMentions = () => Promise.resolve([]);
    window.getScreenName = userId => Promise.resolve({
        "3315564288": "UGEN_bot",
        "3356282660": "UGEN_teacher"
    }[userId]);
    window.getUserId = screenName => Promise.resolve({
        "UGEN_bot": 3315564288,
        "UGEN_teacher": 3356282660
    }[screenName]);
    window.notificate = () => {};
    window.getCurrentTab = () => Promise.resolve({
        id: 0,
        windowId: 0,
        url: "http://example.com/",
        title: "Example"
    });
    (() => {
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
    })();
}
