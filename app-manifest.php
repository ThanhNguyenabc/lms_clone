<?php

$partner   = $_REQUEST["partner"] ?? "default";
$start_url = pathinfo($_SERVER["URL"])["dirname"] . "?platform=mobile";
$scope     = "https://" . $_SERVER["HTTP_HOST"];

$info      = parse_ini_file("partners/$partner/system.cfg", true);

echo 
'{ 
  "short_name"      : "' . $info["app"]["shortname"]   . '", 
  "name"            : "' . $info["app"]["name"]        . '", 
  "background_color": "' . $info["app"]["bgcolor"]     . '", 
  "theme_color"     : "' . $info["app"]["themecolor"]  . '", 
  "display"         : "' . $info["app"]["display"]     . '", 
  "orientation"     : "' . $info["app"]["orientation"] . '", 
  "start_url"       : "' . $start_url . '",       
  "scope"           : "' . $scope .     '", 
  "icons":
  [    
   {"src": "partners/' . $partner . '/images/icon-big.png",    "sizes":"512x512", "type":"image/png"},
   {"src": "partners/' . $partner . '/images/icon-medium.png", "sizes":"192x192", "type":"image/png"}
  ] 
}';

?>