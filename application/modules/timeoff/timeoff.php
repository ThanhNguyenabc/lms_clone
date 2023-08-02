<?PHP

function Timeoff_Read($source, $utc = false)
{
 $source = "partners/" . $_SESSION["partner"] . "/$source.dat";
 $data   = JSON_Read($source) ?: [];
 

 // PURGE AND IF CHANGED, SAVE AS PURGED
 if(Timeoff_Purge($data))
 {
  JSON_Write($source, $data);
 }
 
 
 // CONVERT FROM UTC
 if(!$utc)
 {
  foreach($data as &$item)
  {
   $item["date_from"] = User_Date($item["date_from"], "out");
   $item["date_to"]   = User_Date($item["date_to"],  "out");
  }
 }
 
 
 return $data;
}


function Timeoff_Add($source, $item)
{
 $source    = "partners/" . $_SESSION["partner"] . "/$source.dat";
  
 // CONVERT TO UTC
 $item["date_from"] = User_Date($item["date_from"], "in");
 $item["date_to"]   = User_Date($item["date_to"],   "in");
 
 if(!file_exists($source)) Storage_File_Create($source);
 $data = JSON_Read($source) ?: [];
 
 array_push($data, $item);
 
 JSON_Write($source, $data);
}



function Timeoff_AddBatch($source, $items)
{
 $source    = "partners/" . $_SESSION["partner"] . "/$source.dat";
  
 // CONVERT TO UTC
 foreach($items as &$item)
 {
  $item["date_from"] = User_Date($item["date_from"], "in");
  $item["date_to"]   = User_Date($item["date_to"],   "in");
 }
 
 if(!file_exists($source)) Storage_File_Create($source);
 $data = JSON_Read($source) ?: [];
 
 // ADD
 foreach($items as  &$item) array_push($data, $item);
 
 JSON_Write($source, $data);
}



function Timeoff_RemoveBatch($source, $markers)
{
 $source = "partners/" . $_SESSION["partner"] . "/$source.dat";    
 $data   = JSON_Read($source) ?: [];
 
 $data   = Array_Filter_ByMarkers($data, $markers, "without");
 
 JSON_Write($source, $data);
}




function Timeoff_Update($source, $id, $item)
{
 $source = "partners/" . $_SESSION["partner"] . "/$source.dat";
 $data   = JSON_Read($source) ?: [];
 
 // CONVERT TO UTC
 $item["date_from"] = User_Date($item["date_from"], "in");
 $item["date_to"]   = User_Date($item["date_to"],   "in");
 
 $data[$id] = $item;
 
 JSON_Write($source, $data);
}



function Timeoff_Delete($source, $id)
{
 $source = "partners/" . $_SESSION["partner"] . "/$source.dat";
 $data   = JSON_Read($source) ?: [];
 
 Array_Item_Delete($data, $id, true);
 
 JSON_Write($source, $data);
}




function Timeoff_Purge(&$data)
{
 $purged  = [];
 $changed = false; 
 $today   = Date_Now();
 
 foreach($data as &$item)
 {
  // FILTER OUT DATES OLDER THAN ABOUT 1 MONTH
  if(Date_Distance_Days($today, $item["date_to"]) > -30)
  {
   array_push($purged, $item);
   $changed = true;
  }
 }
 
 $data = $purged;
 return $changed;
}




function Timeoff_Find($data, $date_from, $date_to)
{
 for($i = 0; $i < count($data); $i++)
 {
  if(($data[$i]["date_from"] == $date_from) && ($data[$i]["date_to"] == $date_to))
  {
   return $i;
  }
 }
 
 return -1;
}




function Timeoff_Userdate($date, $item, $mode)
{
 foreach(["time_from", "time_to"] as $time)
 {
  $fulldate    = $date . String_Filter_AllowDigits($item[$time]);
  $fulldate    = User_Date($fulldate, $mode);
  $item[$time] = substr($fulldate, 8, 2) . ":" . substr($fulldate, 10, 2);
 }
 
 return $item;
}










?>