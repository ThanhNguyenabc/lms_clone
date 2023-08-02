<?php

// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     C L A S S E S                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



function Class_Create($data, $utc = false, $info = false)
{ 
 // ADJUST DATES
 if($utc)
 {
  $fields = array_keys($data);
  
  foreach($fields as $field)
  {
   if(str_starts_with($field, "date_"))
   {
	$data[$field] = User_Date($data[$field], "in");
   }
  }
 }
 
 // AUTOCALC MISSING FIELDS WHERE POSSIBLE
 if(!isset($data["date_end"]) && isset($data["date_start"]) && isset($data["duration"]))
 {
  $data["date_end"] = Date_Add_Minutes($data["date_start"], $data["duration"]);
 }
 
 
 $db = Core_Database_Open();

 $fields   = SQL_Fields_Insert($data, $db);	
 $query    = "INSERT INTO classes $fields";
 
 $class_id = SQL_Query($query, $db);
 
 SQL_Close($db);
	
 // RETURN WHOLE
 if($info)
 {
  // ADJUST DATES
  if($utc)
  {
   $fields = array_keys($data);
  
   foreach($fields as $field)
   {
    if(str_starts_with($field, "date_"))
    {
	 $data[$field] = User_Date($data[$field], "out");
    }
   }
  }
 
  $data["id"] = $class_id;
  return $data;
 }
 else
 // RETURN ID ONLY
 {
  return $class_id;
 }
}




function Class_Read($class_id, $options = array())
{
 $class = [];
 $db    = Core_Database_Open();
 
 // READ CLASS
 $query          = "SELECT * FROM classes WHERE id = $class_id"; 
 $rows           = SQL_Query($query, $db);
 
 if(count($rows) == 0) 
 {
  SQL_Close($db);
  return [];
 }
 
 $class["info"]  = $rows[0];
 
 
 // RETRIEVE SEATS
 if($options["seats"] || $options["all"])
 {
  $query          = "SELECT * FROM classes_seats WHERE class_id = $class_id";
  $seats          = SQL_Query($query, $db); 
  $class["seats"] = $seats;
    
  // IF USERS REQUESTED, INTEGRATE EACH SEAT WITH ITS STUDENT'S INFO
  if($options["users"] || $options["students"] || $options["all"])
  {
   $ids      = array_column($seats, "student_id");
   if(count($ids) > 0)
   {
    $ids      = SQL_Values_List($ids);
  
    $query    = "SELECT id, firstname, lastname, role FROM users WHERE id IN ($ids)";
    $students = SQL_Query($query, $db);
    Array_Integrate($seats, "student_id", $students, "id", "student");
   }
  }
  
  $class["seats"] = $seats;
 }
 

 
 // IF USERS REQUESTED, ADD TEACHER INFO
 if($options["users"] || $options["teacher"] || $options["all"])
 {
  $id = $class["info"]["teacher_id"];
  
  // RETRIEVE INFO
  if($id)
  {
   $query = "SELECT id, firstname, lastname, role FROM users WHERE id = $id";
   $rows  = SQL_Query($query, $db);
  
   $class["teacher"] = $rows[0];
  }
 }
 
 
 // IF USERS REQUESTED, ADD TA INFO
 if($options["users"] || $options["ta"] || $options["all"])
 {
  for($i = 1; $i <= 3; $i++)
  {
   $id = $class["info"]["ta" . $i ."_id"];
   
   if($id)
   {
    // RETRIEVE INFO
    $query = "SELECT id, firstname, lastname, role FROM users WHERE id = $id";
    $rows  = SQL_Query($query, $db);
   
    $class["ta" . $i] = $rows[0];
   }
  }
 }
 
 SQL_Close($db);
 
 
 // IF LESSON REQUESTED LOAD LESSON HEADER
 if($options["lesson"] && $class["lesson_id"])
 {
  $class["info"]["lesson"] = Lesson_Read($class["lesson_id"], ["info", "title"]);
 }
 
 
 // CONVERT FROM UTC UNLESS OPTIONS SAY OTHERWISE
 if(!$options["noutc"])
 {
  $class["info"]["date_start"] = User_Date($class["info"]["date_start"], "out");
  $class["info"]["date_end"]   = User_Date($class["info"]["date_end"],   "out");
 }
 
 
 return $class;
}


