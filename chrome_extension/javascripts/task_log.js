"use strict";

$(() => {
    let taskLogs = loadConfig().taskLog;
    if(taskLogs.length ==0) $("#task_log").text("作業するとここにグラフが表示されます");
    else drawTaskMinutes(taskLogs);
});

function drawTaskMinutes(taskLogs){
    let width = 600;
	let height = 300;
    let drawWidth = width - 100;
    let drawHeight = height - 50;
    
    let tooltip = d3.select("body").select("#tooltip");

	$("#task_log").width(width).height(height);
	let svg = d3.select("#task_log")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

	let labelScale = d3.time.scale()
    .domain([new Date(taskLogs[0].date),new Date(taskLogs[taskLogs.length-1].date)])
    .range([50 + (drawWidth / taskLogs.length / 2), width - 50 - (drawWidth / taskLogs.length / 2)]);

    let xScale = d3.time.scale()
    .domain([new Date(taskLogs[0].date),new Date(taskLogs[taskLogs.length-1].date)])
    .range([50, width-50]);
    
    let yScale = d3.scale.linear()
    .domain([d3.max(taskLogs, taskLog => taskLog.workMinutes), 0])
    .range([50, height-50]);

   	let xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom")
    .ticks(d3.time.day, 1)
    .tickFormat(d3.time.format(""));
    
    let yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left");
    
    let labelAxis = d3.svg.axis()
    .scale(labelScale)
    .orient("bottom")
    .ticks(d3.time.day, 1)
    .tickFormat(d3.time.format("%m/%d"));

    svg.append("g")
    .attr("transform", `translate(0, ${height - 50})`)
    .call(xAxis);
    
    svg.append("g")
    .attr("transform", `translate(0, ${height - 50})`)
    .call(labelAxis);
    
    svg.append("g")
    .attr("transform", `translate(50,0)`)
    .call(yAxis)
    .append("text")
    .attr("y", 30)
    .attr("x",30)
    .style("text-anchor", "end")
    .text("作業時間(分)"); 
    
    svg.selectAll("barchart")
    .data(taskLogs)
    .enter()
    .append("rect")
    .attr("x", d => labelScale(new Date(new Date(d.date).toDateString())) - (drawWidth / taskLogs.length * 0.4))
    .attr("y", d => yScale(d.workMinutes))
    .attr("width", d => (drawWidth / taskLogs.length) * 0.8)
    .attr("height", d => {
        if(d.workMinutes == 0) return 0;
        else return drawHeight - yScale(d.workMinutes);
    })
    .attr("fill", "rgb(76,229,100)")
    .attr("stroke", "none")
    .on("mouseover", d => tooltip.style("visibility", "visible").text(getBarDescription(d)))
    .on("mousemove", d => tooltip.style("top", `${event.pageY - 20}px`).style("left",`${event.pageX + 10}px`))
    .on("mouseout", d => tooltip.style("visibility", "hidden"));
}

function getBarDescription(taskLog){
    var taskDescriptions = taskLog.taskDescriptions.map((taskDescription) => {
        if(taskDescription != "") return taskDescription;
        else return "記入無し";
    });
    
    let date = new Date(taskLog.date);
    return `タスク数：${taskLog.taskDescriptions.length}(内容：${taskDescriptions}(${taskLog.successNum}回成功、${taskLog.taskDescriptions.length - taskLog.successNum}回失敗、${taskLog.saboriNum}回サボり))`;
}
