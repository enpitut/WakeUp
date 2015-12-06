"use strict";

$(() => {
    drawTaskMinutes();
    drawSabori();
});

function drawTaskMinutes(){
    let width = 600;
	let height = 300;
    let drawWidth = width - 100;
    let drawHeight = height - 50;
	let taskLogs = JSON.parse(localStorage.getItem("taskLog"));
    
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
    .attr("transform", "translate(0," + (height - 50) + ")")
    .call(xAxis);
    
    svg.append("g")
    .attr("transform", "translate(0," + (height - 50) + ")")
    .call(labelAxis);
    
    svg.append("g")
    .attr("transform", "translate(50," + 0 + ")")
    .call(yAxis);
    
    svg.selectAll("barchart")
    .data(taskLogs)
    .enter()
    .append("rect")
    .attr("x", d => labelScale(new Date(new Date(d.date).toDateString())) - (drawWidth / taskLogs.length * 0.4))
    .attr("y", d => yScale(d.workMinutes))
    .attr("width", d => (drawWidth / taskLogs.length) * 0.8)
    .attr("height", d => drawHeight - yScale(d.workMinutes))
    .attr("fill", "rgb(76,229,100)")
    .attr("stroke", "none")
    .on("mouseover", d => tooltip.style("visibility", "visible").text(getBarDescription(d)))
    .on("mousemove", d => tooltip.style("top", (event.pageY-20)+"px").style("left",(event.pageX+10)+"px"))
    .on("mouseout", d => tooltip.style("visibility", "hidden"));
}

function getBarDescription(taskLog){
    var taskDescriptions = taskLog.task_descriptions.map((taskDescription) => {
        if(taskDescription != null)return taskDescription;
        else return "-";
    });
    
    let date = new Date(taskLog.date);
    return `タスク数：${taskLog.task_descriptions.length}(${taskDescriptions}(${taskLog.successNum}回成功、${taskLog.task_descriptions.length - taskLog.successNum}回失敗、${taskLog.saboriNum}回サボり))`;
}
