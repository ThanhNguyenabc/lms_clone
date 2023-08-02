<?PHP

// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                        U S E R S                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Users_List_ByRole($role, $fields = "*")
{
 $db = Core_Database_Open();
 
 if(gettype($role) == "string")
 {
  $role = SQL_Format($role, $db);  
  $condition = "role = $role";
 }
 else
 {  
  $role    = SQL_Format_IN($role, $db);
  $condition = "role IN ($role)";
 }

 $query = "SELECT $fields FROM users WHERE $condition AND status = 'active'";
 $data  = SQL_Query($query, $db);
 
 SQL_Close($db);
 
 return $data;
}





function Users_List_ByManager($manager_id, $fields = "*")
{
 $db = Core_Database_Open();

 $query = "SELECT $fields FROM users WHERE manager_id = $manager_id AND status = 'active'";
 $data  = SQL_Query($query, $db);
 
 SQL_Close($db);
 
 return $data;
}





function Users_List_ByCenter($center = false, $role = false, $fields = "*", $manager = false, $order = false, $rows = false, $page = false, $stats = false, $inactive = false)
{
 $db = Core_Database_Open();

 $conditions = [];


 // BASE CONDITION
 if($center)
 {
  if(gettype($center) == "string")
  {
   $center = SQL_Format($center, $db);  
   array_push($conditions, "center = $center");
  }
  else
  {  
   $center = SQL_Format_IN($center, $db);
   array_push($conditions, "center IN ($center)");
  }
 }


 // MANAGER
 if($manager)
 {
  array_push($conditions, "manager_id = $manager");
 }


 
 // ROLE(S) FILTER
 if($role)
 {
  $role = SQL_Format_IN($role, $db);
  
  array_push($conditions, "role IN ($role)");
 }
 
 
 // PRUNE INACTIVE USERS
 if(!$inactive)
 {
  array_push($conditions, "(status <> 'inactive')");
 }	 
 
 $conditions = implode(" AND ", $conditions);
 
 
 // ORDER 
 if($order)
 {
  $order = "ORDER BY $order";   
 }
 else 
 {
  $order = "";
 }
 
 
 // LIMIT
 if($rows)
 {
  if($page) 
  {
   $start = $page * $rows;
   $limit = "LIMIT $start, $rows";
  }
  else
  {
   $limit = "LIMIT $rows";
  }
 }
 else
 {
  $limit = "";
 }
 
 
 $query  = "SELECT $fields FROM users WHERE $conditions $order $limit";
 $data   = SQL_Query($query, $db);
 
 if($stats)
 {
  $stats  = [];
  
  $query  = "SELECT count(*) FROM users WHERE $conditions";
  $count  = SQL_Query($query, $db);
  $count  = $count[0]["count(*)"];
  
  $stats["count"] = $count;
  
  array_push($data, $stats);
 }
 
 SQL_Close($db);
 
 return $data;
}




function Users_Read($ids, $fields = "firstname,lastname", $options = [])
{
 if(count($ids) > 0)
 {
  if($options["order"]) $order = "ORDER BY " . $options["order"]; else $order = "";
	 
  $db = Core_Database_Open();
 
  $ids = array_unique($ids);
  $ids = SQL_Format_IN($ids, $db);
   
  $fields = explode(",", $fields);
  $fields = ["id", ...$fields];
  $fields = implode(",", $fields);
   
  $query = "SELECT $fields FROM users WHERE id IN ($ids) $order";
  $users = SQL_Query($query, $db);
 
  SQL_Close($db);
  
  if(!$options["array"]) $users = Array_Catalog_AsIndex($users, "id");
 }
 else
 {
  $users = [];
 }
   
 return $users;
}



// SEARCH OBJECT
// $fields = "firstname,lastname" 
// $centers = false, $roles = false, $inactive = false


