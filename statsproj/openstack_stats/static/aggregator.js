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
      if (data[i].data.length > 0) {
         $(div).append(checkboxFormatter(data[i].label,key));
      }
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
   function xAxisFormatter(val, axis) {
      var found = false;
      for (var i=0; i<data.length; ++i) {
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
   var plot = $.plot($(div), data, {
      series: { lines: { show: true }, points: { show: true } },
      grid: { hoverable: true, autoHighlight: false, backgroundColor: "#fff" },
      xaxis: { tickFormatter: xAxisFormatter, mode: "time" },
      yaxis: { minTickSize: 1, tickFormatter: function(val, axis) { return val < axis.max ? val.toFixed(1) : "#"; }},
      legend: { show: true, noColumns: 0, position: "nw"},
   });
   $(div).unbind("plothover");
   $(div).bind("plothover", function (event, pos, item) {
       var date = null;
       if (item) {
          date = item.datapoint[0]; 
       } 
       if (date) {
	  plot.unhighlight();
	  var labels=[];
	  for (var j=0; j<data.length; ++j) { 
	     for (i=0;i<data[j].data.length;++i) {
		var x = data[j].data[i];
		if (x[0] == date) {
		   plot.highlight(j,i);
		   labels.push({"label":data[j].label,"val":data[j].data[i][1]});
		   break
		}
	     }
	  }
          // Convert to javascript date object
          date = new Date(date);
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
      try {
         success = novaSuccess;
         fail = novaFail;
         miss = novaMiss;
      } catch (err) {
         success = []; 
         fail = [];
         miss = [];
      }

      try {
         upstreamSuccess = upstreamNovaSuccess;
         upstreamFail = upstreamNovaFail;
         upstreamMiss = upstreamNovaMiss;
      } catch (err) {
         upstreamSuccess = []; 
         upstreamFail = [];
         upstreamMiss = []; 
      }
   } else if (project == "neutron") {
      try {
         success = neutronSuccess;
         fail = neutronFail;
         miss = neutronMiss;
      } catch (err) {
         success = []; 
         fail = [];
         miss = [];
      }
      try {
         upstreamSuccess = upstreamNeutronSuccess;
         upstreamFail = upstreamNeutronFail;
         upstreamMiss = upstreamNeutronMiss;
      } catch (err) {
         upstreamSuccess = []; 
         upstreamFail = [];
         upstreamMiss = []; 
      }
   } else {
      return null;
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
   var results = [{label: 'Success', color: '#356AA0', data: success, points: {symbol: "triangle"}}, 
		{label: 'Failed', color: '#CD4B4B', data: fail, points: {symbol: "square"}},
		{label: 'Missed', color: '#555', data: miss, points: {symbol: "circle"}},
		{label: 'Upstream Success', color: '#6755E3', data: upstreamSuccess, points: {symbol: "triangle"}},
		{label: 'Upstream Failed', color: '#01FCEF', data: upstreamFail, points: {symbol: "square"}},
		{label: 'Upstream Missed', color: '#59DF00', data: upstreamMiss, points: {symbol: "circle"}},
		{label: 'Outage', color: 'RED', data: outage, points: {symbol: "exclamation"}, lines: {show: false}}]
   return [sums,results];
}

// On document load, get the data, plot, and setup various options using JQuery
$(document).ready(function() {
   // Set up the datepicker divs
   $('.datepicker').datepicker({ dateFormat: 'yy-mm-dd' });
   $('#total').html("Total: " + (totalSuccess+totalFail+totalMiss));
   $('#success').html("Success: " + totalSuccess);
   $('#failed').html("Failed: " + totalFail);
   $('#missed').html("Missed: " + totalMiss);

   // Process the nova data and setup the nova charts
   var novaData = processData("nova");
   var novaSums = novaData[0];
   var totalNova = novaSums[0] + novaSums[1] + novaSums[2];
   $("#novaInfo").html("<h3>Total: " + totalNova + "</h3><h3>Success: " + novaSums[1] + "</h3><h3>Failed: " + novaSums[0] + "</h3><h3>Missed: " + novaSums[2] + "</h3>");
   if (totalNova > 0) {
      novaData = novaData[1];
      insertCheckBoxes("#novachartlegend", novaData, "nova");
      $("#novachartlegend").find("input").click(function() {plotLines("#novachart", novaData);});
      plotLines("#novachart",novaData);

      var novapiedata = [{"label": "Failed", "data": novaSums[1], "color": "#CD4B4B"},
		     {"label": "Success", "data": novaSums[0], "color": "#356AA0"},
		     {"label": "Missed", "data": novaSums[2], "color": "#555"}];
      plotPie("#novapiechart", novapiedata);
   } else {
      $("#novachart").html("<p>No data available or has been unselected in data model.</p>").css({height: 'auto'});
   }

   // Process the neutron data and setup the neutron charts
   var neutronData = processData("neutron");
   var neutronSums = neutronData[0];
   var totalNeutron = neutronSums[0] + neutronSums[1] + neutronSums[2];
   $("#neutronInfo").html("<h3>Total: " + totalNeutron + "</h3><h3>Success: " + neutronSums[1] + "</h3><h3>Failed: " + neutronSums[0] + "</h3><h3>Missed: " + neutronSums[2] + "</h3>");
   if (totalNeutron > 0) {
      neutronData = neutronData[1];
      insertCheckBoxes("#neutronchartlegend", neutronData, "neutron");
      $("#neutronchartlegend").find("input").click(function() {plotLines("#neutronchart", neutronData);});
      plotLines("#neutronchart",neutronData);

      var neutronpiedata = [{"label": "Failed", "data": neutronSums[1], "color": "#CD4B4B"},
		     {"label": "Success", "data": neutronSums[0], "color": "#356AA0"},
		     {"label": "Missed", "data": neutronSums[2], "color": "#555"}]
      plotPie("#neutronpiechart", neutronpiedata);
   } else {
      $("#neutronchart").html("<p>No data available or has been unselected in data model.</p>").css({height: 'auto'});
   }
});
