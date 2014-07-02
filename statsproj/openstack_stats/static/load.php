<?php
   $page = "/aggregator/" . $_GET['p'];
   echo "<br />";
   echo "<h3 style='text-align: center;'>Generating report for " . $_GET['p'] . "</h3>";
   echo "<p style='text-align: center;'><img src='\static\load.gif' /></p>";
   echo "<meta http-equiv='refresh' content='0; url=" . $page . " ' />\n";
?>
