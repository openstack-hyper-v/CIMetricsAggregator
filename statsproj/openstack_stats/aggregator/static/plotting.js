   function labelFormatter(label, series) {
      return "<div class='pielabel'>" + label + "<br/>" + Math.round(series.percent) + "%</div>";
   }
   $(document).ready(function() {
      $('.datepicker').datepicker({ dateFormat: 'yy-mm-dd' });

      {% if novasuccesses.count > 0 or novafailures.count > 0 %}
      var novapiedata = [{"label": "Failures", "data": {{ novafailures.count }}, "color": "#CD4B4B"},
                     {"label": "Successes", "data": {{ novasuccesses.count }}, "color": "#EDC240"}];
      $.plot($('#novapiechart'), novapiedata, {
         series: {
             pie: {
                 show: true,
                 label: { show: true, formatter: labelFormatter, background: { opacity: 0.5, color: '#000' }},
             }
         },
         legend: { show: false }
      });
      {% endif %}

      {% if neutronsuccesses.count > 0 or neutronfailures.count > 0 %}
      var neutronpiedata = [{"label": "Failures", "data": {{ neutronfailures.count }}, "color": "#CD4B4B"},
                     {"label": "Successes", "data": {{ neutronsuccesses.count }}, "color": "#EDC240"}];
      $.plot($('#neutronpiechart'), neutronpiedata, {
         series: {
             pie: {
                 show: true,
                 label: { show: true, formatter: labelFormatter, background: { opacity: 0.5, color: '#000' }},
             }
         },
         legend: { show: false }
      });
      {% endif %}

      {% if novasuccesses.count > 0 or novafailures.count > 0 %}
      var novafaildata = {};
      var novapassdata = {};
      {% for f in novafailures %}
      if (!("{{ f.date }}" in novafaildata)) {
         novafaildata["{{ f.date }}"] = 1;
      }
      else {
         var dat = novafaildata["{{ f.date }}"] + 1;
         novafaildata["{{ f.date }}"] = dat; 
      }
      {% endfor %}
      {% for s in novasuccesses %}
      if (!("{{ s.date }}" in novapassdata)) {
         novapassdata["{{ s.date }}"] = 1;
      }
      else {
         var dat = novapassdata["{{ s.date }}"] + 1;
         novapassdata["{{ s.date }}"] = dat; 
      }
      {% endfor %}
      novafail_flot = [];
      novapass_flot = [];
      var x = 0;
      for (var key in novafaildata) {
         if (key == 0.0) {
            continue;
         }
         var tuple = [key,novafaildata[key]];
         novafail_flot.push(tuple);
      }
      for (var key in novapassdata) {
         if (key == 0.0) {
            continue;
         }
         var tuple = [key,novapassdata[key]];
         novapass_flot.push(tuple);
      }

      $.plot($('#novachart'), [{label: 'Passing', color: 'blue', data: novapass_flot}, {label: 'Failing', color: 'red', data: novafail_flot}], {
         series: { lines: { show: true }, points: { show: true } },
         grid: { hoverable: true, backgroundColor: { colors: ["#fff", "#eee"] } },
         xaxis: { mode: "time", timeformat: "%Y-%m-%d" },
         yaxis: { tickFormatter: function(val, axis) { return val < axis.max ? val : "#"; }},
         legend: { show: true, position: "nw" }
      });
      {% endif %}

      {% if neutronsuccesses.count > 0 or neutronfailures.count > 0 %}
      var neutronfaildata = {};
      var neutronpassdata = {};
      {% for f in neutronfailures %}
      if (!("{{ f.date }}" in neutronfaildata)) {
         neutronfaildata["{{ f.date }}"] = 1;
      }
      else {
         var dat = neutronfaildata["{{ f.date }}"] + 1;
         neutronfaildata["{{ f.date }}"] = dat; 
      }
      {% endfor %}
      {% for s in neutronsuccesses %}
      if (!("{{ s.date }}" in neutronpassdata)) {
         neutronpassdata["{{ s.date }}"] = 1;
      }
      else {
         var dat = neutronpassdata["{{ s.date }}"] + 1;
         neutronpassdata["{{ s.date }}"] = dat; 
      }
      {% endfor %}
      neutronfail_flot = [];
      neutronpass_flot = [];
      var x = 0;
      for (var key in neutronfaildata) {
         if (key == 0.0) {
            continue;
         }
         var tuple = [key,neutronfaildata[key]];
         neutronfail_flot.push(tuple);
      }
      for (var key in neutronpassdata) {
         if (key == 0.0) {
            continue;
         }
         var tuple = [key,neutronpassdata[key]];
         neutronpass_flot.push(tuple);
      }
      $.plot($('#neutronchart'), [{label: 'Passing', color: 'blue', data: neutronpass_flot}, {label: 'Failing', color: 'red', data: neutronfail_flot}], {
         series: { lines: { show: true }, points: { show: true } },
         grid: { hoverable: true, backgroundColor: { colors: ["#fff", "#eee"] } },
         xaxis: { mode: "time", timeformat: "%Y-%m-%d" },
         yaxis: { tickFormatter: function(val, axis) { return val < axis.max ? val : "#"; }},
         legend: { show: true, position: "nw" }
      });
      {% endif %}

      $("<div id='tooltip'></div>").css({
           position: "absolute",
           display: "none",
           border: "1px solid #fdd",
           padding: "2px",
           "background-color": "#fee",
           opacity: 0.80
      }).appendTo("body");
      $(".linechart").bind("plothover", function (event, pos, item) {
          if (item) {
             var dat = new Date(item.datapoint[0]);
             $("#tooltip").html(dat.toDateString() + " : " + item.datapoint[1]).css({top: item.pageY+5, left: item.pageX+5}).fadeIn(200);
          } else {
             $("#tooltip").hide();
          }
      });
   });

