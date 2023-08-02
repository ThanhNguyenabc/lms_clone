<?PHP


function Progress_Curriculum_Data($student_id = -1, $curriculum = "default", $classes = 30)
{
 $data = [];
 
 
 // STUDENT
 if($student_id == -1) $student_id = $_SESSION["user"]["id"];
 
 // CURRENT DATE
 $now = Date_Now();
 
 
 
 // READ CURRICULUM, ITS SKILLS, AND EXTRACT THE ASSOCIATED PROGRAMS
 $data["curriculum"] = Content_Curriculum_Read($curriculum);
 $data["skills"]     = Content_Curriculum_Skills($curriculum);
 $programs           = $data["curriculum"]["main"]["programs"] ?? "";
 
 
 // CREATE FILTER TO ISOLATE CLASSES PERTAINING THIS SPECIFIC CURRICULUM
 $programs = explode(",", $programs);
 $filter   = [];
 foreach($programs as $program)
 {
  array_push($filter, "(classes.lesson_id LIKE '$program%')");
 }
 $filter = implode(" OR ", $filter); 
 
 

 // ASSEMBLE QUERY TO EXTRACT CLASSES FOR THIS CURRICULUM
 $query = "SELECT classes_seats.id, classes.lesson_id, classes.date_start, classes_seats.assessment
           FROM   classes, classes_seats 
           WHERE (classes_seats.student_id = $student_id) AND (classes_seats.class_id = classes.id) AND (classes.date_start < $now) 
           AND   ($filter)
           ORDER BY classes.date_start
           LIMIT 0, $classes";
		   
		   
 // GET CLASSES
 $db      = Core_Database_Open();
 $classes = SQL_Query($query, $db);
 SQL_Close($db);
 
 
 // PROCESS CLASSES AND STORE IT
 foreach($classes as &$class)
 {
  $class["assessment"]   = json_decode($class["assessment"], true);
  $class["date_start"]   = User_Date($class["date_start"], "out");
  $class["lesson_title"] = Lesson_read($class["lesson_id"], "title-only");
 }
 
 $data["classes"] = $classes;
 
 
 // GET PROJECTS
 $projects         = Projects_List_ByStudent($student_id);
 $data["projects"] = $projects;
 
 // RETURN
 return $data;
}	




function Progress_Data_Outcomes($student_id = -1)
{
 // STUDENT
 if($student_id == -1) $student_id = $_SESSION["user"]["id"];

 // READ ALL STUDENT OUTCOMES FROM SEATS ASSESSMENT
 $db   = Core_Database_Open();
 $rows = SQL_Query("SELECT assessment FROM classes_seats WHERE student_id = $student_id", $db);
 SQL_Close($db);
 
 // AGGREGATE ASSESSMENT
 $assessment = [];
 foreach($rows as &$row)
 {
  $row["assessment"] = json_decode($row["assessment"], true) ?? [];
  $assessment = array_merge($assessment, $row["assessment"]);
 }
 
 return $assessment;
}




function Progress_Data_Vocabulary($student_id = -1)
{
 // STUDENT
 if($student_id == -1) $student_id = $_SESSION["user"]["id"];

 // READ ALL STUDENT OUTCOMES FROM SEATS ASSESSMENT
 $db   = Core_Database_Open();
 $rows = SQL_Query("SELECT data FROM users_activities WHERE student_id = $student_id AND mode = 'test' AND source LIKE '%/vocabulary' ", $db); 
 //return "SELECT data FROM users_activities WHERE student_id = $student_id AND mode = 'test' AND source LIKE '%/vocabulary' ";
 SQL_Close($db);
 
 // AGGREGATE DATA
 $vocabulary = [];
 foreach($rows as &$row)
 {
  $row["data"] = json_decode($row["data"], true) ?? [];
  foreach($row["data"] as $token)
  {
   $term = $token["term"];
   array_push($vocabulary, $term);
  }
 }
 $vocabulary = array_unique($vocabulary);
 
 return $vocabulary;
}



/*
function Progress_Data_Outcomes($student_id = -1)
{
 // READ OUTCOMES CATALOG
 $outcomes = file_get_contents("content/index/outcomes-catalog.dat");
 $outcomes = json_decode($outcomes, true);

 // STUDENT
 if($student_id == -1) $student_id = $_SESSION["user"]["id"];
 $stats = [];
 
 // READ ALL STUDENT OUTCOMES FROM SEATS ASSESSMENT
 $db   = Core_Database_Open();
 $rows = SQL_Query("SELECT assessment FROM classes_seats WHERE student_id = $student_id", $db);
 SQL_Close($db);
 
 // AGGREGATE ASSESSMENT
 $assessment = [];
 foreach($rows as &$row)
 {
  $row["assessment"] = json_decode($row["assessment"], true) ?? [];
  $assessment = array_merge($assessment, $row["assessment"]);
 }
 
 
 $data               = [];
 $data["outcomes"]   = $outcomes;
 $data["assessment"] = $assessment;
 
 return $data;
 
 
 // CALCULATE LEVEL PERCENTAGES
 $keys = array_keys($outcomes["by level"]);
 $stats["by level"] = [];
 foreach($outcomes["by level"] as $level => $items)
 {
  // INIT LEVEL STATS
  $stats["by level"][$level]             = [];
  $stats["by level"][$level]["outcomes"] = [];
  
  // FOR EACH OUTCOME, CHECK IF IT'S IN THE STUDENT'S ASSESSMENT
  foreach($items as $item) if(isset($assessment[$item])) 
  {
   array_push($stats["by level"][$level]["outcomes"], $item);
  }
  
  // THE FINAL COUNT IS THE AMOUNT OF OUTCOMES VS ITS TOTAL
  $stats["by level"][$level]["percentage"] = count($stats["by level"][$level]["outcomes"]) / count($items);
 }
 
 return $stats;
} */



?>