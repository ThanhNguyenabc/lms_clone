<?PHP


// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          N U M B E R S                                         //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function Numbers_Between($x, $a, $b)
{
 return $x >= $a && $x <= $b;
}



function Numbers_Within($x, $a, $b)
{
 return $x > $a && $x < $b;
}



function Numbers_Range_Overlap($a, $b)
{
 return (($a["from"] == $b["from"]) && ($a["to"] == $b["to"]));
}



function Numbers_Range_Intersect($ra, $rb)
{
 return Numbers_Within($ra["from"], $rb["from"], $rb["to"]) || Numbers_Within($ra["to"],   $rb["from"], $rb["to"]) || Numbers_Within($rb["from"], $ra["from"], $ra["to"]) || Numbers_Within($rb["to"], $ra["from"], $ra["to"])  || Numbers_Range_Overlap($ra, $rb);
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       S T R I N G S                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function String_Copycount_Get($string, $delimiter_a = "(", $delimiter_b = ")")
{
 $a = mb_strrpos($string, $delimiter_a);
 $b = mb_strrpos($string, $delimiter_b);
 

 if($b > $a)
 {
  $count = mb_substr($string, $a + 1, $b - $a - 1);
  
  if(is_numeric($count)) return intval($count);
 }
}





function String_Copycount_Set($string, $count, $delimiter_a = "(", $delimiter_b = ")")
{
 $current = String_Copycount_Get($string, $delimiter_a, $delimiter_b);
 if($current)
 { 
  $a = mb_strrpos($string, $delimiter_a);
  $b = mb_strrpos($string, $delimiter_b);
  
  $head = mb_substr($string, 0, $a);
  $tail = mb_substr($string, $b + 1, mb_strlen($string) - $b);
  
  return $head . $delimiter_a . $count . $delimiter_b . $tail;
 }
 else
 {
  return $string . " " . $delimiter_a . $count . $delimiter_b; 
 }
}




function String_Copycount_Next($string, $delimiter_a = "(", $delimiter_b = ")")
{
 $current = String_Copycount_Get($string, $delimiter_a, $delimiter_b);
 if(!$current) $current = 1; else $current = $current + 1;
 
 return String_Copycount_Set($string, $current, $delimiter_a, $delimiter_b);
}




function String_Filter_AllowDigits($string)
{
 return preg_replace('/[^0-9.]+/', '', $string);
}



function String_Variables_Apply($string, $variables, $delimiter = "%")
{
 foreach($variables as $key => $value)
 {
  $string = str_replace($delimiter . $key . $delimiter, $value, $string);
 }
 
 return $string;
}




// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         A R R A Y S                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function Array_Catalog_ByField($array, $field, $unique = false)
{
 $catalog = [];
 
 foreach($array as $item)
 {
  $value = $item[$field];
  
  if($unique)
  {
   $catalog[$value] = $item;
  }
  else
  {
   if(!isset($catalog[$value])) $catalog[$value] = [];
   array_push($catalog[$value], $item);
  }
 }
 
 return $catalog;
}



function Array_Filter_ByMarkers($array, $markers, $mode = "with")
{
 $filtered = [];
 $keys     = array_keys($markers);
 
 switch($mode)
 {
  case "with":
	foreach($array as &$item)
	{
	 $valid = true;
	 
	 foreach($keys as $key)
	 {
	  if($item[$key] != $markers[$key]) 
	  {
	   $valid = false;
	   break;
	  }
	 }
	 
	 if($valid) array_push($filtered, $item);
	}
  break;
 
  case "without":
	foreach($array as &$item)
	{
	 $valid = true;
	 
	 foreach($keys as $key)
	 {
	  if($item[$key] == $markers[$key]) 
	  {
	   $valid = false;
	   break;
	  }
	 }
	 
	 if($valid) array_push($filtered, $item);
	}
  break;
 }
 
 return $filtered;
}



function Array_Catalog_AsIndex($array, $index_field, $value_field = false, $list = false)
{
 $catalog = [];
 
 foreach($array as $item)
 {
  $index = $item[$index_field];
  
  // STORE THE VALUE OF A SPECIFIC ITEM FIELD, OR THE WHOLE ITEM?
  if($value_field) $value = $item[$value_field]; else $value = $item;
	
  // MAKE LISTS OR JUST STORE UNIQUE VALUES?	
  if($list)
  {
   // LIST OF VALUES
   if(!isset($catalog[$index])) $catalog[$index] = [];
   array_push($catalog[$index], $value);
  }
  else
  {
   // SINGLE VALUE
   $catalog[$index] = $value;
  }
 }
 
 return $catalog;
}



function Array_Integrate(&$dest, $dest_field, $source, $source_field = false, $store = false)
{
 // IF A MATCHING FIELD IS NOT SPECIFIED, THEN WE ASSUME THEY ARE THE SAME FIELD IN BOTH SETS
 if(!$source_field) $source_field = $dest_field;
 
 // SCAN DESTINATION ROWS
 foreach($dest as &$dest_row)
 {
  $search = $dest_row[$dest_field];
  
  // SEARCH FOR A ROW IN SOURCE, THAT HAS THE SAME MATCHING FIELD VALUE AS THIS ROW IN DEST
  foreach($source as $source_row)
  {
   // IF FOUND, MERGE
   if($source_row[$source_field] == $search)
   {
	// IF A SUBSTORE IS DEFINED, JUST ATTACH THE SOURCE ROW TO THE DEST ROW AS A SUBFIELD...
	if($store)
	{
	 $dest_row[$store] = $source_row;
	}
	else  
    // ...OTHERWISE MERGE THE TWO ROWS' VALUES
    {
     foreach($source_row as $key => $value) $dest_row[$key] = $value;
	}
    
	break;
   }
  }
  
 }
}


function Array_Integrate_Direct(&$dest, $field, $data, $store = false)
{
 foreach($dest as &$row)
 {
  $id     = $row[$field];
  $source = $data[$id];
  
  if($store)
  {
   $row[$store] = $source;
  }
  else
  {
   foreach($source as $key => $value) $row[$key] = $value;	 
  }
 }
}




function Array_Subset_Fields($array, $fields)
{
 $subset = [];
 
 foreach($fields as $field) $subset[$field] = $array[$field];
 
 return $subset;
}





function Array_Fields_JSONParse(&$array, $fields)
{
 $keys = array_keys($array);
 
 foreach($keys as $key)
 {
  if(in_array($key, $fields))
  {
   $array[$key] = json_decode($array[$key], true);
  } 
 }
}



function Array_Items_JSONParse(&$array, $fields)
{
 foreach($array as &$item) Array_Fields_JSONParse($item, $fields);
}



function Array_Item_Delete(&$array, $item, $direct = false)
{
 if($direct)
 {
  $index = $item;
 }
 else
 {
  $index = array_search($item, $array);
 }
 
 
 if($index !== false) array_splice($array, $index, 1);
}



function Array_Filter_Blanks($array)
{
 $filtered = array_filter($array, 
 function($value)
 {	 
  return ($value !== '');
 });
 
 return $filtered;
}




// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                        D A T E S                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Date_From_PHP($phpdate)
{
 $date = $phpdate->format("YmdHi");
 
 return $date;
}



function Date_To_PHP($date)
{
 $phpdate = date_create($date);
 
 return $phpdate; 
}



function Date_Now()
{
 if(isset($_SESSION["forcetime"]))  
 {
  if($_SESSION["forcetime"] == 0) 
  {
   unset($_SESSION["forcetime"]);
  }
  else
  {
   return $_SESSION["forcetime"];
  }
 }
 
 $phpdate = date_create();
 $date    = Date_From_PHP($phpdate);
 
 return $date;
}




function Date_Add_Minutes($date, $minutes)
{	
 $t        = Date_To_PHP($date); 
 $interval = new DateInterval('PT'.abs($minutes).'M');
 
 if($minutes>0) $t->add($interval); else if($minutes<0) $t->sub($interval);
 
 return $t->format("YmdHi");
}



function Date_Add_Days($date, $days)
{	
 $t        = Date_To_PHP($date); 
 $interval = new DateInterval('P'.abs($days).'D');
 
 if($days>0) $t->add($interval); else if($days<0) $t->sub($interval);
 
 return $t->format("YmdHi");
}



function Date_Distance_Days($a, $b)
{
 $a = Date_To_PHP($a);
 $b = Date_To_PHP($b);
 
 $d    = $a->diff($b);
 
 $days = $d->days;
 if($d->invert == 1) $days = -$days;
 
 return $days;
}


function Date_Format_NoSeconds($date)
{
 return substr($date, 0, 12);
}



function Date_Format_As($date, $format = false)
{
 switch($format)
 {
  case "date-only":
	$date = substr($date, 0, 8);
  break;
  
  case "time-only":
	$date = substr($date, 8, 4);
  break;
  
  case "no-seconds":
	$date = substr($date, 0, 12);
  break;
 }
 
 return $date;
}



function Date_Valid($date)
{
 return (gettype($date) == "string") && (mb_strlen($date) >= 8);
}



function Date_Ranges_Extremes(&$dates, $from_id = "date_start", $to_id = "date_end")
{
 if(!$dates || count($dates) == 0)
 {
  $date_from = "197001010000";
  $date_to   = "999901010000";
 }
 else
 {
  $date_from = "999901010000";
  $date_to   = "197001010000";
 
  foreach($dates as &$date)
  {
   if($date[$from_id] < $date_from) $date_from = $date[$from_id];
   if($date[$to_id]   > $date_to)   $date_to   = $date[$to_id];
  }
 }
 
 $range              = [];
 $range["date_from"] = $date_from;
 $range["date_to"]   = $date_to;
 
 return $range;
}



function Time_To_Minutes($time)
{
 $time    = String_Filter_AllowDigits($time);
 
 $hours   = intval(substr($time, 0, 2));
 $minutes = intval(substr($time, 2, 2));
 
 return ($hours * 60) + $minutes;
}




// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       S T O R A G E                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function Storage_Path_Sanitize($path, $slash = "/")
{
 switch($slash)
 {
  case "/":
	$path = str_replace("\\", "/", $path);
  break;
  
  case "\\":
	$path = str_replace("/", "\\", $path);
  break;
 }
 
 return $path;
}





function Storage_Path_RemoveExtension($path)
{
 return substr($path, 0 , (strrpos($path, ".")));
}




function Storage_Path_GetFolder($path)
{
 $info = pathinfo($path);
 
 return $info["dirname"];
}



function Storage_Path_GetFilename($path)
{
 $info = pathinfo($path);
 
 return $info["basename"];
}



function Storage_Path_GetExtension($path)
{
 $info = pathinfo($path);
 
 return $info["extension"];
}


function Storage_Path_Create($path)
{
 if(!file_exists($path)) mkdir($path, 0777, true);
}



function Storage_Path_Map($root, $options = [])
{	 
 $map     = [];
 $uproot  = in_array("uproot",  $options);
 $recurse = in_array("recurse", $options);
 
 $folders    = array(); 
 $folders[0] = $root;
  
 while(count($folders)>0)
 {
  $folder = $folders[0];
  array_splice($folders, 0, 1);
  
  $data = scandir($folder);
  
  foreach($data as $item)
  {
   if(($item!='.') && ($item!='..'))
   {
	$file = "$folder/$item";
   
    if(is_dir($file))
    {
     if($uproot) $id = str_replace("$root/", "", $file); else $id = $file;
     $map[$id] = [];
	 
	 if($recurse) array_push($folders, $file);
    }
   }
  }
 }
 
 return $map;
}



function Storage_Files_Collect($root, $types, $options = [])
{	
 $folders = array();
 $files   = array();
 
 $folders[0] = $root;
 
 $recurse = in_array("recurse", $options);
 $uproot  = in_array("uproot",  $options);
 
 while(count($folders)>0)
 {
  $folder = $folders[0];
  array_splice($folders, 0, 1);
  
  $data = scandir($folder);
  
  foreach($data as $item)
  {
   if(($item!='.') && ($item!='..'))
   {
	$file = "$folder/$item";
   
    if(is_dir($file))
    {
     if($recurse) array_push($folders, $file);  
    }
    else
    {
     $ext = pathinfo($file, PATHINFO_EXTENSION);
	 if(!$types || in_array($ext, $types)) 
	 {
	  if($uproot) $id = str_replace("$root/", "", $file); else $id = $file;
    
      array_push($files, $id);
	 }
    } 
   }
  }
 }
 
 return $files;
}





function Storage_Folders_Collect($root, $options = [])
{	
 $folders = array();
 $files   = array();
 
 $folders[0] = $root;
 
 $recurse = in_array("recurse", $options);
 $uproot  = in_array("uproot",  $options);
 
 while(count($folders)>0)
 {
  $folder = $folders[0];
  array_splice($folders, 0, 1);
  
  $data = scandir($folder);
  
  foreach($data as $item)
  {
   if(($item!='.') && ($item!='..'))
   {
	$file = "$folder/$item";
   
    if(is_dir($file))
    {
     if($recurse) array_push($folders, $file);  
	 
	 if($uproot) $id = str_replace("$root/", "", $file); else $id = $file;
     array_push($files, $id);
    }
	
   }
  }
 }
 
 return $files;
}






function Storage_Files_Read($files, $mode, $root = "", $options = [])
{
 $noext = in_array("noext",  $options);

 if($root != "") $root = "$root/"; 
 
 
 // PREPARE POOL
 switch($mode)
 {
  case "stream":
	$data = "";
  break;
  
  default:
	$data  = [];	
  break;
 }
 
 
 // SCAN FILES
 foreach($files as $file)
 {
  // READ FILE AS BINARY BLOB OR TEXT 
  switch($mode)
  {
   case "binary":
	$contents = file("$root$file");
   break;
   
   case "ini":
    $contents = parse_ini_file("$root$file", true);
   break;
    
   default: 
	$contents = file_get_contents("$root$file");
   break;
  }  
  
  $id            = $file;
  if($noext) $id = Storage_Path_RemoveExtension($id);


  // ADD FILE TO POOL
  switch($mode)
  {
   case "stream":
	$data = $data . $contents;
   break;
   
   default:
	$data[$id] = $contents;  
   break;
  }
  
 }	 
 
 
 return $data;
}




function Storage_File_Delete($path)
{
 unlink($path);
}




function Storage_File_Create($filename, $data = false)
{
 $path = Storage_Path_GetFolder($filename);
 
 Storage_Path_Create($path);
 
 if($data) 
 {
  file_put_contents($filename, $data);
 }
 else 
 {
  return fopen($filename, "w+");
  }
}




function Storage_File_Upload($dest)
{ 
 if(file_exists($dest)) unlink($dest);
 else
 {
  $folder = Storage_Path_GetFolder($dest);
  if(!file_exists($folder)) Storage_Path_Create($folder);
 }
 
 $data = base64_decode(file_get_contents("php://input"));
 
 $file = fopen($dest, "x+");
 fwrite($file, $data);
 fclose($file);
 
 return $dest;
}




function Storage_Folder_ListFiles($folder, $filter = false)
{
 $files = scandir($folder);
 
 Array_Item_Delete($files, ".");
 Array_Item_Delete($files, "..");
 
 
 if($filter)
 {
  $filtered = [];
  
  foreach($files as $file) if(fnmatch($filter, $file))
  {
   array_push($filtered, $file);
  }

  $files = $filtered;  
 }
 
 return $files;
}





function Storage_Folder_ListFolders($folder)
{
 $files = scandir($folder);
 $list  = [];
 
 foreach($files as $file) if($file != "." && $file != ".." && is_dir("$folder/$file")) array_push($list, $file);
 
 return $list;
}




function Storage_Folder_Empty($folder)
{
 array_map("unlink", glob("$folder/*.*"));
}




function Storage_Folder_Delete($dir)
{ 
 if(!$dir) return;
 
 $files = array_diff(scandir($dir), array('.', '..')); 

 foreach($files as $file) 
 { 
  (is_dir("$dir/$file")) ? Storage_Folder_Delete("$dir/$file") : unlink("$dir/$file"); 
 }

 rmdir($dir); 
} 



function Storage_Folder_Download($dir)
{
 $zipfile = tempnam(sys_get_temp_dir(), "temp");
 
 Zip_Folder($dir, $zipfile, ["recurse"]);
 
 header('Content-Description: File Transfer');
 header('Content-Type: application/octet-stream');
 header('Content-Disposition: attachment; filename=' . basename($zipfile));
 header('Content-Transfer-Encoding: binary');
 header('Expires: 0');
 header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
 header('Pragma: public');
 header('Content-Length: ' . filesize($zipfile));
 
 ob_clean();
 flush();
 readfile($zipfile);
 
 unlink($zipfile);
}










//-----------------------------------------------------------------------------------------------//
//                                                                                               //
//                                     I N I    F I L E S                                        //
//                                                                                               //
//-----------------------------------------------------------------------------------------------//



function Ini_Key_Read($filename, $section, $key)
{
 $ini = parse_ini_file($filename, true);
 
 return $ini[$section][$key];
}




function Ini_Key_Write($filename, $section, $field, $value)
{	
 $ini = parse_ini_file($filename, true);
  
 $ini[$section][$field] = $value;
 
 $res = array();
 foreach($ini as $key => $val)
 {
  if(is_array($val))
  {
   $res[] = "\r\n[$key]";
   
   foreach($val as $skey => $sval) $res[] = "$skey = " . (is_numeric($sval) ? $sval : '"' . $sval . '"');
  }
  else $res[] = "$key = " . (is_numeric($val) ? $val : '"'.$val.'"');
 }
 
 $data = implode("\r\n", $res);
 
 
 $file = Storage_File_Create($filename);
 fwrite($file, $data);
 fclose($file);    
}





function Ini_Section_Read($filename, $section)
{
 $ini = Ini_File_Read($filename);
  
 return $ini[$section];
}





function Ini_Section_Write($filename, $section, $data)
{	
 $data = (array) $data;
 
 $ini = Ini_File_Read($filename);
  
 $ini[$section] = $data;
 
 Ini_File_Write($filename, $ini);
}



function Ini_Section_Delete($filename, $section)
{	 
 $ini = Ini_File_Read($filename);
  
 unset($ini[$section]);
 
 Ini_File_Write($filename, $ini);
}





function Ini_File_Read($filename)
{
 $ini = parse_ini_file($filename, true);

 return $ini;
}





function Ini_File_Write($filename, $ini)
{	
 $ini      = (array) $ini; 	
 $sections = array_keys($ini);

 $data     = "";
 
 foreach($sections as $section)
 { 
  $ini[$section] = (array) $ini[$section];
  $keys          = array_keys($ini[$section]);
  
  $data = $data . "[$section]\r\n";
  	 
  foreach($keys as $key)
  {	  
   $value = $ini[$section][$key];
   $data  = $data . "$key = \"$value\"\r\n";
  }
  
  $data = $data . "\r\n\r\n";
 }	 
 
 
 $folder = Storage_Path_GetFolder($filename);
 if(!file_exists($folder)) Storage_Path_Create($folder);

 $data = mb_convert_encoding($data, "UTF-8");
 file_put_contents($filename, $data);
}








//-----------------------------------------------------------------------------------------------//
//                                                                                               //
//                                     Z I P    F I L E S                                        //
//                                                                                               //
//-----------------------------------------------------------------------------------------------//




function Zip_Folder($folder, $archive, $options)
{
 $files = Storage_Files_Collect($folder, false, $options);
 
 $zip = new ZipArchive();
 
 $zip->open($archive, ZipArchive::CREATE | ZipArchive::OVERWRITE);
 
 $add = [];
 foreach($files as $file) if(file_exists($file)) $zip->addFile($file, str_replace("$folder/", "", $file)); 
	
 $zip->close();
}





function Zip_Extract($archive, $folder)
{
 $zip = new ZipArchive();
 
 $zip->open($archive);
 
 $zip->extractTo($folder);
 
 $zip->close();
}





//-----------------------------------------------------------------------------------------------//
//                                                                                               //
//                                    T X T     F I L E S                                        //
//                                                                                               //
//-----------------------------------------------------------------------------------------------//

function TXT_Write($filename, $text, $linebreak = "\r\n")
{
 if(gettype($text) != "string") $text = implode($linebreak, $text);
 
 file_put_contents($filename, $text);
}



function TXT_Read($filename, $linebreak = "\r\n")
{
 if(!file_exists($filename)) return "";
 
 $text = file_get_contents($filename);
 $text = explode($linebreak, $text);
 
 return $text;
}






//-----------------------------------------------------------------------------------------------//
//                                                                                               //
//                                     C S V    F I L E S                                        //
//                                                                                               //
//-----------------------------------------------------------------------------------------------//

function CSV_Read($filename, $delimiter = ";", $fields = false)
{
 $data  = [];
 
 
 // READ AND SPLIT
 $text  = file_get_contents($filename);
 $lines = explode("\r\n", $text); 
 foreach($lines as &$line) 
 {
  $line = explode($delimiter, $line);
 }

 
 // PROCESS
 if($fields && count($lines) > 0)
 {
  // FIELDS IMPLIED TO BE ON THE FIRST LINE
  if($fields === true)
  {
   $fields = $lines[0];
   $start  = 1;
  }
  else
  // EXPLICIT FIELDS
  {
   $start = 0;
  }
  
  // GATHER
  for($i = $start; $i < count($lines); $i++)
  {
   $item  = [];
   $line  = $lines[$i];
   
   for($n = 0; $n < count($fields); $n++)
   {
	$field        = $fields[$n];
	$value        = $line[$n];
	$item[$field] = $value;
   }
   
   array_push($data, $item);
  }
 }
 else
 {
  $data = $lines;
 }
 
 return $data;
}






//-----------------------------------------------------------------------------------------------//
//                                                                                               //
//                                   J S O N     F I L E S                                       //
//                                                                                               //
//-----------------------------------------------------------------------------------------------//

function JSON_Write($filename, $data)
{
 $json = json_encode($data);
 
 file_put_contents($filename, $json);
}




function JSON_Read($filename)
{
 $data = file_get_contents($filename);
 $json = json_decode($data, true);
 
 return $json;
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       C L I E N T                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Client_PublishVar($name, &$data, $local = false)
{
 $json = json_encode($data);
 
 if($local)
 {
  echo "var $name = $json;";
 }
 else
 {
  echo "<script>var $name = $json;</script>";
 }
}





function Client_IncludeScripts($folder, $types, $options = [], $exclusions = [])
{
 $scripts = Storage_Files_Collect($folder, $types, $options);
 
 if(in_array("nocache", $options)) $nocache = "?version=" . time(); else $nocache = "";
 
 foreach($scripts as $script)
 {
  $exclude = false;	 
  foreach($exclusions as $exclusion) 
  {  
   // CHECK FOR EXCLUDED PATHS
   if(mb_stripos($script, $exclusion) !== false)
   {
	$exclude = true;
    break;    
   }
  }
  
  
  // IF NOT EXCLUDED, INCLUDE
  if(!$exclude)
  {
   $ext = strtolower(pathinfo($script, PATHINFO_EXTENSION));
  
   // INCLUDE SCRIPTS AS ONE WOULD DO MANUALLY
   switch($ext)
   {
    case "js":
	 	echo "<script src='$script$nocache'></script>";
    break;
	 
    case "php":
 		include_once "$script$nocache";
    break;
	 
    case "css":
		echo "<link rel='stylesheet' href='$script$nocache'/>";
    break;
   }
  }
  
 }
}






//-----------------------------------------------------------------------------------------------//
//                                                                                               //
//                                     S R T    F I L E S                                        //
//                                                                                               //
//-----------------------------------------------------------------------------------------------//


function SRT_Timecode_Ms($timecode)
{
 $secs  = explode(",", $timecode);
 $msecs = $secs[1];
 $secs  = explode(":", $secs[0]);
	
 return (intval($secs[0]) * 60 * 60 * 1000) + (intval($secs[1]) * 60 * 1000) + (intval($secs[2]) * 1000) + intval($msecs);	
}




function SRT_File_Read($filename)
{
 $srt  = [];
 $file = fopen($filename, "r"); 
 
 while(!feof($file))
 {
  $line = trim(fgets($file));
  
  if($line != "")
  { 
   $index = $line;
   $time  = trim(fgets($file));
   $text  = trim(fgets($file));
   
   $time = explode(" --> ", $time);
   foreach($time as &$t) $t = SRT_Timecode_Ms($t);
   
   $item = [];
   $item["index"]    = count($srt);
   $item["start"]    = $time[0];
   $item["end"]      = $time[1];
   $item["duration"] = $time[1] - $time[0];
   $item["text"]     = $text;
   $item["type"]     = "line";
  
   array_push($srt, $item);
  }
 }
 
 fclose($file);
 return $srt;
}














// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       S E R V E R                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Server_Api()
{	 
 if(isset($_REQUEST["direct"])) 
 {
  $data = $_REQUEST;
  
  unset($data["f"]);
  unset($data["direct"]);
 }
 else
 {
  $data = json_decode(file_get_contents('php://input'), true);
 }	 
 
  
 // IDENTIFY THE REQUESTED FUNCTION AND ITS PARAMETERS
 $func      = $_REQUEST["f"];
 
 if(function_exists($func))
 {
  $refFunc   = new ReflectionFunction($func);
  $arguments = $refFunc->getParameters();

  // BUILD THE FUNCTION CALL BY ASSOCIATING URL PARAMETERS TO FUNCTION PARAMETERS
  $params = [];
  foreach($arguments as $argument)
  {
   if(key_exists($argument->name, $data)) $var = $data[$argument->name]; else $var = $argument->getDefaultValue();
   array_push($params, $var);
  }

  // CALL API
  $output = call_user_func_array($func, $params);
  
  if(!isset($_REQUEST["raw"])) $output = json_encode($output);
 }
 else
 {
  $output = "";
 }
 
 if(!isset($_REQUEST["passthru"])) echo $output;
}




function Server_URL()
{
 $protocol = ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off') || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";  
 $url      = $protocol . $_SERVER['HTTP_HOST'] . Storage_Path_GetFolder($_SERVER["SCRIPT_NAME"]);
 
 return $url;
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         S Q L                                                  //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



function SQL_Connect($host, $username, $password, $schema, $driver)
{ 
 $connection = new PDO("$driver:host=$host;dbname=$schema;charset=utf8", $username, $password);
 $connection->setAttribute(PDO::ATTR_STRINGIFY_FETCHES, true);
 
 return $connection;
}





function SQL_Close(&$connection)
{
 $connection = null;	
}




function SQL_Format($value, $connection)
{	
 if($value === null) 
 {
  $value = "null";
  return $value;
 }
 
 $value = $connection->quote($value);
 return $value;
}




function SQL_Format_IN($values, $connection)
{
 if(gettype($values) == "string")
 {
  $values = explode(",", $values);
 }
 
 for($i = 0; $i < count($values); $i++)
 {   
  $values[$i] = SQL_Format(trim($values[$i]), $connection);
 }
 
 $values = implode(", ", $values);
 
 return $values;
}




function SQL_Query($query, $connection)
{ 
 // DETERMINE EXECUTION MODE
 
 if(str_starts_with($query, "INSERT") || str_starts_with($query, "DELETE"))
 {
  $mode = "exec";
 }
 else
 {
  $mode = "query";
 }


 // EXECUTE QUERY
 
 switch($mode)
 {
  case "exec":
	 $connection->exec($query);
     $id = $connection->lastInsertId();
 
	 return $id;
  break;
  
  case "query":
	$result = $connection->query($query);
	$data   = $result->fetchAll(PDO::FETCH_ASSOC);
	
	return $data;
  break;
 }
 
}




function SQL_Fields_Update($object, $connection)
{
 $object = (array)$object;
 $tokens = [];
 
 foreach($object as $field => $value)
 {
  $value = SQL_Format($value, $connection); 
  array_push($tokens, "$field = $value"); 
 }
 
 $string = implode(", ", $tokens);
 return $string;
}




function SQL_Fields_Insert($object, $connection)
{
 $object = (array)$object;
 
 $keys   = array_keys($object);
 $fields = implode(", ", $keys);
 
 $values = array_values($object);
 $tokens = [];
 foreach($values as $value)
 {
  $type = gettype($value);
  if($type == "array" || $type == "object") $value = json_encode($value);

  $value = SQL_Format($value, $connection);
  array_push($tokens, $value);
 }
 $values = implode(", ", $tokens);
 
 $string = "($fields) VALUES($values)";
 return $string;
}



function SQL_Table_Fields($table, $connection)
{
 $data   = SQL_Query("SHOW COLUMNS FROM $table", $connection);
 $fields = array_column($data, "Field");
 
 return $fields;
}




function SQL_Fields_List($object)
{
 $object = (array)$object;
 
 $keys   = array_keys($object);
 $keys   = Array_Filter_Blanks($keys);
  
 $string = implode(", ", $keys);
 return $string;
}




function SQL_Values_List($object)
{
 $object = (array)$object;
 
 $keys   = array_values($object);
 $keys   = Array_Filter_Blanks($keys);
  
 $string = implode(", ", $keys);
 return $string;
}





function SQL_Transaction_Begin($db)
{
 $db->beginTransaction();
}




function SQL_Transaction_Commit($db)
{
 $db->commit();
}



function SQL_Transaction_Rollback($db)
{
 $db->rollBack();
}





// IDENTIFY A SPECIFIC ROW, PERFORM OPERATIONS ON IT, AND UPDATE IT
/*
function SQL_Row_Process($table, $fields, $condition, $connection, $func)
{
 $rows = SQL_Query("SELECT $fields FROM $table WHERE $condition", $connection);
 $row  = $rows[0];
 
 $row  = $func($row);
 
 SQL_Query("UPDATE $table SET $updates WHERE $condition", $connection);
}
*/






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          M E T A                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Meta_Function_ObjectFromCall()
{
 $backtrace = debug_backtrace()[1];
 $caller = $backtrace["function"];
 
 // GET KEYS
 $keys   = [];
 $func   = new ReflectionFunction($caller);
 $params = $func->getParameters();
 foreach($params as $param)
 {
  $name = $param->getName();
  array_push($keys, $name);
 }
 
 // GET NAMES
 $values = $backtrace["args"];
 
 
 // BUILD OBJECT
 $data = [];
 $i    = 0;
 foreach($keys as $key)
 {
  $data[$key] = $values[$i]; 
  $i          = $i + 1;
 }	 
 
 return $data;
}




?>