function Class_Update($classes) {
   $db = Core_Database_Open();
   User_Date_Process($classes, "date_", "in");

   $db->beginTransaction();
   foreach($classes as $class)
   {
    $date_start        = $class["date_start"];
    $duration          = $class["duration"];
    $date_end          = $class["date_end"];
    $class_id          = $class["id"];
    SQL_Query("UPDATE classes SET date_start = $date_start, date_end = $date_end WHERE id = $class_id", $db); 
   }
   $db->commit();
   SQL_Close($db);
}




function Class_Cancel($class_id, $options = array())
{
 $db = Core_Database_Open();
 
 // STORE CLASS FOR LATER USE
 /*
 $query   = "SELECT id, course_id FROM classes WHERE id = $class_id"; 
 $classes = SQL_Query($query, $db);
 $class   = $classes[0];
 */
 
 // DELETE CLASS
 $query = "DELETE FROM classes WHERE id = $class_id"; 
 SQL_Query($query, $db);
 
 
 // GET ALL CLASS SEATS (WE MAY NEED THEM AFTER WE DELETE THE SEATS) 
 $query = "SELECT * FROM classes_seats WHERE class_id = $class_id"; 
 $seats = SQL_Query($query, $db);
 
 
 // DELETE SEATS
 $query = "DELETE FROM classes_seats WHERE class_id = $class_id"; 
 SQL_Query($query, $db);
 
 
 // IF THIS CLASS WAS PART OF A COURSE, WE NEED TO PERFORM ADDITIONAL ADJUSTMENTS
 /*
 if($classes[0]["course_id"])
 {
  // READ CLASSES LIST FROM COURSE
  $courses = SQL_Query("SELECT classes FROM courses WHERE id = $course_id", $db);
  $list    = $courses[0]["classes"];
  $list    = json_decode($list, true);
  
  // FIND CLASS IN CLASSES
  for($item of $list)
  {
   if($class["id"] == $item["id"])
   {
	// FOUND. ALL LESSON_IDS FOR ALL CLASSES NOW NEED TO BE SHIFTED BACK 1 POSITIO
   }
  }
 }
 */
 

 
 SQL_Close($db);
}




function Class_Validate($center, $date, $duration, $room = false, $teacher = false, $utc = false, $create = false)
{
 $report        = [];
 if($utc) $date = User_Date($date, "in");
 
 $dates               = [];
 $dates["date_start"] = $date;
 $dates["date_end"]   = Date_Add_Minutes($date, $duration);
 $dates               = [$dates];
 

  
 // VERIFY IF CENTER AVAILABLE BETWEEN DATE_START AND DATE_END
 if(!Center_Available($center, $date, $duration))
 {
  $report["fail"] = "no center";
  
  return $report;
 }

 
 // IF A ROOM IS SPECIFIED, CHECK IF ROOM IS AVAILABLE BETWEEN DATE_START AND DATE_END
 if($room)
 {
  if(!Center_Room_Available($center, $room, $date, $duration))
  {
   $report["fail"] = "no room";
   
   return $report;
  }
 }
 else
 // IF NO SPECIFIC ROOM REQUESTED, THEN FIND AVAILABLE ROOMS BETWEEN DATE_START AND DATE_END 
 {    
  $report["rooms"] = Center_Rooms_Available($center, $dates, ["utc"=>!$utc, "rooms"=>$rooms]);
 }
 
 
 // IF A TEACHER IS SPECIFIED, CHECK IF TEACHER IS AVAILABLE BETWEEN DATE_START AND DATE_END
 if($teacher)
 {
  if(!User_Available_Teach($teacher, $date, $duration))
  {
   $report["fail"] = "no teacher";
   
   return $report;
  }
 }
 else
 // IF NO SPECIFIC TEACHER REQUESTED, THEN FIND AVAILABLE TEACHERS BETWEEN DATE_START AND DATE_END 
 {
  $report["teachers"] = Users_Available_Teach([$center], ["teacher"], $dates, ["utc"=>!$utc, "info"=>"firstname,lastname"]);
 }
 
 if($report == [])
 {
  if($create)
  {
   // CAN CREATE, AUTO CREATE AND RETURN ID
   
   $data = [];
   
   $data["center_id"]  = $center;
   $data["date_start"] = $date;
   $data["duration"]   = $duration;
   
   if($room) $data["classroom_id"]  = $room;
   if($teacher) $data["teacher_id"] = $teacher;
   
   $id = Class_Create($data);
   return $id;
  }
  else
  {
   // CAN CREATE, REPORT AVAILABLE ROOMS AND TEACHERS
   return $report;
  }
 }
 else
 {
  // CAN NOT CREATE, REPORT REASON
  return $report;
 }
}





