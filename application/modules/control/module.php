<?php



function Control_Load()
{
 $data = [];
 
 // LOAD LESSONS
 $data["lessons"] = Storage_Folders_Collect("content/lessons", ["uproot"]);
 
 return $data;
}




function Control_Virtual_Seat($lesson_id, $user_id = -1)
{
 if($user_id == -1) $user_id = $_SESSION["user"]["id"];
  
  
 // CREATE TEMPORARY CLASS
 $class               = [];
 $class["date_start"] = Date_Now();
 $class["lesson_id"]  = $lesson_id;
 $class["teacher_id"] = $user_id;
 
 $class_id = Class_Create($class);
 
 
 // CREATE SEAT
 $seat                = [];
 $seat["student_id"]  = $user_id;
 
 $seat_id = Class_Seat_Add($class_id, $seat);
 
 $virtual             = [];
 $virtual["seat_id"]  = $seat_id;
 $virtual["class_id"] = $class_id;
 
 return $virtual;
}




function Control_Virtual_Cleanup($virtual)
{
 // VIRTUAL SEAT
 if($virtual["seat_id"]) Class_Seat_Cancel($virtual["seat_id"]);
 
 // VIRTUAL CLASS
 if($virtual["class_id"]) Class_Cancel($virtual["class_id"]);
}




function Control_Virtual_SeatData($lesson_id, $user_id = -1)
{
 if($user_id == -1) $user_id = $_SESSION["user"]["id"];
 
 // CREATE VIRTUAL SEAT
 $virtual = Control_Virtual_Seat($lesson_id, $user_id);
 
 // RETRIEVE VIRTUAL SEAT DATA
 $data = Course_Seat_Data($seat_id);
 
 
 // CLEAN UP
 Control_Virtual_Cleanup($virtual);
 
 
 // RETURN DATA
 return $data;
}




?>