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

// Format the time by padding leading zeroes
function pad(n) {
    return (n < 10) ? ("0" + n) : n;
}

// Format the tooltip container for the line charts
function tooltipFormatter(dat,labels) {
   if (showTime)
      output = "<h3 id=\"highlighted\">" + dat.toUTCString() + "</h3>";
   else
      output = "<h3 id=\"highlighted\">" + dat.toUTCString().substr(0, 16) + "</h3>";
   for (var i=0; i<labels.length; ++i) {
      if (!labels[i]) continue;
      var item = labels[i];
      if (item.label == "Outage") {
         output += "<p style=\"color: red;\">Possible Outage</h3>";
      } else {
         output += "<p>" + item.label + " : " + item.val + "</p>";
      }
   }
   return output;
}

// Inserts a checkbox into the desired div for each series in the chart
function insertCheckBoxes(div, data, key) {
   for (var i=0; i<data.length; ++i) {
      if (data[i].data && data[i].label) {
         if (data[i].data.length > 0) {
            $(div).append(checkboxFormatter(data[i].label,key));
         }
      }
   }
}

// Given the queried results, plot the line chart using Flot
function plotLines(div,results) {
   var data = [];
   var container = $(div+"legend");
   container.find("input:checked").each(function() {
      for (var i=0; i<results.length; i+=2) {
	 if (results[i].label && this.name == results[i].label) {
		 data.push(results[i]);
                 if (i <results.length-1) {
		    data.push(results[i+1]);
                 }
	 }
      }
   });
   function xAxisFormatter(val, axis) {
      var found = false;
      for (var i=0; i<data.length; i+=2) {
         for (var j=0; j<data[i].data.length; ++j) {
            var date = data[i].data[j][0];
            if (date == val) {
               found = true;
               break;
            }
         }
      }
      if (!found && !showTime)
         return "";

      var date = new Date(val);
      if (showTime) {
	 return date.getUTCMonth()+1 + "/" +
		date.getUTCDate() + "/" + 
		date.getUTCFullYear() + "\n" + 
		pad(date.getUTCHours()) + ":" + 
		pad(date.getUTCMinutes());
      } else {
	 return date.getUTCMonth()+1 + "/" +
		date.getUTCDate() + "/" + 
		date.getUTCFullYear(); 
      }
   }
   var options = {
      series: {
         curvedLines: {
            active: true,
            nrSplinePoints: 20
         }
      },
      grid: { hoverable: true, autoHighlight: true, backgroundColor: "#fff" },
      xaxis: { tickFormatter: xAxisFormatter, mode: "time" },
      yaxis: { min: 0, minTickSize: 1, tickFormatter: function(val, axis) { return val < axis.max ? val.toFixed(1) : "#"; }},
      legend: { show: true, noColumns: 0, position: "nw"}
   };

   var plot = $.plot($(div), data, options);
   $(div).unbind("plothover");
   $(div).bind("plothover", function (event, pos, item) {
       var date = null;
       if (item) {
          date = item.datapoint[0]; 
       } 
       if (date) {
	  plot.unhighlight();
	  var labels=[];
          var count=0;
	  for (var j=0; j<data.length; ++j) { 
		  for (i=0;i<data[j].data.length;++i) {
		var x = data[j].data[i];
		if (x[0] == date && data[j].label) {
			plot.highlight(j,i);
			labels.push({"label":data[j].label,"val":data[j].data[i][1]});
                        count++;
			break
		}
		  }
	  }
          // Convert to javascript date object
          date = new Date(date);
          if (count>0)
	     $("#tooltip").html(tooltipFormatter(date,labels)).css({top: item.pageY-$("#tooltip").height()+$("#tooltip").height()/2-5, left: item.pageX+15}).fadeIn(200);
       } else {
	  $("#tooltip").hide();
	  plot.unhighlight();
       }
   });
   $(div).mouseleave(function() {
      $("#tooltip").hide();
      plot.unhighlight();
   });
}