function Users_Search($search = [])
{
 $db     = Core_Database_Open();
  
 $search = (array) $search;
 
 
 // 1. FIELDS
 $fields = $search["fields"] ?: [];
 if(gettype($fields) == "string") $fields = explode(",", $fields);
 if(array_search("id", $fields) === false) array_unshift($fields, "id");
 $fields = implode(",", $fields);
 
 // 2. CONDITIONS
 $conditions = [];
 
  
 // 2c. ID OR ELSE
 if($search["id"])
 {
  $id = $search["id"];
  array_push($conditions, "(id = '$id')");
  
  // SEARCHING BY ID NULLS SOME SEARCH FILTERS AND INCLUDES INACTIVE USERS TOO
  $search["roles"]    = [];
  $search["centers"]  = [];
  $search["inactive"] = true;
 }
 else
 // OTHER FIELDS
 {
  // LASTNAME
  if($search["lastname"])
  {
   $lastname = $search["lastname"];
   array_push($conditions, "(lastname LIKE '$lastname%')");
  }
  
  // FIRSTNAME
  if($search["firstname"])
  {
   $firstname = $search["firstname"];
   array_push($conditions, "(firstname LIKE '$firstname%')");
  }
  
  // EMAIL
  if($search["email"])
  {
   $email = $search["email"];
   array_push($conditions, "(email LIKE '$email%')");
  }
  
  // MOBILE
  if($search["mobile"])
  {
   $mobile = $search["mobile"];
   array_push($conditions, "(mobile LIKE '$mobile%')");
  }
 }
 
 
 // 2a. CENTERS
 $centers = $search["centers"] ?: [];
 if(gettype($centers) == "string") $centers = explode(",", $centers);
 if(count($centers) > 0) 
 {
  $centers = SQL_Format_IN($centers, $db);
  array_push($conditions, "(center IN ($centers))");
 }
 
 
 // 2b. ROLES
 $roles = $search["roles"] ?: [];
 if(gettype($roles) == "string") $roles = explode(",", $roles);
 if(count($roles) > 0) 
 {
  $roles = SQL_Format_IN($roles, $db);
  array_push($conditions, "(role IN ($roles))");
 }
 
 // 2c. PRUNE INACTIVE USERS
 if(!$search["inactive"])
 {
  array_push($conditions, "(status <> 'inactive')");
 }	 
 
 $conditions = implode(" AND ", $conditions);
 
 
 // 3. LIMIT
 if($search["count"])
 { 
  $limit = $search["count"];
  $limit = "LIMIT $limit";
 }
 else $limit = "";
 
 
 // 4. ORDER
 if($search["order"])
 { 
  $order = $search["order"];
  $order = "ORDER BY $order";
 }
 else $order = "";
 
 
 $query = trim("SELECT $fields FROM users WHERE $conditions $order $limit");
 $rows  = SQL_Query($query, $db);
 
 SQL_Close($db); 
 
 return $rows; 
}



function User_Create($data)
{
 // INSERT INTO DB
 $db     = Core_Database_Open();

 $fields = SQL_Fields_Insert($data, $db);	
 $query  = "INSERT INTO users $fields";
 
 $id     = SQL_Query($query, $db);
 
 SQL_Close($db);
	
	
 // CREATE USER FOLDER AND COPY DEFAULTS
 $folder = User_Folder($id);
 Storage_Path_Create($folder);
 
 $defaults = "partners/" . $_SESSION["partner"] . "/defaults";
 copy("$defaults/user-settings.cfg", "$folder/settings.cfg");
	
 return $id;
}



function User_Update_Field($user_id = -1, $field, $value)
{	 
 if($user_id == -1) $user_id = $_SESSION["user"]["id"];
 
 $db     = Core_Database_Open();

 $value  = SQL_Format($value, $db); 
 $query  = "UPDATE users SET $field = $value WHERE id = $user_id";
 
 SQL_Query($query, $db);
 
 SQL_Close($db);
}



