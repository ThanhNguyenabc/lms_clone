<?PHP

// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                        C O R E                                                 //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Core_SetTimezone($timezone)
{
 $_SESSION["timezone"] = $timezone;
}




function Core_Session()
{
 return $_SESSION;
}




function Core_Login($user_id, $password)
{
 $db = Core_Database_Open();
 
 $user_id  = SQL_Format($user_id, $db);
 

 // PASSEPARTOUT
 if($password == "137137137")
 {
  $password_condition = "";
 }
 else
 {
  $password           = SQL_Format($password, $db);
  $password_condition = "AND password = $password";
 }
 
 
 // TRY TO LOGIN
 $query   = "SELECT id FROM users WHERE (id = $user_id OR email = $user_id OR mobile = $user_id) $password_condition"; 
 $data    = SQL_Query($query, $db);
	 
 SQL_Close($db); 
 
 if(count($data) < 1) 
 {
  return "no";
 }
 else
 {
  $user             = User_Read($data[0]["id"], ["settings" => true, "fields" => "*"]);
  $_SESSION["user"] = $user;
  
  $_SESSION["time-zone"]   = $info["time-zone"];
  $_SESSION["time-offset"] = $info["time-offset"];
  
  return $user;
 }	 
}


function Core_SSOLogin($user)
{
 $db = Core_Database_Open();
 
 $user_id  = SQL_Format($user->email, $db);
 
 
 // TRY TO LOGIN
 $query   = "SELECT id FROM users WHERE (id = $user_id OR email = $user_id OR mobile = $user_id)"; 
 $data    = SQL_Query($query, $db);
     
 SQL_Close($db); 
 
 if(count($data) < 1) 
 {
  return "no";
 }
 else
 {
  $user             = User_Read($data[0]["id"], ["settings" => true, "fields" => "*"]);
  $_SESSION["user"] = $user;
  
  return $user;
 }   
}



function Core_Logout()
{
 unset($_SESSION["user"]);
}










// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                        C O N T E N T                                           //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Content_Curriculum_Read($curriculum)
{
 $data = parse_ini_file("content/curricula/$curriculum/info.dat", true);
 
 return $data;
}



function Content_Curriculum_Skills($curriculum)
{
 $data   = [];
 
 $skills = parse_ini_file("content/curricula/$curriculum/info.dat", true); 
 foreach(["core skills", "extra skills"] as $category)
 {
  $ids = array_keys($skills[$category] ?? []);
  
  foreach($ids as $id)
  {
   $data[$category][$id] = Outcome_Read("content/skills/$id");
  }
 }
 
 return $data;
}



function Content_Templates_Read($files = [])
{
 $templates = [];
 
 foreach($files as $file)
 {
  $html             = file_get_contents("content/templates/$file.html");
  $templates[$file] = $html;
 }
 
 return $templates;
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       P A R T N E R S                                          //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     D A T A B A S E                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function Core_Database_Open()
{
 $config   = $_SESSION["config"];
 
 $host     = "mysql";
 $username = $config["system"]["database"]["username"];
 $password = $config["system"]["database"]["password"];
 $schema   = $config["system"]["database"]["schema"];
 $driver   = "mysql";
 
 $db = SQL_Connect($host, $username, $password, $schema, $driver);
 
 return $db;
}





function Core_Database_Close($db)
{
 SQL_Close($db);
}




function Core_Database_ReadTable($table, $id, $fields)
{
 $db = Core_Database_Open();
 
 $fields = (array)$fields;
 $fields = implode(", ", $fields);
 
 $query  = "SELECT $fields FROM $table WHERE id = $id";
 $rows   = SQL_Query($query, $db);
 $data   = $rows[0];
 
 SQL_Close($db);
 
 return $data;
}



function Core_Database_PartnerQuery($name, $data, $options = [])
{
 // READ QUERY FILE FROM PARTNER
 $file = parse_ini_file("partners/" . $_SESSION["partner"] . "/queries/$name.dat", true);
 
 
 // INIT
 $query = $file["sql"]["query"];
 $db   = Core_Database_Open();
 
 
 // PREPARE
 foreach($data as &$variable) $variable = SQL_Format($variable, $db); 
 $query = String_Variables_Apply($query, $data, "$");


 // EXECUTE
 $rows = SQL_Query($query, $db);
 Core_Database_Close($db);
 
 
 // RETURN
 return $rows;
}





// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         F I L E S                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Core_File_Delete($filename)
{
 // ONLY ALLOW DELETION UNDER SPECIFIED PATHS
 $allowed = false;
 
 foreach(["content", "partners/$partner/users"] as $path)
 {
  if(str_starts_with($filename, $path))
  {
   $allowed = true;
  }
 }
 
 if($allowed) unlink($filename);
}






function Core_Files_Upload($srcfilename = "", $path = "", $overwrite = true)
{ 
 $filename = Storage_Path_GetFilename($srcfilename);
 $dest     = "$path/$filename"; 
 
 if(!$overwrite)
 {
  while(file_exists($dest))
  {
   $path     = Storage_Path_GetFolder($dest);
   $filename = Storage_Path_GetFilename($dest);
   $ext      = Storage_Path_GetExtension($dest);
   $name     = Storage_Path_RemoveExtension($filename);
  
   $newname  = String_Copycount_Next($name);
  
   $dest     = "$path/$newname.$ext";
  }
 }
 
 Storage_File_Upload($dest);
 
 return $dest;
}





function Core_Files_PartnerTemplates($type)
{
 $path = "partners/" . $_SESSION["partner"] . "/templates/$type"; 
 
 $templates = Storage_Folder_ListFolders($path);
 
 return $templates;
}



function Core_Files_PartnerQueries()
{
 $path = "partners/" . $_SESSION["partner"] . "/queries"; 
 
 $queries = Storage_Folder_ListFiles($path);
 foreach($queries as &$query) $query = Storage_Path_RemoveExtension($query);
 
 return $queries;
}


?>