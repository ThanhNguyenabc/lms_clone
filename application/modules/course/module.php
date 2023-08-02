<?php

// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         C O U R S E                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Course_Seat_Data($seat_id)
{
 // GET BASIC SEAT INFORMATION
 $seat               = Class_Seat_Read($seat_id, ["users" => true]);
 $seat["assessment"] = json_decode($seat["assessment"], true);
 $seat["badges"]     = json_decode($seat["badges"], true);
 
 // USE CLASS ID TO READ LESSON ID
 $class_id  = $seat["class_id"];
 $class     = Class_Read($class_id, ["teacher" => true]);
 
 // READ LESSON WITH OUTCOMES
 $lesson_id  = $class["info"]["lesson_id"];
 $lesson     = Lesson_Read($lesson_id, ["outcomes" => true]);

 // USE LESSON ID TO GET ALL ASSESSMENT DATA
 //$assessment = Assessment_Outcomes_ReadBySource($seat["student_id"], $lesson_id);
 
 // READ STORED ACTIVITIES RESULTS TIED TO THIS STUDENT AND LESSON
 $student_id = $seat["student_id"];
 $activities = Activities_Results_ReadBySource($student_id, $lesson_id, false);
 
 // PARSE LESSON FOLDER TO SEE WHAT CONTENT SUBFOLDERS ARE AVAILABLE WITHIN
 $content = Storage_Folder_ListFolders("content/lessons/$lesson_id");
 
 
 
 $data               = [];
 
 $data["seat"]       = $seat;
 $data["class"]      = $class["info"];
 $data["teacher"]    = $class["teacher"];
 $data["lesson"]     = $lesson;
 $data["content"]    = $content;
 $data["activities"] = $activities;
 
 return $data;
}



// DIRECT LESSON DATA WITHOUT GOING THROUGH A SEAT. THE SEAT WILL BE "VIRTUAL"
function Course_Seat_Virtual($lesson_id)
{ 
 $data               = [];
 
 $data["seat"]       = [];
 $data["class"]      = [];
 $data["teacher"]    = [];
 $data["lesson"]     = Lesson_Read($lesson_id, ["outcomes" => true]);
 $data["content"]    = Storage_Folder_ListFolders("content/lessons/$lesson_id");
 $data["activities"] = [];
 
 return $data;
}


?>