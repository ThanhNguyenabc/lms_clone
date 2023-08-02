<?PHP

function Projects_Load()
{
 $user    = $_SESSION["user"];
 $user_id = $user["id"];
 
 switch($user["role"])
 {
  case "student":
    $data  = Projects_List_ByStudent($user_id, ["info" => true]);
  break;
  
  
  case "teacher":
    $data = [];
	//$data  = Projects_List_ByTeacher($user_id, ["info" => true]);
  break;
  
  
  default:
	$data = [];
  break;
 }
 
 return $data;
}





function Projects_List_ByTeacher($teacher_id = -1, $date_from = "197001010000", $date_to = "210001010000", $options = [])
{
 if($teacher_id == -1) $teacher_id = $_SESSION["user"]["id"];
 
 if(!$options["utc"])
 {
  $date_from = User_Date($date_from, "in");
  $date_to   = User_Date($date_to,   "in");
 }
 
 $db    = Core_Database_Open();
 $query = "SELECT * FROM projects WHERE teacher_id = $teacher_id AND date_start BETWEEN $date_from AND $date_to";
 $data  = SQL_Query($query, $db);
	
 if($options["info"])
 {
  $ids   = array_column($data, "project_id");
  $info  = Projects_Read($ids);
	
  Array_Integrate_Direct($data, "project_id", $info, "data");
 }
 
 SQL_Close($db);
 
 if(!$options["utc"])
 {
  foreach($data as &$item)
  {
   $fields = array_keys($item);
   foreach($fields as $field)
   {
    if(str_starts_with($field, "date_"))
    {
     $item[$field] = User_Date($item[$field], "out");
    }
   }
  }
 }
 
 return $data;
}



function Projects_List_ByStudent($student_id = -1, $options = [])
{
 if($student_id == -1) $student_id = $_SESSION["user"]["id"];
 
 $db    = Core_Database_Open();
 $query = "SELECT * FROM projects_students WHERE student_id = $student_id ORDER BY -date_due";
 $data  = SQL_Query($query, $db);

 Array_Items_JSONParse($data, ["assessment"]);

 
 // OPTIONAL PROJECT DATA
 if($options["info"])
 {
  // REPLACE PROJECT_ID (DATABASE ROW) WITH PROJECT_ID (SOURCE)	
  $ids   = array_column($data, "project_id");
  $list  = SQL_Values_List($ids);
  $query = "SELECT id, project_id FROM projects WHERE id IN ($list)";
  $info  = SQL_Query($query, $db);
  Array_Integrate($data, "project_id", $info, "id");
	
  $ids   = array_column($data, "project_id");
  $info  = Projects_Read($ids);
  Array_Integrate_Direct($data, "project_id", $info, "data");	
 }
 
 SQL_Close($db);
 
 
 return $data;
}




function Projects_List($folder = "content/projects")
{	 	 
 $list = Storage_Folder_ListFolders($folder);
 
 return $list;
}



function Projects_Read($ids, $files = false)
{
 $data = [];
 
 $ids  = array_unique($ids);
 foreach($ids as $id)
 {
  $data[$id] = Project_Read($id, $files);
 }
 
 return $data;
}



function Project_Read($id, $files = true)
{
 $project = parse_ini_file("content/projects/$id/info.dat", true); 
 
 if($files)
 {
  $project["files"] = Storage_Files_Collect("content/projects/$id", ["pdf"]);
 }
 
 return $project;
}





function Project_Create($project_id, $class_id = null, $teacher_id = null)
{
 $db         = Core_Database_Open();
 
 $project_id = SQL_Format($project_id, $db);
 $class_id   = SQL_Format($class_id,   $db); 
 $teacher_id = SQL_Format($teacher_id, $db);
 
 $date_start = Date_Format_NoSeconds(Date_Now());
 
 $query      = "INSERT INTO projects (project_id, class_id, teacher_id, date_start) VALUES ($project_id, $class_id, $teacher_id, $date_start)";
 $id         = SQL_Query($query, $db);
 
 SQL_Close($db);
 
 return $id;
}




function Project_List_Students($project_id)
{
 $db     = Core_Database_Open();
 
 $query  = "SELECT * FROM projects_students WHERE (project_id = $project_id)";
 $rows   = SQL_Query($query, $db);
 
 if(count($rows) == 0) return [];
 
 // GET STUDENTS' NAMES
 $ids = array_column($rows, "student_id");
 $ids = SQL_Values_List($ids);
 
 $query    = "SELECT id AS student_id, firstname, lastname FROM users WHERE id IN ($ids)";
 $students = SQL_Query($query, $db);
   
 Array_Integrate($rows, "student_id", $students);
 Array_Items_JSONParse($rows, ["assessment"]);
 User_Date_Process($rows, ["date_due"], "out");
 
 // ARRANGE GROUPS
 $groups = [];
 foreach($rows as $row)
 {
  $group = $row["group_id"];
  
  if(!isset($groups[$group])) $groups[$group] = [];
  
  array_push($groups[$group], $row);
 }
 
 
 
 SQL_Close($db);
 
 return $groups;
}





function Project_Remove_Student($project_id, $student_id)
{
 $db    = Core_Database_Open();
 
 $query = "DELETE FROM projects_students WHERE project_id = $project_id AND student_id = $student_id";
 SQL_Query($query, $db);
 
 SQL_Close($db);
}




function Project_Assign_Student($project_id, $student_id, $group_id, $days = 365, $url = null)
{	  
 $db = Core_Database_Open();
 
 $project_id  = SQL_Format($project_id, $db);
 $url         = SQL_Format($url, $db);
 
 $user        = $_SESSION["user"];
 $assigner_id = SQL_Format($user["id"], $db);
 
 
 // FIRST CHECK IF A PROJECT WITH THIS STUDENT AND CLASS ALREADY EXISTS
 $query = "SELECT id FROM projects_students WHERE (project_id = $project_id AND student_id = $student_id)";
 $rows  = SQL_Query($query, $db);
 $id    = $rows[0]["id"] ?? false;
 
 // IF IT EXISTS, UPDATE GROUP
 if($id)
 {
  $query = "UPDATE projects_students SET group_id = $group_id, url = $url, assigner_id = $assigner_id WHERE id = $id";
  SQL_Query($query, $db);
 }
 else
 // IF NOT, CREATE IT
 {
  $date_due = Date_Add_Days(Date_Now(), $days);
  $query    = "INSERT INTO projects_students (project_id, student_id, group_id, date_due, assigner_id, url) VALUES($project_id, $student_id, $group_id, $date_due, $assigner_id, $url)";
  $id       = SQL_Query($query, $db);
 }
   
 SQL_Close($db);
 
 return  $id;
}



function Project_File_Set($assignment_id, $url)
{
 $db    = Core_Database_Open();
 
 $url   = SQL_Format($url, $db);
 
 $query = "UPDATE projects_students SET url = $url WHERE id = $assignment_id";
 SQL_Query($query, $db);
 
 SQL_Close($db);
}


?>