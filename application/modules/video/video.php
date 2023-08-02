<?php

// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         V I D E O                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



function Video_Read($source, $native = "en")
{
 $script           = [];
 $script["source"] = $source;
 
 // LOAD INFO
 if(file_exists("$source/info.dat"))
 {
  $script["info"] = parse_ini_file("$source/info.dat", true);
 }

 
 // LOAD SUBTITLES
 /*
 $files = Storage_Files_Collect($source, ["srt"]);
 foreach($files as $file)
 {
  $filename = Storage_Path_GetFilename($file);
  $name     = preg_replace('/\\.[^.\\s]{3,4}$/', '', $filename);
  $lang     = trim(mb_strtolower($name));
  
  $script["subtitles"][$lang] = SRT_File_Read($file);
 }
 */
 
 // LOAD MAIN SUBTITLES (SCRIPT.SRT, AS EN)
 $srt                          = SRT_File_Read("$source/script.srt");
 $script["subtitles"][$native] = $srt;
 
 
 // BUILD SUBTITLES IN OTHER AVAILABLE LANGUAGES
 $files = Storage_Files_Collect($source, ["txt"]);
 foreach($files as $file)
 {
  $filename = Storage_Path_GetFilename($file);
  $name     = Storage_Path_RemoveExtension($filename);
  $lang     = trim(mb_strtolower($name));
  
  if($lang != $native && $lang != "script")
  {
   // COPY THE ORIGINAL SRT FILE
   $trans    = $srt;
   
   // OPEN TXT FILE WITH TRANSLATION
   $text = file_get_contents($file);
   $text = explode("\r\n", $text);
   
   // ASSIGN TRANSLATIONS LINE BY LINE TO THE SRT COPY
   for($i = 0, $c = count($text); $i < $c; $i++)
   {
	$line = $text[$i];                       
	$line = explode(":", $line);           // BREAK LINE IN COMPONENTS
	$line = trim($line[count($line) - 1]); // LAST ELEMENT IN THE LINE IS THE SPOKEN TEXT
	
	$trans[$i]["text"] = $line;
   }
   
   $script["subtitles"][$lang] = $trans;
  }
 }
 
 
 // LOAD VOCABULARY
 $list = [];
  
 // IF THERE IS A VOCAB LIST IN THE VIDEO FILE, LOAD IT
 if(isset($script["info"]["vocabulary"]))
 {
  $words = $script["info"]["vocabulary"];
  $list  = array_merge($list, array_values($words));
 }
 
 // IF THERE IS A VOCAB LIST IN THE VIDEO'S PARENT DIRECTORY, LOAD IT
 {
  $parent          = Storage_Path_GetFolder($source);
  $info            = parse_ini_file("$parent/info.dat", true);
  
  // MAIN
  if(isset($info["vocabulary"])) 
  {
   $words = $info["vocabulary"];
   $list  = array_merge($list, array_values($words));
  }
  
  // EXTRAS, TOO
  if(isset($info["vocabulary extras"])) 
  {
   $words = $info["vocabulary extras"];
   $list  = array_merge($list, array_values($words));
  }
 }
 
 $script["terms"] = Vocabulary_Read_Terms($list);

 
 
 // LOAD EVENTS
 /*
 $script["events"] = [];
 if(file_exists("$path/events.dat"))
 {
  $events    = parse_ini_file("$path/events.dat", true);
  $timecodes = array_keys($events);
  
  foreach($timecodes as $timecode)
  {
   $event               = $events[$timecode];
   $event["time-start"] = (floor(Time_FromTimecode($timecode) / 10) * 10);
   $event["time-end"]   = $event["time-start"] + floor(intval($event["duration"]) * 1000);
   
   array_push($script["events"], $event);
  }
 }
 */


 // LOAD TESTS
 /*
 $script["tests"] = [];
 
 $files = Disk_SearchFiles($path, ["dat"], false);
 foreach($files as $file)
 {
  $filename = Disk_Path_Filename($file);
  $name     = preg_replace('/\\.[^.\\s]{3,4}$/', '', $filename);
  $lang     = trim(mb_strtolower($name));
  
  if(mb_strpos($name, "test") !== false)
  {
   $test     = parse_ini_file($file, true);
   array_push($script["tests"], $test);
  }
 }
 */
 
 return $script;
}



?>