function Class_Field_Get($id, $field)
{
 $db = Core_Database_Open();
 
 $query = "SELECT $field FROM classes WHERE id = $id";
 $rows  = SQL_Query($query, $db);
 $value = $rows[0][$field];
 
 SQL_Close($db);
  
 return $value;
}




function Class_Field_Set($id, $field, $value)
{
 $db = Core_Database_Open();
 
 $value = SQL_Format($value, $db);
 $query = "UPDATE CLASSES SET $field = $value WHERE id = $id"; 
 SQL_Query($query, $db);
 
 SQL_Close($db);  
}



function Classes_List_Info(&$classes, $info)
{
 $data["classes"] = $classes;
  
 if($info["users"])
 {
  // COLLECT IDS
  $ids = [];
   
  foreach($classes as &$class)
  {
   if(isset($class["teacher_id"]))   array_push($ids, $class["teacher_id"]);
   if(isset($class["ta1_id"]))       array_push($ids, $class["ta1_id"]);
   if(isset($class["ta2_id"]))       array_push($ids, $class["ta2_id"]);
   if(isset($class["ta3_id"]))       array_push($ids, $class["ta3_id"]);
  }
     
  $users         = Users_Read($ids, "firstname,lastname");
  $data["users"] = $users;
 }
  
 return $data;
}



function Classes_List_ByTeacher($teacher_id = -1, $date_from = "197001010000", $date_to = "290001010000", $fields = "*", $info = false)
{
 if($teacher_id == -1) $teacher_id = $_SESSION["user"]["id"];
  
 $db = Core_Database_Open();
 
 $query   = "SELECT $fields FROM CLASSES WHERE ($teacher_id IN (teacher_id, ta1_id, ta2_id, ta3_id)) AND (date_start BETWEEN $date_from AND $date_to) ORDER BY date_start";
 $classes = SQL_Query($query, $db);
 
 SQL_Close($db); 
 
 //PROCESS UTC DATES
 foreach($classes as &$class) 
 {
  $class["date_start"] = User_Date($class["date_start"], "out");
  $class["date_end"]   = User_Date($class["date_end"],   "out");
 }
 
 
 // EXTRA INFO?
 if($info)
 {
  $data = Classes_List_Info($classes, $info);
  return $data;
 }
 else
 // NO EXTRA INFO, JUST RETURN CLASSES
 {
  return $classes;
 }
 
 
 return $classes;
}






