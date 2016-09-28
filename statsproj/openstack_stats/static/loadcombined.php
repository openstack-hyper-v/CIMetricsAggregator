<?php
   $arr_raw = str_replace("'", "\"", $_GET['w']);
   $name=$_GET['name'];
   $arr = json_decode($arr_raw);
   if ($arr == NULL) {
      echo "Error";
   }
   $page="/aggregator/combinedReports/" . $name;
   echo "<br />";
   echo "<h3 style='text-align: center;'>Generating combined report for the following:</h3>";
   foreach ($arr as $item) {
      echo "<p style='text-align: center;'>" . $item . "</p>";
   }
   echo "<p style='text-align: center;'><img src='\static\load.gif' /></p>";
   echo "<meta http-equiv='refresh' content='0; url=" . $page . " ' />\n";
?>
