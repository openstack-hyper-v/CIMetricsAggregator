/*
Javascript component of interface for Opentack CI Metrics tool.
Copyright 2014 Gabriel Loewen
Microsoft Openstack CI Lab team
*/

// Format the checkboxes properly for the data series picker
function checkboxFormatter(label,key) {
   if (label.substring(0,8) === "Upstream") {
      return '<input class="checkbox" type="checkbox" name="' + label + '" id="' + key + label + '"><label for="' + key + label +'">' + label + '  </label>';
   } else {
      return '<input class="checkbox" type="checkbox" name="' + label + '" id="' + key + label + '" checked><label for="' + key + label +'">' + label + '  </label>';
   }
}

// Format the labels for the pie graphs
function labelFormatter(label, series) {
   return "<div class='pielabel'>" + label + "<br/>" + series.percent.toFixed(1) + "%</div>";
}

// Format the tooltip container for the line charts
function tooltipFormatter(dat,labels) {
   output = "<h2 id=\"highlighted\">" + dat.toDateString() + "</h2>";
   for (var i=0; i<labels.length; ++i) {
      var item = labels[i];
      output += "<h3 style=\"padding: 2px;\">" + item.label + " : " + item.val + "</h3>";
   }
   return output;
}

// Inserts a checkbox into the desired div for each series in the chart
function insertCheckBoxes(div, data, key) {
   for (var i=0; i<data.length; ++i) {
      $(div).append(checkboxFormatter(data[i].label,key));
   }
}

// Given the queried results, plot the line chart using Flot
function plotLines(div,results) {
   var data = [];
   var container = $(div+"legend");
   container.find("input:checked").each(function() {
      for (var i=0; i<results.length; ++i) {
	 if (this.name == results[i].label) {
	    data.push(results[i]);
	 }
      } 
   });
   var plot = $.plot($(div), data, {
      series: { lines: { show: true }, points: { show: true } },
      grid: { hoverable: true, backgroundColor: { colors: ["#fff", "#ccc"] } },
      xaxis: { mode: "time", timeformat: "%m/%d/%y" },
      yaxis: { tickFormatter: function(val, axis) { return val < axis.max ? val : "#"; }},
      legend: { show: true, noColumns: 0, position: "nw"}
   });
   $(div).unbind("plothover");
   $(div).bind("plothover", function (event, pos, item) {
       if (item) {
	  var dat = new Date(item.datapoint[0]);
	  // Fixing an off by 1 error.  Could be an issue with timezone?
	  dat.setUTCDate(dat.getUTCDate()+1);
	  
	  plot.unhighlight();
	  var labels=[];
	  for (var j=0; j<data.length; ++j) { 
	     for (i=0;i<data[j].data.length;++i) {
		var x = data[j].data[i];
		if (x[0] == item.datapoint[0]) {
		   plot.highlight(j,i);
		   labels.push({"label":data[j].label,"val":data[j].data[i][1]});
		   break
		}
	     }
	  }
	  $("#tooltip").html(tooltipFormatter(dat,labels)).css({top: item.pageY+5, left: item.pageX+5}).fadeIn(200);
       } else {
	  $("#tooltip").hide();
	  plot.unhighlight();
       }
   });
}

// Given the queried data, plot the pie chart using Flot
function plotPie(div, data) {
   $.plot($(div), data, {
      series: {
	  pie: {
	      show: true,
	      radius: 1,
	      label: { radius: 3/4, 
		       show: true, 
		       formatter: function(label, series){
			  return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'+label+'<br/>'+Math.round(series.percent)+'%</div>';
		       },
		     }
	  }
      },
      legend: { show: false }
   });
}

// Sum up the values in a vector of date/value pairs
function sum(v) {
   var res = 0;
   for (var i=0; i<v.length; ++i) {
      res += v[i][1];
   }
   return res;
}