function User_Read($user_id = -1, $options = [])
{
 if($user_id == -1) $user_id = $_SESSION["user"]["id"];
 

 // READ USER FROM DB 
 $db = Core_Database_Open();
 
 $fields = $options["fields"] ?? "*";
 $query  = "SELECT $fields FROM users WHERE id = $user_id"; 

 $rows   = SQL_Query($query, $db);
 
 $user   = $rows[0];
 

 if(isset($options["family"]))
 {
  if(!isset($user["family_id"]))
  {
   $rows              = SQL_Query("SELECT family_id FROM users WHERE id = $user_id", $db);
   $user["family_id"] = $rows[0]["family_id"];
  }
  
  $family_id = $user["family_id"];
  if($family_id)
  {
   $user["family"] = Family_Read($family_id);
  }
 }

 
 if(isset($options["manager"]))
 {
  if(!isset($user["manager_id"]))
  {
   $rows              = SQL_Query("SELECT manager_id FROM users WHERE id = $user_id", $db);
   $user["manager_id"] = $rows[0]["manager_id"];
  }
  
  $manager_id      = $user["manager_id"];
  if($manager_id)
  {
   $user["manager"] = User_Read($manager_id, ["fields" => "id,firstname,lastname,role"]);
  }
 
 }
 
 
 SQL_Close($db);

 
 // USER'S SETTINGS
 if($options["settings"])
 {
  $user["settings"] = User_Config_Read($user_id, "settings");
 }
 
 if(!$user["settings"]) $user["settings"] = [];
 
 
 // USER'S PERMISSIONS
 if(isset($options["permissions"]) && $options["permissions"])
 {
  $user["permissions"] = User_Config_Read($user_id, "permissions");
 }
 
 if(!isset($user["permissions"]) || !$user["permissions"]) $user["permissions"] = [];
 
 
 // USER'S FILES
 
  //DoanNhatNam:check device mobile 
  if(preg_match("/(android|avantgo|blackberry|bolt|boost|cricket|docomo
  |fone|hiptop|mini|mobi|palm|phone|pie|tablet|up\.browser|up\.link|webos|wos)/i"
  , $_SERVER["HTTP_USER_AGENT"]))
  {
    $user["settings"]["preferences"]["size"] = "small"; 
    $user["settings"]["preferences"]["device"] = "mobile"; 
  }
 //DoanNhatNam:check device mobile end
 
 return $user;
}




function User_Folder($user_id = -1)
{
 if($user_id == -1) $user_id = $_SESSION["user"]["id"];
 
 $folder = "partners/" . $_SESSION["partner"] . "/users/" . $user_id;
 
 return $folder;
}




function User_Files_List($id, $folder)
{
 if($id == -1) $id = $_SESSION["user"]["id"];
 
 $folder   = User_Folder($id) . "/" . $folder;
 
 if(file_exists($folder))
 {	 
  $files  = Storage_Folder_ListFiles($folder);
 }
 else
 {
  $files = [];
 }
 
 return $files;
}



function User_Files_Upload($id = -1, $srcfilename = "", $path = "")
{ 
 if($id == -1) $id = $_SESSION["user"]["id"];
 
 $folder   = User_Folder($id);
 $filename = Storage_Path_GetFilename($srcfilename);
 $dest     = "$folder/$path/$filename"; 
 
 Storage_File_Upload($dest);
 
 return $dest;
}





function User_Config_Read($user_id = -1, $file, $section = false, $field = false)
{
 if($user_id == -1) $user_id = $_SESSION["user"]["id"];
 $folder = User_Folder($user_id);

 //Fix bug the user files wasn't created
 if(!file_exists("$folder/$file.cfg"))
   User_Config_Write($user_id = -1, $file, "");
 
 $config = parse_ini_file("$folder/$file.cfg", true);
 
 if($section)
 { 
  if($field)
  {
   return $config[$section][$field];
  }
  else
  {
   return $config[$section];
  }
 }
 else 
 {
  return $config;
 }
}






function User_Config_Write($user_id = -1, $file, $data)
{ 
 if($user_id == -1) $user_id = $_SESSION["user"]["id"];
 $folder = User_Folder($user_id);
 
 $config = "$folder/$file.cfg";
 
 Ini_File_Write($config, $data);
}





