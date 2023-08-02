<?PHP


function Center_Info($center, $info = "all")
{
 $data = [];
 
 
 // ROOMS
 if($info == "all" || in_array("rooms", $info))
 {
  $data["rooms"] = Center_Rooms($center);
 }	 
 
 
 // TIME OFF
 if($info == "all" || in_array("timeoff", $info))
 {
  $data["timeoff"] = Timeoff_Read("centers/$center/timeoff");
 }	 


 return $data;
}






function Center_Available($center, $date, $duration, $utc = false)
{
 if($utc) $date = User_Date($date, "in");
 
 $timeoff_center = Timeoff_Read("centers/$center/timeoff", true);
 $timeoff_global = Timeoff_Read("timeoff", true);
 $timeoff        = array_merge($timeoff_center, $timeoff_global);
 
 $a         = [];
 $a["from"] = $date;
 $a["to"]   = Date_Add_Minutes($date, $duration);
 
 foreach($timeoff as $item)
 {
  $b         = [];
  $b["from"] = $item["date_from"];
  $b["to"]   = $item["date_to"];
		
  if(Numbers_Range_Intersect($a, $b))
  {
   return false;
  }
 }
 
 return true;
}




function Center_Rooms($center)
{
 $rooms = parse_ini_file("partners/". $_SESSION["partner"] . "/centers/" . $center . "/rooms.cfg", true) ?: [];
 
 return $rooms;
}





function Center_Rooms_Available($center, $dates, $options = [])
{
 // PRE-SET ROOMS...
 if($options["rooms"])
 {
  $rooms = $options["rooms"];
 }
 else
 // READ CENTER'S ROOMS
 {
  $rooms = Center_Rooms($center);	
  $rooms = array_keys($rooms); 
 }
 //return $rooms;
 
 
 if($options["utc"])
 {
  foreach($dates as &$date)
  {
   $date["date_start"] = User_Date($date["date_start"], "in"); 
   $date["date_end"]   = User_Date($date["date_end"],   "in"); 
  }
 }
 
 
 // DETERMINE DATE RANGE
 $range     = Date_Ranges_Extremes($dates);
 $date_from = $range["date_from"]; 
 $date_to   = $range["date_to"];
 
 // FIND ALL CLASSES FOR THIS CENTER BETWEEN COURSE'S DATE START AND DATE END
 $db        = Core_Database_Open();
 
 $center    = SQL_Format($center,   $db);
 $date_from = SQL_Format($date_from, $db);
 $date_to   = SQL_Format($date_to,   $db);

 $classes   = SQL_Query("SELECT id, classroom_id, date_start, date_end FROM classes WHERE center_id = $center AND ((date_start BETWEEN $date_from AND $date_to) OR (date_end BETWEEN $date_from AND $date_to) OR ($date_from BETWEEN date_start AND date_end) OR ($date_to BETWEEN date_start AND date_end))", $db); 
 
 SQL_Close($db);

 
 // 3d. SCAN CLASSES AGAINST REQUIRED DATES. IF ANY ROOM IS TAKEN FOR EVEN JUST ONE OF THOSE DATES, THEN IT'S TO BE CONSIDERED UNAVAILABLE
 $a = [];
 $b = [];
 foreach($classes as $class)
 {
  $a["from"] = $class["date_start"];
  $a["to"]   = $class["date_end"];
   
  // IF THIS CLASS INTERSECTS ONE OF OUR GIVEN DATES, THEN THE ROOM FOR THAT CLASS WILL BE CONSIDERED UNAVAILABLE
  foreach($dates as $date)
  {
   $b["from"] = $date["date_start"];
   $b["to"]   = $date["date_end"];
	
   if(Numbers_Range_Intersect($a, $b))
   {
    $room = $class["classroom_id"];
	Array_Item_Delete($rooms, $room);
   }

   // IF NO ROOM LEFT, JUST STOP SCANNING
   if(count($rooms) == 0) break;   
  }
  
  // IF NO ROOM LEFT, JUST STOP SCANNING
  if(count($rooms) == 0) break;   
 }
 
 
 // ROOM IDS MIGHT BE NUMERICAL, BE SURE TO CONVERT ALL TO STRINGS
 foreach($rooms as &$room) $room = strval($room);
 
 return $rooms;
}



function Center_Room_Available($center, $room, $date, $duration, $utc = false)
{
 if($utc) $date = User_Date($date, "in");
  
 $rooms = [$room];

 $dates               = [];
 $dates["date_start"] = $date;
 $dates["date_end"]   = Date_Add_Minutes($date, $duration);
 $dates               = [$dates];
 
 $avail = Center_Rooms_Available($center, $dates, ["utc"=>false, "rooms"=>$rooms]);

 return in_array($room, $avail);
}



?>