// Retrieve the data from Django backend and convert to javascript arrays
function processData(project) {
   var success;
   var fail;
   var miss;
   var upstreamSuccess;
   var upstreamFail;
   var upstreamMiss;
   if (project == "nova") {
      success = novaSuccess;//{{ novaSuccess|safe }};
      fail = novaFail;//{{ novaFail|safe }};
      miss = novaMiss//{{ novaMiss|safe }};
      upstreamSuccess = upstreamNovaSuccess;//{{ upstreamNovaSuccess|safe }};
      upstreamFail = upstreamNovaFail;//{{ upstreamNovaFail|safe }};
      upstreamMiss = upstreamNovaMiss;//{{ upstreamNovaMiss|safe }};
   } else if (project == "neutron") {
      success = neutronSuccess;//{{ neutronSuccess|safe }};
      fail = neutronFail;//{{ neutronFail|safe }};
      miss = neutronMiss;//{{ neutronMiss|safe }};
      upstreamSuccess = upstreamNeutronSuccess;//{{ upstreamNeutronSuccess|safe }};
      upstreamFail = upstreamNeutronFail;//{{ upstreamNeutronFail|safe }};
      upstreamMiss = upstreamNeutronMiss;//{{ upstreamNeutronMiss|safe }};
   } else {
      return null;
   }
   var sums = [sum(success),sum(fail),sum(miss)];
   var results = [{label: 'Success', color: '#356AA0', data: success}, 
		{label: 'Failed', color: '#CD4B4B', data: fail},
		{label: 'Missed', color: '#555', data: miss},
		{label: 'Upstream Success', color: '#6755E3', data: upstreamSuccess},
		{label: 'Upstream Failed', color: '#01FCEF', data: upstreamFail},
		{label: 'Upstream Missed', color: '#59DF00', data: upstreamMiss}];
   return [sums,results];
}

// On document load, get the data, plot, and setup various options using JQuery
$(document).ready(function() {
   $('.datepicker').datepicker({ dateFormat: 'yy-mm-dd' });
   var novaData = processData("nova");
   var novaSums = novaData[0];
   novaData = novaData[1];
   insertCheckBoxes("#novachartlegend", novaData, "nova");
   $("#novachartlegend").find("input").click(function() {plotLines("#novachart", novaData);});
   plotLines("#novachart",novaData);

   var novapiedata = [{"label": "Failed", "data": novaSums[1], "color": "#CD4B4B"},
		  {"label": "Success", "data": novaSums[0], "color": "#356AA0"},
		  {"label": "Missed", "data": novaSums[2], "color": "#555"}];
   plotPie("#novapiechart", novapiedata);
   var totalNova = novaSums[0] + novaSums[1] + novaSums[2];
   $("#novaInfo").html("<h3>Total: " + totalNova + "</h3><h3>Success: " + novaSums[1] + "</h3><h3>Failed: " + novaSums[0] + "</h3><h3>Missed: " + novaSums[2] + "</h3>");

   var neutronData = processData("neutron");
   var neutronSums = neutronData[0];
   neutronData = neutronData[1];
   insertCheckBoxes("#neutronchartlegend", neutronData, "neutron");
   $("#neutronchartlegend").find("input").click(function() {plotLines("#neutronchart", neutronData);});
   plotLines("#neutronchart",neutronData);

   var neutronpiedata = [{"label": "Failed", "data": neutronSums[1], "color": "#CD4B4B"},
		  {"label": "Success", "data": neutronSums[0], "color": "#356AA0"},
		  {"label": "Missed", "data": neutronSums[2], "color": "#555"}]
   plotPie("#neutronpiechart", neutronpiedata);
   var totalNeutron = neutronSums[0] + neutronSums[1] + neutronSums[2];
   $("#neutronInfo").html("<h3>Total: " + totalNeutron + "</h3><h3>Success: " + neutronSums[1] + "</h3><h3>Failed: " + neutronSums[0] + "</h3><h3>Missed: " + neutronSums[2] + "</h3>");

   $("<div id='tooltip'></div>").css({
	position: "absolute",
	display: "none",
	border: "1px solid #000",
	padding: "0px",
	"background-color": "#fff",
	opacity: "0.7"
   }).appendTo("body");
});