function Classes_List_ByStudent($student_id, $date_from = "197001010000", $date_to = "290001010000", $options = [])
{	
 $db         = Core_Database_Open();
 $conditions = [];
 
 array_push($conditions, "(classes_seats.student_id = $student_id AND classes.id = classes_seats.class_id) AND (classes.date_start BETWEEN $date_from AND $date_to)");
 
 if($options["types"])
 {
  $types = SQL_Format_IN($options["types"], $db);
  array_push($conditions, "classes.type IN ($types)");
 }
 
 $conditions = implode(" AND ", $conditions);
 
 $query = "SELECT   classes.id, classes.lesson_id, classes.type, classes.online, classes.date_start, classes.date_end 
           FROM     classes, classes_seats 
		   WHERE    $conditions
		   ORDER BY classes.date_start DESC";
		   
 $data  = SQL_Query($query, $db);
 
 SQL_Close($db);
 
 // CONVERT DATE FIELDS FROM UTC AS NEEDED
 if(!$options["utc"]) User_Date_Process($data, "date_", "out");
 
 return $data;
}





function Classes_List_ByRoom($center_id, $classroom_id, $date_from = "197001010000", $date_to = "290001010000", $fields = "*", $info = false)
{  
 $db = Core_Database_Open();
 
 $center_id    = SQL_Format($center_id,   $db);
 $classroom_id = SQL_Format($classroom_id, $db);
 
 $query   = "SELECT $fields FROM CLASSES WHERE (center_id = $center_id) AND (classroom_id = $classroom_id) AND (date_start BETWEEN $date_from AND $date_to) ORDER BY date_start";
 $classes = SQL_Query($query, $db);
 
 SQL_Close($db); 
 
 
 //PROCESS UTC DATES
 foreach($classes as &$class) 
 {
  $class["date_start"] = User_Date($class["date_start"], "out");
  $class["date_end"]   = User_Date($class["date_end"],   "out");
 }
 
 
 // EXTRA INFO?
 if($info)
 {
  $data = Classes_List_Info($classes, $info);
  return $data;
 }
 else
 // NO EXTRA INFO, JUST RETURN CLASSES
 {
  return $classes;
 }
}




function Classes_List_ByCourse($course_id, $date_from = "197001010000", $date_to = "290001010000", $fields = "*", $info = false)
{  
 $db      = Core_Database_Open();
 
 $query   = "SELECT $fields FROM CLASSES WHERE (course_id = $course_id) AND (date_start BETWEEN $date_from AND $date_to) ORDER BY date_start";
 $classes = SQL_Query($query, $db);
 
 SQL_Close($db); 
 
 
 //PROCESS UTC DATES
 foreach($classes as &$class) 
 {
  $class["date_start"] = User_Date($class["date_start"], "out");
  $class["date_end"]   = User_Date($class["date_end"],   "out");
 }
 
 
 // EXTRA INFO?
 if($info)
 {
  $data = Classes_List_Info($classes, $info);
  return $data;
 }
 else
 // NO EXTRA INFO, JUST RETURN CLASSES
 {
  return $classes;
 }
}




function Classes_List_ById($ids, $fields = "*", $info = false)
{
 $db      = Core_Database_Open(); 
 
 $ids     = SQL_Format_IN($ids, $db);
 
 $query   = "SELECT $fields FROM CLASSES WHERE id IN ($ids) ORDER BY date_start";
 $classes = SQL_Query($query, $db);
 
 SQL_Close($db);
 
 
 //PROCESS UTC DATES
 foreach($classes as &$class) 
 {
  $class["date_start"] = User_Date($class["date_start"], "out");
  $class["date_end"]   = User_Date($class["date_end"],   "out");
 }
 
 
 // EXTRA INFO?
 if($info)
 {
  $data = Classes_List_Info($classes, $info);
  return $data;
 }
 else
 // NO EXTRA INFO, JUST RETURN CLASSES
 {
  return $classes;
 }
}




