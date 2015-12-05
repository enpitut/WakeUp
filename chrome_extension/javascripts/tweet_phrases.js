const TWEET_PHRASES = {
    "WATCHED_NG_SITES": {
        "WITH_TAB_INFO":     "私は%(taskDescription)sをサボって %(siteName)s( %(siteUrl)s ) を見ていました %(date)s #UGEN",
        "WITHOUT_TAB_INFO":  "私は%(taskDescription)sをサボっていました %(date)s #UGEN"
    },
    "FAILED": {
        "WITH_RECIPIENT":       "@%(recipient)s 突然のリプライ失礼致します。このたび私事ながら%(taskDescription)s時間の見積もりに失敗しました。誠に申し訳ありません %(date)s #UGEN",
        "WITHOUT_RECIPIENT":    "私は%(taskDescription)s時間の見積もりに失敗しました %(date)s #UGEN"
    },
    "SUCCESSED":        "%(estimatedMinutes)d分かかると見積もった%(taskDescription)sを%(actualMinutes)d分で終えました! %(date)s #UGEN",
    "GET_PERMISSION":   "@%(recipient)s ツールによる自動メッセージです。作業が見積もり時間内に終わらなかった時にリプライを自動で送るツールを使うことで作業の強制力を上げようとしています。リプライを送られることを許可する場合はこのリプライに返信してください。"
};
