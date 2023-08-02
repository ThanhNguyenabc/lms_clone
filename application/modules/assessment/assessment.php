<?php

// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                   A S S E S S M E N T                                          //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Assessment_Seat_Data($seat_id, $options = [])
{
 $data = [];
 
 // READ SEAT COMPLETE WITH STUDENT INFO
 $seat         = Class_Seat_Read($seat_id, ["users" => true]);
 $data["seat"] = $seat;
 
 
 // GET LESSON AND TEACHER IDs FROM CLASS
 $class_id   = $seat["class_id"];
 
 $fields     = Core_Database_ReadTable("classes", $class_id, ["teacher_id", "lesson_id"]);
 $teacher_id = $fields["teacher_id"];
 $lesson_id  = $fields["lesson_id"];
 
 $data["teacher_id"] = $teacher_id;
 $data["lesson_id"]  = $lesson_id;
 
 // READ LESSON COMPLETE WITH OUTCOMES
 $data["lesson"] = Lesson_Read($lesson_id, ["outcomes" => true]);
 
 
 // OPTIONAL DATA
 
 
 // PREPARATION (PRECLASS ACTIVITIES' SCORES)
 if(isset($options["preparation"]))
 {
  // READ ALL ACTIVITIES THE STUDENT COMPLETED FOR THIS SEAT'S LESSON
  $activities = Activities_Results_ReadBySource($seat["student_id"], $lesson_id, false);
  
  // DERIVE ACTIVITY TYPE BY SOURCE
  foreach($activities as &$activity)
  {
   $activity["type"] = Storage_Path_GetFilename($activity["source"]);
  }
  
  // CATALOG BY TYPE
  $activities = Array_Catalog_ByField($activities, "type");
  
  // GET MOST RECENT SCORE FOR EACH ACTIVITY TYPE
  $scores = [];
  $types  = array_keys($activities);
  foreach($types as $type)
  {
   $activities[$type] = array_reverse($activities[$type]);
   $last              = $activities[$type][0];
   $scores[$type]     = $last["score"];
  }
  
  $data["preparation"] = $scores;
 }
 
 
 // PERFORMANCE FROM PAST CLASSES
 if(isset($options["performance"]))
 {
  $performance = [];
  
  $n     = $options["performance"];
  $seats = Class_Seats_ListByStudent(student_id:$seat["student_id"], date_to:Date_Now(), options:["last" => true, "limit" =>$n, "assessment" => true]);
  $seats = array_reverse($seats);
  
  foreach($seats as &$seat)
  {
   $array = $seat["assessment"] ?? [0];
   $score = array_sum($array) / count($array);
   
   array_push($performance, $score);
  }
  
  $data["performance"] = $performance;
 }
 
 
 return $data;
}






function Assessment_Outcome_Store($table, $id, $field, $value, $return = false)
{
 $db    = Core_Database_Open();
 
 // GET CURRENT JSON
 $query = "SELECT assessment FROM $table WHERE id = $id";
 $rows  = SQL_Query($query, $db);
 $seat  = $rows[0];

 // DECODE OR CREATE IF NECESSARY, UPDATE
 if(!isset($seat["assessment"])) 
 {
  $data = [];
 }
 else
 {
  $data = json_decode($seat["assessment"], true);
 }
 
 $data[$field] = $value;


 // RE-ENCODE AND STORE BACK
 $assessment = json_encode($data);
 $assessment = SQL_Format($assessment, $db);
 $query      = "UPDATE $table SET assessment = $assessment WHERE id = $id";
 SQL_Query($query, $db);
 
 SQL_Close($db);
 
 
 // RETURN THE WHOLE UPDATED OBJECT ONLY IF REQUESTED
 if($return) return $data;
}



function Assessment_Status($teacher_id = -1, $date_from = "190001010000", $date_to = "290001010000", $options = [])
{
 if($teacher_id == -1) $teacher_id = $_SESSION["user"]["id"];
 
 // FORCE DATE_TO TO NOW
 $date_to = Date_Now(); 

 // GET ALL CLASSES FOR THE GIVEN TEACHER IN THE GIVEN DATE RANGE
 $classes = Classes_List_ByTeacher($teacher_id, $date_from, $date_to, "id, lesson_id, center_id, date_start");
 
 if(count($classes) == 0) return [];
 

 // COLLECT INFO FOR ALL LESSONS
 $ids     = array_column($classes, "lesson_id");
 $ids     = array_unique($ids);
 $lessons = [];
 foreach($ids as $id)
 {
  $lessons[$id]                = Lesson_Read($id, "base-info");
  $lessons[$id]["assessables"] = Lesson_Assessables($id);
 }
 

 // GET ALL SEATS FROM THE LIST OF CLASSES
 $db    = Core_Database_Open();
 $list  = array_column($classes, "id");
 $list  = SQL_Values_List($list);
 
 $query = "SELECT id, class_id, student_id, attendance, assessment FROM classes_seats WHERE class_id IN ($list)";
 $seats = SQL_Query($query, $db);
 
 SQL_Close($db);
 
 
 // PROCESS SEATS
 $classes = Array_Catalog_ByField($classes, "id", true);
 foreach($seats as &$seat) 
 {
  // FIND CLASS AND LESSON DATA FOR THIS SEAT
  $class  = $classes[$seat["class_id"]];
  $lesson = $lessons[$class["lesson_id"]];
  $center = $lessons[$class["center_id"]];
  
  $seat["date_start"] = $class["date_start"];
  $seat["lesson_id"]  = $class["lesson_id"];
  $seat["center_id"]  = $class["center_id"];

  
  // DECODE SEAT ASSESSMENT
  $seat["assessment"] = json_decode($seat["assessment"], true);
  
  
  // CHECK WHAT'S MISSING
  $missing = [];
  
  $categories = array_keys($lesson["assessables"]);
  foreach($categories as $category)
  {
   $done = false;
   
   foreach($lesson["assessables"][$category] as $key)
   {
	if(isset($seat["assessment"][$key]))
	{
     $done = true;
	 break;
	}		
   }
   
   if(!$done) array_push($missing, $category);
  }
  
  if(!$seat["attendance"]) array_push($missing, "attendance");
  
  $seat["todo"] = $missing;
  
  // DISCARD ASSESSMENT
  //unset($seat["assessment"]);
 }
 
 
 if($options["incomplete"])
 {
  $filtered = [];
  foreach($seats as &$seat) if(count($seat["todo"]) > 0) array_push($filtered, $seat);
  
  $seats = $filtered;
 }
 
 
 // ADD STUDENTS NAME AND LAST NAME TO SEATS
 Users_Integrate($seats, "student_id", "id,firstname,lastname", $container = "student");
 
 
 // ADJUST DATES
 if(!$options["utc"]) User_Date_Process($seats, "date_", "out");
 
 
 return $seats;
}





?>