function Classes_List_ByCenter($center_id = "", $date_from = "197001010000", $date_to = "290001010000", $fields = "*", $info = false)
{  
 $db = Core_Database_Open();
 
 $center_id = SQL_Format($center_id, $db);

 // PROCESS QUERY DATES
 $date_from = User_Date(Date_Format_NoSeconds($date_from), "in");
 $date_to   = User_Date(Date_Format_NoSeconds($date_to),   "in");
 
 $query   = "SELECT $fields FROM CLASSES WHERE (center_id = $center_id) AND (date_start BETWEEN $date_from AND $date_to) ORDER BY date_start";
 $classes = SQL_Query($query, $db);
 
 SQL_Close($db); 
 
 
 //PROCESS UTC DATES
 foreach($classes as &$class) 
 {
  $class["date_start"] = User_Date($class["date_start"], "out");
  $class["date_end"]   = User_Date($class["date_end"],   "out");
 }
 
 
 // EXTRA INFO?
 if($info)
 {
  $data = Classes_List_Info($classes, $info);
  return $data;
 }
 else
 // NO EXTRA INFO, JUST RETURN CLASSES
 {
  return $classes;
 }
 
}



function Classes_Search($search = [], $options = [], $info = [])
{
 $db = Core_Database_Open();


 // CONDITIONS
 $conditions = []; 
 
 
 // 0. DATE FROM
 if(isset($search["date_from"])) 
 {
  if(!$options["utc"])
  {
   $date_from = User_Date($search["date_from"], "in");
  }
 }
 else
 {
  $date_from = "197001010000";
 }
 
 array_push($conditions, "date_start >= $date_from");
 
 
 
 // 1. DATE TO
 if(isset($search["date_to"])) 
 {
  if(!$options["utc"])
  {
   $date_to = User_Date($search["date_to"], "in");
  }
 }
 else
 {
  $date_to = "300001010000";
 }
  
 array_push($conditions, "date_start <= $date_to");
 
 
 
 // 2. SPECIFIC TYPE
 if(isset($search["type"]) && $search["type"])
 {
  $type = SQL_Format($search["type"], $db);
  array_push($conditions, "type = $type");
 }
 
 
 
 // 3. LESSONS THAT ARE = THIS LESSON CODE OR START WITH IT
 if(isset($search["lesson"]) && $search["lesson"])
 {
  $lesson = $search["lesson"] . "%";
  $lesson = SQL_Format($lesson, $db);
  
  array_push($conditions, "lesson_id LIKE $lesson");
 }
 
 
 
 // 4. CENTERS
 if(isset($search["centers"]))
 {
  $centers = $search["centers"];
  $centers = SQL_Format_IN($centers, $db);
  
  array_push($conditions, "center_id IN ($centers)");
 }
 
 
 
 // OPTIONS
 
 // 1. NEEDS AN EMPTY SEAT?
 if($options["seat"] === false)
 {
  array_push($conditions, "seats_taken < seats_total");
 }
 
 
 // 2. TEACHER NEEDED?
 if($options["teacher"])
 {
  array_push($conditions, "teacher_id IS NOT NULL");
 }
 
 
 // 3. ONLINE?
 if(isset($options["online"]))
 {
  if($options["online"])
  {
   array_push($conditions, "online");
  }
  else
  {
   array_push($conditions, "NOT online");
  }
 }
 
 $conditions = implode(" AND " , $conditions);
 


 // QUERY
 $fields = $options["fields"] ?? "*";
 $query  = "SELECT $fields FROM classes WHERE $conditions ORDER BY date_start"; //return $query;
 $data   = SQL_Query($query, $db);
 
 SQL_Close($db);
 
 
 // DATA PROCESSING
 
 
 // 1. DATES
 if(!$options["utc"]) User_Date_Process($data, "date_", "out");
 
 
 // 2. TEACHER
 if(isset($info["teacher"]))
 {
  Users_Integrate($data, "teacher_id", "id,firstname,lastname", "teacher");
 }
 
 
 return $data;
}