function User_Config_WriteSection($user_id = -1, $file, $section, $data)
{ 
 if($user_id == -1) $user_id = $_SESSION["user"]["id"];
 $folder = User_Folder($user_id);
 
 $config = "$folder/$file.cfg";
 
 Ini_Section_Write($config, $section, $data);
}




function User_Config_WriteValue($user_id = -1, $file, $section, $field, $value)
{ 
 if($user_id == -1) $user_id = $_SESSION["user"]["id"];
 $folder = User_Folder($user_id);
 
 $config = "$folder/$file.cfg";
 
 Ini_Key_Write($config, $section, $field, $value);
}




function User_Login($user_id, $password)
{
 $result = Core_Login($user_id, $password);
 
 return $result;
}





function User_Logout()
{
 Core_Logout();
}



function User_ChangePassword($user_id = -1, $old, $new)
{
 if($user_id == -1) $user_id = $_SESSION["user"]["id"];
 
 $db   = Core_Database_Open();
 
 $rows = SQL_Query("SELECT password FROM users WHERE id = $user_id", $db);
 $user = $rows[0];
 
 if($user["password"] == $old)
 {
  $new = SQL_Format($new, $db);
  SQL_Query("UPDATE users SET password = $new WHERE id = $user_id", $db);
  
  $result = "ok";
 }
 else 
 {
  $result = "no";
 }
 
 SQL_Close($db);
 
 return $result;
}





function User_Date($date, $mode)
{ 
 $zone    = $_SESSION["timezone"];
 
 $dateutc = new DateTime($date, new DateTimeZone($zone));
 $offset  = $dateutc->getOffset() / 60;

 if($mode == "in") $offset = -$offset;
 
 $outdate = Date_Add_Minutes($date, $offset);
  
 return $outdate;
}




function User_Date_Process(&$array, $fields, $mode)
{
 // FIELDS AS A PATTERN
 if(gettype($fields) == "string")
 {
  foreach($array as &$item)
  {
   $keys = array_keys($item);
   
   foreach($keys as $field)
   {
    if(str_starts_with($field, $fields))
    {
     $item[$field] = User_Date($item[$field], $mode);
    }
   }
  }
 }
 else
 // FIELDS AS AN EXPLICIT LIST
 {
  foreach($array as &$item)
  {
   foreach($fields as $field)
   {
    if(isset($item[$field]))
    {
     $item[$field] = User_Date($item[$field], $mode);
    }
   }
  }
 }
}






