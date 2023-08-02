<?PHP

function Families_List_ByCenter($center = false, $fields = "*", $order = false, $rows = false, $page = false, $stats = false, $inactive = false)
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

 
 
 // PRUNE INACTIVE FAMILIES
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
 
 $query  = "SELECT $fields FROM users_families WHERE $conditions $order $limit";
 $data   = SQL_Query($query, $db);
 
 if($stats)
 {
  $stats  = [];
  
  $query  = "SELECT count(*) FROM users_families WHERE $conditions";
  $count  = SQL_Query($query, $db);
  $count  = $count[0]["count(*)"];
  
  $stats["count"] = $count;
  
  array_push($data, $stats);
 }
 
 SQL_Close($db);
 
 return $data;
}



function Family_Folder($id = -1)
{ 
 $folder = "partners/" . $_SESSION["partner"] . "/families/" . $id;
 
 return $folder;
}




function Family_Create($data = [])
{
 // INSERT INTO DB
 $db = Core_Database_Open();

 $fields = SQL_Fields_Insert($data, $db);	
 $query  = "INSERT INTO users_families $fields";
 
 $id     = SQL_Query($query, $db);
 
 SQL_Close($db);
	
	
 // CREATE FAMILY FOLDER AND COPY DEFAULTS
 $folder = Family_Folder($id);
 Storage_Path_Create($folder);
 
 //$defaults = "partners/" . $_SESSION["partner"] . "/defaults";
 //copy("$defaults/family-settings.cfg", "$folder/settings.cfg");
	
 return $id;
}



function Family_Users($id)
{
 $db             = Core_Database_Open();
 
 $query          = "SELECT id FROM users WHERE family_id = $id";
 $rows           = SQL_Query($query, $db);
 $ids            = array_column($rows, "id");
 
 SQL_Close($db);

 $users          = Users_Read($ids);
 
 return $users;
}


function Family_Read($id, $options = [])
{
 $db             = Core_Database_Open();
 
 $query          = "SELECT * FROM users_families WHERE id = $id";
 $rows           = SQL_Query($query, $db);
 
 $family         = $rows[0];
 $family["data"] = json_decode($family["data"], true);
 
 
 if(isset($options["manager"]))
 {
  $manager_id = $family["manager_id"];
  if($manager_id)
  {
   $family["manager"] = User_Read($manager_id, ["fields" => "id,firstname,lastname,role"]);
  }
 }
 
 
 SQL_Close($db);


 if($options["users"])
 {
  $family["users"] = Family_Users($id);
 }

  
 return $family;
}



function Family_Update_Field($id, $field, $value)
{	 
 $db     = Core_Database_Open();

 $value  = SQL_Format($value, $db); 
 $query  = "UPDATE users_families SET $field = $value WHERE id = $id";
 
 SQL_Query($query, $db);
 
 SQL_Close($db);
}


function Family_Update_Data($id, $field, $value)
{	 
 $db     = Core_Database_Open();

 $query  = "SELECT data FROM users_families WHERE id = $id";
 $rows   = SQL_Query($query, $db);
 $data   = json_decode($rows[0]["data"], true);
 
 $data[$field] = $value;
 $data         = json_encode($data);
 $data         = SQL_Format($data, $db);
 
 $query  = "UPDATE users_families SET data = $data WHERE id = $id";
 SQL_Query($query, $db);
 
 SQL_Close($db);
}

?>