function Classes_Batch_Create($data, $fixed = [], $students = [])
{
 $db = Core_Database_Open();

 $db->beginTransaction();
 
 $classes = [];
 foreach($data as $item)
 {
  $class = [];
  
  $keys  = array_keys($fixed);
  foreach($keys as $key)
  {
   $class[$key] = $fixed[$key] ?? $item[$key];
  }
  
  $keys  = array_keys($item);
  foreach($keys as $key)
  {
   if(!isset($class[$key])) $class[$key] = $item[$key];
  }
  

  
  // PROCESS TIMEZONE AND CALCULATE END
  if($class["date_start"])
  {
   $class["date_start"] = User_Date($class["date_start"], "in");
   
   if($class["duration"])
   {
	$class["date_end"] = Date_Add_Minutes($class["date_start"], $class["duration"]);
   }
  }
  
  // INSERT CLASS
  $fields = SQL_Fields_Insert($class, $db);	  
  $id     = SQL_Query("INSERT INTO classes $fields", $db);
  
  // IF STUDENTS AVAILABLE, CREATE SEATS FOR THIS CLASS
  foreach($students as $student)
  {
   $seat               = [];
   $seat["class_id"]   = $id;
   $seat["student_id"] = $student;
   
   $fields = SQL_Fields_Insert($seat, $db);	  
   SQL_Query("INSERT INTO classes_seats $fields", $db);
  }
  
  array_push($classes, $id);
 }
 
 $db->commit();
 
 SQL_Close($db);
 
 return $classes;
}



