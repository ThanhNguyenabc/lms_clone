<?php

// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       L E S S O N S                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Lessons_List($folder = "content/lessons")
{
 $list = Storage_Folder_ListFolders($folder);
 
 return $list;
}




function Lesson_Info($lesson, $sections = false)
{
 $info = []; 
 $data = parse_ini_file("content/lessons/$lesson/info.dat", true);

 foreach($sections as $section) 
 {
  $info[$section] = $data[$section];
 }
  
 return $info;
}




function Lesson_Metadata($lesson, $options = [])
{
 $meta = [];
 $data = parse_ini_file("content/lessons/$lesson/info.dat", true);

 $db   = Core_Database_Open();
 
 // GET AUTHORS INFO 
 $authors = $data["authors"] ?? [];
 $ids     = array_values($authors);
 $ids     = array_unique($ids);
 
 if(count($ids) > 0)
 {
  $list    = SQL_Values_List($ids);

  $query = "SELECT id, firstname, lastname FROM users WHERE id IN ($list)";
  $rows  = SQL_Query($query, $db);
 
  $meta["authors"] = $rows;
 }
 else
 {
  $meta["authors"] = [];
 }
 
 // GET RATING
 if($options && $options["rating"])
 {
  switch("rating")
  {
   case "average":
   break;
   
   default:
	$id     = $options["rating"];
	
	$query  = "SELECT score, feedback FROM users_ratings WHERE type = 'lesson' AND source = '$lesson' AND user_id = $id";
    $rows   = SQL_Query($query, $db);
	
	$score            = $rows[0]["score"] ?? 0;
	$meta["rating"]   = $score;
	
	$feedback         = $rows[0]["feedback"] ?? "";
	$meta["feedback"] = $feedback;
   break;
  }
 }
 
 SQL_Close($db);
 
 return $meta;
}



function Lesson_Rate($lesson, $userid = -1, $score = 0)
{
 if($userid == -1) $userid = $_SESSION["user"]["id"];
 
 $db = Core_Database_Open();
 
 $query  = "INSERT INTO users_ratings (type, source, user_id, score) VALUES('lesson', '$lesson', $userid, $score) ON DUPLICATE KEY UPDATE score = $score";
 SQL_Query($query, $db);
 
 SQL_Close($db);
}


function Lesson_Feedback($lesson, $userid = -1, $feedback)
{
 if($userid == -1) $userid = $_SESSION["user"]["id"];
 
 $db       = Core_Database_Open();
 $feedback = SQL_Format($feedback, $db);
 
 $query  = "INSERT INTO users_ratings (type, source, user_id, feedback) VALUES('lesson', '$lesson', $userid, $feedback) ON DUPLICATE KEY UPDATE feedback = $feedback";
 SQL_Query($query, $db);
 
 SQL_Close($db);
}




function Lesson_Assessables($lesson, $info = false)
{
 $assessables  = [];
 
 if(gettype($lesson) == "string") $data = parse_ini_file("content/lessons/$lesson/info.dat", true); else $data = $lesson;
 $curriculum = $data["info"]["curriculum"] ?? "default";

 
 // LESSON-SPECIFIC OUTCOMES
 $assessables["outcomes"] = array_values($data["outcomes"] ?? []);
 
 // SKILLS FOR THE CURRICULUM THE LESSON BELONGS TO
 $skills                     = parse_ini_file("content/curricula/$curriculum/info.dat", true);
 $assessables["core skills"] = array_values($data["core skills"] ?? []) || array_keys($skills["core skills"] ?? []) ?? [];
 
 // COMPLEMENT WITH DETAILED INFO IF REQUESTED
 /*
 $keys = array_keys($assessables["core skills"]);
   
 foreach($keys as $key)
 {
  $assessables["core skills"][$key] = Outcome_Read("content/skills/$key");
 }
 */
 
 return $assessables;
}






function Lesson_Read($source, $data = false)
{
 if(!$source) 
 {
  $lesson = [];
 }
 else
 {
  $lesson              = parse_ini_file("content/lessons/$source/info.dat", true);
  if(!$lesson) $lesson = [];
 }
 
 
 // SPECIAL CASES. USED BECAUSE RETURNED DATA FOR MULTIPLE LESSONS COULD BE A LOT
 switch($data)
 {
  case "lesson-only":
	return $lesson;
  break;
  
  case "title-only":
	return $lesson["title"];
  break;
  
  case "base-info":
	$info                = [];
	$info["title"]       = $lesson["title"];
	$info["assessables"] = Lesson_Assessables($lesson);
  
	return $info;
  break;
 }
 
 
 // STANDARD READ
 $lesson["source"] = $source;
 
 // READ ASSESSABLE ITEMS
 if($data["assessables"])
 {
  $lesson["assessables"] = Lesson_Assessables($lesson);
 }
 
 
 // READ OUTCOMES AND SKILLS
 if($data["outcomes"] || $data["all"])
 {
  // DETERMINE SKILLS FROM LESSON'S CURRICULUM
  $curriculum = $data["info"]["curriculum"] ?? "default";
  $skills     = parse_ini_file("content/curricula/$curriculum/info.dat", true);
  
  
  
  // SKILLS
  
  
  
  // READ SKILLS
  $keys                  = array_values($lesson["core skills"] ?? []) ?: array_keys($skills["core skills"] ?? []) ?: [];
  $lesson["core skills"] = [];
   
  foreach($keys as $key)
  {
   $lesson["core skills"][$key] = Outcome_Read("content/skills/$key");   
  }
  
  
  // READ OUTCOMES
  $ids                = array_values($lesson["outcomes"] ?? []);
  $lesson["outcomes"] = [];
  
  foreach($ids as $id)
  {
   $outcome                 = Outcome_Read("content/outcomes/$id");
   $lesson["outcomes"][$id] = $outcome;
  }
  
 }
  
 
 
 // LOAD VOCABULARY
 if($data && $data["all"] || $data["vocabulary"])
 {
  $ids                  = array_values($lesson["vocabulary"] ?? []);
  $lesson["vocabulary"] = [];
  
  foreach($ids as $id)
  {
   $outcome                   = Vocabulary_Read_Term("content/vocabulary/$id");
   $lesson["vocabulary"][$id] = $outcome;
  }
 }
 
 
 // DOCUMENTS FOLDER
 if($data && $data["all"] || $data["documents"])
 {
  $files = Storage_Files_Collect("content/lessons/$source/documents", ["pdf"], ["uproot"]);
 
  $lesson["documents"] = $files;
 }
 
 
 return $lesson;
}




function Lesson_Write($path, $data)
{
 Storage_Path_Create($path);
 
 Ini_File_Write("$path/info.dat", $data);
}




function Lesson_Delete($path)
{
 Storage_Folder_Delete($path);
}




function Lesson_Files($source, $folder)
{
 $files = Storage_Files_Collect("content/lessons/$source/$folder", false, ["uproot"]);
 
 return $files;
}




?>