// Given the queried data, plot the pie chart using Flot
function plotPie(div, data) {
   $.plot($(div), data, {
      series: {
	  pie: {
			show: true,
			radius: 1,
              stroke: { color: "#eee", width: 0.5 },
			label: { radius: 5/8, 
				 show: true, 
                       threshold: 0.01,
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

   project = project.toLowerCase();

   try {
      success = window[project+'Success'];
      fail = window[project+'Fail'];
      miss = window[project+'Miss'];
   } catch (err) {
      success = []; 
      fail = [];
      miss = [];
   }

   try {
      upstreamSuccess = window['upstream'+project+'Success'];
      upstreamFail = window['upstream'+project+'Fail'];
      upstreamMiss = window['upstream'+project+'Miss'];
   } catch (err) {
      upstreamSuccess = []; 
      upstreamFail = [];
      upstreamMiss = []; 
   }

   var outage = [];
   for (var i=0; i<miss.length; ++i) {
      var date = miss[i][0];
      var found = false;
      for (var j=0; j<success.length; ++j) {
         if (success[j][0] == date) {
            found = true;
            break;
         }
      }
      if (found)
         continue;
      for (var j=0; j<fail.length; ++j) {
         if (fail[j][0] == date) {
            found = true;
            break;
         }
      }
      if (!found)
         outage.push([date,0]);
   }
   var sums = [sum(success),sum(fail),sum(miss)];
   var results = [{label: 'Success', color: '#356AA0', data: success, points: {show: true, symbol: "triangle"}}, 
                {data: success, color: '#356AA0', lines: {show: true, lineWidth: 2}, curvedLines: {apply: true} },
		{label: 'Failed', color: '#CD4B4B', data: fail, points: {show: true, symbol: "square"}},
                {data: fail, color: '#CD4B4B', lines: {show: true, lineWidth: 2}, curvedLines: {apply: true} },
		{label: 'Missed', color: '#555', data: miss, points: {show: true, symbol: "circle"}},
                {data: miss, color: '#555', lines: {show: true, lineWidth: 2}, curvedLines: {apply: true} },
		{label: 'Upstream Success', color: '#6755E3', data: upstreamSuccess, points: {show: true, symbol: "triangle"}},
                {data: upstreamSuccess, color: '#6755E3', lines: {show: true, lineWidth: 2}, curvedLines: {apply: true} },
		{label: 'Upstream Failed', color: '#01FCEF', data: upstreamFail, points: {show: true, symbol: "square"}},
                {data: upstreamFail, color: '#01FCEF', lines: {show: true, lineWidth: 2}, curvedLines: {apply: true} },
		{label: 'Upstream Missed', color: '#59DF00', data: upstreamMiss, points: {show: true, symbol: "circle"}},
                {data: upstreamMiss, color: '#59DF00', lines: {show: true, lineWidth: 2}, curvedLines: {apply: true} },
		{label: 'Outage', color: 'RED', data: outage, points: {show: true, symbol: "exclamation"}, lines: {show: false}}]
   return [sums,results];
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

// On document load, get the data, plot, and setup various options using JQuery
$(document).ready(function() {
   // Set up the datepicker divs
   $('.datepicker').datepicker({ dateFormat: 'yy-mm-dd' });
   $('#total').html(totalSuccess+totalFail+totalMiss);
   $('#success').html(totalSuccess);
   $('#failed').html(totalFail);
   $('#missed').html(totalMiss);
   $('#totalps').html(patchsetSuccess+patchsetFail+patchsetMiss);
   $('#successps').html(patchsetSuccess);
   $('#failedps').html(patchsetFail);
   $('#missedps').html(patchsetMiss);

   for (p in projects) {
      var proj = projects[p].toLowerCase();
      $("#projectStats").append("<h3>" + proj.capitalize() + ":</h3>")
      $("#projectStats").append("<div id=\"" + proj + "Info\" class=\"projectInfo\"></div>"); 
      $("#main").append("<table class=\"graphtable\"><tr class=\"graphheader\"><td colspan=\"2\"><h3 class=\"inline\">"+proj.capitalize()+" Tests</h3><div class=\"legend\" id=\"" + proj + "chartlegend\"></div></td></tr><tr><td class=\"linechart\" id=\""+proj+"chart\"></td><td class=\"piechart\" id=\""+proj+"piechart\"></td></tr></table>");
	// Process the nova data and setup the nova charts
	var data = processData(proj);
	var sums = data[0];
	var total = sums[0] + sums[1] + sums[2];
	$("#"+proj+"Info").html("<strong>Total: " + total + "</strong><br /><strong>Success: " + sums[0] + "</strong><br /><strong>Failed: " + sums[1] + "</strong><br /><strong>Missed: " + sums[2] + "</strong>");
	if (total > 0) {
		data = data[1];
		insertCheckBoxes("#"+proj+"chartlegend", data, proj);
		$("#"+proj+"chartlegend").find("input").on("click", { proj: proj, data: data }, function(event) {plotLines("#"+event.data.proj+"chart", event.data.data); } );
		plotLines("#"+proj+"chart",data);

		var piedata = [{"label": "Failed", "data": sums[1], "color": "#CD4B4B"},
			  {"label": "Success", "data": sums[0], "color": "#356AA0"},
			  {"label": "Missed", "data": sums[2], "color": "#555"}];
		plotPie("#"+proj+"piechart", piedata);
	} else {
		$("#"+proj+"chart").html("<p>No data available or " + proj + " has been unselected in data model.</p>").css({height: 'auto'});
	}
   }

   $("#sidebar").css({"width": "auto", "max-width": "200px"});
   $("#sidebar").width("auto");
   $("#main").css("padding-left", 20);
   $("#print").click(function(e) {
      var win = window.open();
      win.document.write("<table>");
      for (p in projects) {
         var proj = projects[p].toLowerCase();
         win.document.write("<tr><td><h3>"+proj+"</h3>"+$("#"+proj+"Info").html()+"</td>");
			win.document.write("<td><img src=\""+$("#"+proj+"chart").children()[0].toDataURL()+"\"/></td>");
			win.document.write("<td><img src=\""+$("#"+proj+"piechart").children()[0].toDataURL()+"\"/></td></tr>");
      }
      win.document.write("</table>");
      win.print();
      win.close();
   });
});