function Classes_Batch_SetField($classes = [], $field, $value, $options = [])
{
 $db         = Core_Database_Open();
 $value      = SQL_Format($value, $db);
 $conditions = [];
  
 // SELECT CLASSES BY COURSE?
 if($options["course"])
 {
  // BASE CONDITION (CLASSES BY COURSE)
  $course = $options["course"];
 
 array_push($conditions, "course_id = $course");
 }
 else
 {
  // BASE CONDITION (SPECIFIED CLASSES LIST)
  $classes = SQL_Format_In($classes, $db);
 
  array_push($conditions, "id IN ($classes)");
 }
 
 
 // ONLY AFTER A CERTAIN DATE?
 if($options["from"])
 {
  $date = $options["from"];
  if(!$options["utc"]) $date = User_Date($date, "in");
	  
  array_push($conditions, "date_start > $date");
 }
 
 // ONLY UNTIL A CERTAIN DATE?
 if($options["to"])
 {
  $date = $options["to"];
  if(!$options["utc"]) $date = User_Date($date, "in");
	  
  array_push($conditions, "date_start < $date");
 }
 
 
 
 // EXECUTE
 $conditions = implode(" AND ", $conditions);
 $query      = "UPDATE classes SET $field = $value WHERE $conditions";
 SQL_Query($query, $db);
 
 
 SQL_Close($db);
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         S E A T S                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



function Class_Seat_Read($id, $options)
{
 $db = Core_Database_Open();
 
 $query = "SELECT * FROM classes_seats WHERE id = $id";
 $seats = SQL_Query($query, $db); 
 $seat  = $seats[0];
  
 if($options["users"] || $options["all"])
 {
  $student_id = $seat["student_id"];
  
  // RETRIEVE INFO
  $query = "SELECT id, firstname, lastname FROM users WHERE id = $student_id";
  $rows  = SQL_Query($query, $db);
  
  $seat["student"] = $rows[0];
 }
   
 SQL_Close($db); 
 
 return $seat;
}



function Class_Seat_Add($class_id, $data)
{
 $db = Core_Database_Open();
 
 // CHECK IF SEAT EXISTS. IF SO, JUST RETURN THE EXISTING ID
 $student_id = $data["student_id"];
 $rows       = SQL_Query("SELECT id FROM classes_seats WHERE class_id = $class_id AND student_id = $student_id", $db);
 if(count($rows) > 0)
 {
  $id = $rows[0]["id"];
  
  SQL_Close($db);
  
  return $id;
 }


 // INSERT NEW SEAT
 $data["class_id"] = $class_id;
 $fields           = SQL_Fields_Insert($data, $db); 
 $query            = "INSERT INTO classes_seats $fields ON DUPLICATE KEY UPDATE id = id";
 $seat_id          = SQL_Query($query, $db);
 
 
 // UPDATE CLASS' SEATS TAKEN COUNT
 $query = "UPDATE classes SET seats_taken = seats_taken + 1 WHERE id = $class_id";
 SQL_Query($query, $db);
 
 SQL_Close($db);

 return $seat_id;
}




function Class_Seat_Cancel($id)
{
 $db = Core_Database_Open();
 
 
 if($options["updateclass"] !== false)
 {
  // RETRIEVE THE CLASS ID FOR THIS SEAT
  $query    = "SELECT class_id FROM classes_seats WHERE id = $id";
  $rows     = SQL_Query($query, $db);
  $class_id = $rows[0]["class_id"];
 
 
   // UPDATE CLASS' SEATS TAKEN COUNT
  $query  = "UPDATE classes SET seats_taken = seats_taken - 1 WHERE id = $class_id";
  SQL_Query($query, $db);
 }
 
 
 // CANCEL THE SEAT
 $query = "DELETE FROM classes_seats WHERE id = $id";
 SQL_Query($query, $db);
  
 
 SQL_Close($db);
}







function Class_Seat_SetField($id, $field, $value)
{
 $db = Core_Database_Open();
 
 $value = SQL_Format($value, $db);
 $query = "UPDATE classes_seats SET $field = $value WHERE id = $id";
 SQL_Query($query, $db);
 
 SQL_Close($db);
}




function Class_Seats_Sync($id)
{
 $db         = Core_Database_Open();
 $seats      = SQL_Query("SELECT classes.date_start, classes.date_end, classes.lesson_id, classes.course_id, attendance, behavior, assessment, student_id FROM classes_seats, classes WHERE (classes_seats.id = $id) AND (classes.id = classes_seats.class_id)", $db);
 
 $student_id = SQL_Format($seats[0]["student_id"],  $db);
 $course_id  = SQL_Format($seats[0]["course_id"],  $db);
 $lesson_id  = SQL_Format($seats[0]["lesson_id"],  $db);
 $date_start = SQL_Format($seats[0]["date_start"], $db);
 $date_end   = SQL_Format($seats[0]["date_end"],   $db);
 $attendance = SQL_Format($seats[0]["attendance"], $db);
 $behavior   = SQL_Format($seats[0]["behavior"],   $db);
 $assessment = SQL_Format($seats[0]["assessment"], $db);
 
 // SYNC ASSESSMENT WHERE STUDENT, COURSE AND LESSON_ID ARE THE SAME
 SQL_Query("UPDATE classes_seats, classes SET classes_seats.assessment = $assessment WHERE classes_seats.student_id = $student_id AND (classes.id = classes_seats.class_id) AND (classes.course_id = $course_id) AND (classes.lesson_id = $lesson_id)", $db);
 //file_put_contents("query.txt", "UPDATE classes_seats, classes SET classes_seats.assessment = $assessment WHERE classes_seats.student_id = $student_id AND (classes.id = classes_seats.class_id) AND (classes.course_id = $course_id) AND (classes.lesson_id = $lesson_id)");
 
 
 // SYNC ATTENDANCE AND BEHAVIOR WHERE SEATS THAT HAVE THE SAME STUDENT AND COURSE, AND ARE ALSO ADJACENT (START_TIME = END_TIME OR VICE VERSA)
 SQL_Query("UPDATE classes_seats, classes SET classes_seats.attendance = $attendance, classes_seats.behavior = $behavior WHERE (classes_seats.student_id = $student_id) AND (classes.id = classes_seats.class_id) AND (classes.course_id = $course_id) AND (classes.date_start = $date_end OR classes.date_end = $date_start)", $db);
 
 SQL_Close($db);
 
 return $seats[0];
}





function Class_Seat_AddBadge($seat_id, $badge)
{
 $db = Core_Database_Open();
 
 // GET BADGES
 $query  = "SELECT badges FROM classes_seats WHERE id = $seat_id";
 $data   = SQL_Query($query, $db);
 
 // DECODE AS ARRAY
 $badges = $data[0]["badges"] ?? "[]";
 $badges = json_decode($badges, true);
 
 // ADD BADGE
 array_push($badges, $badge);
 
 // RE-ENCODE AS JSON
 $badges = json_encode($badges);
 $badges = SQL_Format($badges, $db);
 
 // UPDATE DATABASE
 $query  = "UPDATE classes_seats SET badges = $badges WHERE id = $seat_id";
 SQL_Query($query, $db);
 
 SQL_Close($db);
}







function Class_Seats_Next($student_id = -1)
{
 $db     = Core_Database_Open();
  
 $now    = Date_Now();
 $query  = "SELECT classes_seats.id FROM classes, classes_seats WHERE (classes.date_start >= $now) AND (classes.id = classes_seats.class_id) AND (classes_seats.student_id = $student_id) LIMIT 1";
 $rows   = SQL_Query($query, $db);
 $next   = $rows[0]["id"] ?? -1;
 
 SQL_Close($db);
 
 return $next;
}






function Class_Seats_ListByStudent($student_id = -1, $date_from = "197001010000", $date_to = "290001010000", $options = false)
{
 if($student_id == -1) $student_id = $_SESSION["user"]["id"];
 
 $db = Core_Database_Open();
 
 $date_from = SQL_Format($date_from, $db);
 $date_to   = SQL_Format($date_to, $db);
 
 $order  = "ORDER BY classes.date_start";
 $fields = ["classes.date_start", "classes.teacher_id", "classes.lesson_id", "classes.duration", "classes_seats.id", "classes_seats.attendance"];
 $limit  = "";

 
 // GET LAST ONES?
 if(isset($options["last"]))
 {
  $order = "ORDER BY classes.date_start DESC";
  $limit = "LIMIT 0, 1";
 }
 
 
 // LIMIT AMOUNT?
 if(isset($options["limit"]))
 {
  $limit = "LIMIT 0, " . $options["limit"];
 }

 
 // ALSO EXTRACT ASSESSMENT?
 if(isset($options["assessment"]))
 {
  array_push($fields, "classes_seats.assessment");
 }
 
 
 // GET SEATS
 $fields = implode(", ", $fields);
 
 $query  = "SELECT   $fields 
            FROM     classes, classes_seats 
		    WHERE    (classes.date_start BETWEEN $date_from AND $date_to) AND (classes.id = classes_seats.class_id) AND (classes_seats.student_id = $student_id)
		    $order
		    $limit";
		   
 $seats  = SQL_Query($query, $db);
 
 
 // GET NEXT SEAT
 SQL_Close($db);
 
 

 if(isset($options["marknext"]))
 {
  $next = Class_Seats_Next($student_id);
  
  if($next != -1)
  {
   foreach($seats as &$seat)
   {
    if($seat["id"] == $next) $seat["next"] = true;	  
   }
  }
 }	 

 
 // IF ASSESSMENT WAS EXTRACTED, PROCESS IT
 if(isset($options["assessment"]))
 {
  foreach($seats as &$seat) $seat["assessment"] = json_decode($seat["assessment"], true);
 }
 
 
 
 // EXTRA INFO: LESSON HEADER
 if($options && isset($options["lesson"]))
 {
  foreach($seats as &$seat)
  {
   $lesson_id      = $seat["lesson_id"];
   $seat["lesson"] = Lesson_Info($lesson_id, ["info", "title"]);
  }	  
 }
 
 
 
 //PROCESS UTC DATES
 foreach($seats as &$seat) 
 {
  $seat["date_start"] = User_Date($seat["date_start"], "out");
 }


 return $seats;
}



function Class_Streaming($class_id)
{
 $now   = Date_Now();
 $class = Class_Read($class_id, ["noutc"]); 
 
 if(!$class["online"])
 { 
  return "offline";
 }
 
 if(!Numbers_Within($now, $class["date_start"], $class["date_end"]))
 {
  return "not yet";
 }
  
  
 if(!$class["classroom_url"])
 { 
  return "no stream";
 }
 
 return "streaming";
}


function Class_Current($student_id)
{
 // FIND FIRST CLASS THAT INTERSECTS CURRENT DATE
}


?>