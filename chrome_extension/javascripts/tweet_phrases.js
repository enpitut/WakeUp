const tweet_phrases = {
    "name": "UGEN tweet 文言集",
    "version": "0.0.1",
    "description": "UGENでツイートするときの文言集",
    "phrases": {
        "watched_ngsites": {
            "include_tabinfo": [
                "`私は${element1}をさぼってるよ。今のタブはこれ！ ${element2}( ${currentTab.url} ) ${new Date()} #UGEN`",
                "`私は${element1}をサボって ${element2}( ${currentTab.url} ) を見ていました ${new Date()} #UGEN`"
            ],
            "not_include_tabinfo": [
                "`私は${element}をサボっていました ${new Date()} #UGEN`"
            ]
        },
        "failed": [
            "`@${localStorage.getItem('replyAccount')} 突然のリプライ失礼致します。このたび私事ながら${element}作業時間の見積もりに失敗しました。誠に申し訳ありません ${new Date()} #UGEN`"
        ],
        "successed": [
            "`${Math.round(bg.limitSeconds / 60)}分かかると見積もった${element}を${Math.round(bg.elapsedSeconds / 60)}分で終えました! #UGEN ${new Date()}`"
        ]
    }

};