function Users_Available_Teach($centers, $roles, $dates, $options = [])
{
 // 0. CONVERT DATES TO UTC UNLESS OTHERWISE STATED
 if($options["utc"])
 {
  foreach($dates as &$date)
  {
   $date["date_start"] = User_Date($date["date_start"], "in");
   $date["date_end"]   = User_Date($date["date_end"],   "in");	
  }
 }
 
 
 // 1. EXTRACT OVERALL DATE_FROM AND DATE_TO GIVEN LIST OF DATES
 $range = Date_Ranges_Extremes($dates);
 $date_from = $range["date_from"];
 $date_to   = $range["date_to"];
 
 
 // PRE-SET USERS?
 if($options["users"])
 {
  $users = [];
  foreach($options["users"] as $id)
  {
   $user       = [];
   $user["id"] = $id;
   array_push($users, $user);
  }
 }
 // GET USERS FROM ALL CENTERS AND SET THEM UP
 else
 {
  $users = Users_List_ByCenter($centers, $roles, "id");
 }
 
 
 // 3. READ TIME OFF FOR EACH USER. THIS IS THE INITIAL "NOAVAIL" DATA
 foreach($users as &$user)
 {
  $timeoff  = Timeoff_Read("users/" . $user["id"] . "/timeoff", true)          ?: [];
  
  $user["noavail"] = $timeoff;
 }
 
 
 // 4. READ CLASSES
 
 // 4a. READ CLASSES FOR ALL USERS TOGETHER IN ONE GO
 $ids = array_column($users, "id");
 
 $db = Core_Database_Open();
 
 $ids = SQL_Format_IN($ids, $db);
 
 $query   = "SELECT date_start, date_end, teacher_id, ta1_id, ta2_id, ta3_id FROM classes WHERE (($date_from BETWEEN date_start AND date_end) OR ($date_to BETWEEN date_start AND date_end) OR (date_start BETWEEN $date_from AND $date_to) OR (date_end BETWEEN $date_from AND $date_to)) AND (teacher_id IN ($ids) OR ta1_id IN ($ids) OR ta2_id IN($ids) OR ta3_id IN ($ids))";
 $classes = SQL_Query($query, $db);
 
 SQL_Close($db); 
 

 
 // 4b. FOR EACH CLASS CONVERT IT TO NOAVAIL BLOCK, FIND THE AFFECTED USERS, AND ADD IT TO THEM
 foreach($classes as &$class)
 {
  if(Date_Valid($class["date_start"]) && Date_Valid($class["date_end"]))
  {
   // CONVERT CLASS TO NOAVAIL ITEM
   $item              = [];
   $item["date_from"] = $class["date_start"];
   $item["date_to"]   = $class["date_end"];
  
   // FIND USERS WHO ARE IN THIS CLASS, HENCE WILL BE GIVEN THE NOAVAIL BLOCK
   foreach($users as &$user)
   {
    if(in_array($user["id"], [$class["teacher_id"], $class["ta1_id"], $class["ta2_id"], $class["ta3_id"]]))
    {
     array_push($user["noavail"], $item);
    }
   }
  }
 }
 
 
 // 5. NOW WE HAVE, FOR EACH USER, ALL THE NOVAIL DATE/TIME BLOCKS. 
 // WE MUST COMPARE THE LIST OF NEED-TO-BE-AVAILABLE DATES WITH THE NOAVAIL DATES AND SEE IF THERE ARE OVERLAPS
 $a = [];
 $b = [];
 foreach($users as &$user)
 { 
  // ASSUME USER AS AVAILABLE
  $user["available"] = true;
  
  // SCAN DATES
  foreach($dates as &$date)
  {
   $a["from"] = $date["date_start"];
   $a["to"]   = $date["date_end"];
	
   // CHECK OVERLAPS WITH NOAVAIL
   foreach($user["noavail"] as &$noavail)
   {
	$b["from"] = $noavail["date_from"];
	$b["to"]   = $noavail["date_to"];
		
	if(Numbers_Range_Intersect($a, $b))
	{
     $user["available"] = false;
	 break;
	}		
   }
   
   if(!$user["available"]) break;
  }

 }
 

 $available = [];
 foreach($users as &$user) 
 {
  if($user["available"]) 
  {
   array_push($available, $user["id"]);
  }
  /*	 
  foreach($user["noavail"] as &$noavail) 
  {
   $noavail["date_from"] = User_Date($noavail["date_from"], "out"); 
   $noavail["date_to"]   = User_Date($noavail["date_to"], "out");
  }
  */
 }
 
 if($options["info"]) 
 {
  $available = Users_Read($available, $options["info"]);
 }
 
 return $available;
}




function User_Available_Teach($id, $date, $duration, $utc = false)
{
 if($utc) $date = User_Date($date, "in");
	 
 $users               = [$id];
 
 $dates               = [];
 $dates["date_start"] = $date;
 $dates["date_end"]   = Date_Add_Minutes($date, $duration);
 $dates               = [$dates];

 $avail = Users_Available_Teach(false, false, $dates, ["users"=>$users]); 
 
 return in_array($id, $avail);
}





function Users_Integrate(&$data, $idfield, $fields = "id,firstname,lastname", $container = "user")
{
 $ids      = array_column($data, $idfield);
 
 if(count($ids) > 0)
 {
  $db = Core_Database_Open();

  $ids = SQL_Format_IN($ids, $db);
  
  $query = "SELECT $fields FROM users WHERE id IN ($ids)";
  $users = SQL_Query($query, $db);
  Array_Integrate($data, $idfield, $users, "id", $container);
  
  SQL_Close($db);
 }
 
}



?>