<?php

// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          H O M E                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Home_Student_Data($student_id = -1)
{
 if($student_id == -1) $student_id = $_SESSION["user"]["id"];
 $data    = [];
 
 // GET LAST CLASS TAKEN
 $today              = Date_Now();
 $classes            = Class_Seats_ListByStudent($student_id, "190001010000", $today, ["last" => true, "lesson" => true]);
 $data["last-class"] = $classes[0] ?? [];
 
 
 // GET NEXT CLASS TO ATTEND
 $classes            = Class_Seats_ListByStudent($student_id, $today, "290001010000", ["lesson" => true]);
 $data["next-class"] = $classes[0] ?? [];
 
 return $data;
}



?>