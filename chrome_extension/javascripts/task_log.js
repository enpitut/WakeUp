"use strict";

$(() => {
	for (let log of JSON.parse(localStorage.getItem("taskLog"))) {
	    let date = new Date(log.date);
	    $("#task_log").append($(`<p>${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}　　　　作業時間：${log.workMinutes}分　タスク数：${log.task_descriptions.length}(うち${log.successNum}回成功、${log.task_descriptions.length - log.successNum}回失敗)　タスク内容：${log.task_descriptions}　サボり数：${log.saboriNum}</p>`));
	}
});


