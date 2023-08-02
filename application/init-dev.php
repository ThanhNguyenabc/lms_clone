<?PHP

include_once "application/lib/utils.php";


// 1.1 LOAD PARTNER CONFIGURATION
function Init_Partner()
{
 $path    = "./partners/" . $_SESSION["partner"];

 $files  = Storage_Files_Collect($path, ["cfg"], ["uproot"]);
 $config = Storage_Files_Read($files, "ini", $path, ["noext"]);

 return $config;
}

// PRESENT STATIC DATA TO CLIENT
$config = Init_Partner();
Client_PublishVar("application_config", $config);
$_SESSION["config"] = $config;




// 2.1 COLLECT HTML 
function Init_HTML()
{                                                                 
 $html = [];
 $path = "./application/modules";

 // COLLECT ALL HTML COMPONENTS
 $files        = Storage_Files_Collect($path, ["html"], ["uproot", "recurse"]);
 $data         = Storage_Files_Read($files, "text", $path, ["noext"]);
 $keys         = array_keys($data);

 foreach($keys as $key)
 {
  if(mb_strpos($key, "#") !== false)
  {
   $item     = explode("#", $key);
   $id       = $item[0];
   $platform = $item[1];
  }
  else
  {
   $id       = $key;
   $platform = "desktop";
  }
 
  $html[$id][$platform] = $data[$key];
 }

 return $html;
}

// PRESENT STATIC DATA TO CLIENT
$html = Init_HTML();
Client_PublishVar("application_html", $html);





// 2.2 COLLECT DATA AND PLAINTEXT FILES
function Init_Data()
{
 $data = [];
 $path = "./application/modules";

 $files = Storage_Files_Collect($path, ["dat"], ["uproot", "recurse"]);
 $data  = Storage_Files_Read($files, "ini", $path, ["noext"]);

 $files = Storage_Files_Collect($path, ["txt"], ["uproot", "recurse"]);
 $text  = Storage_Files_Read($files, "", $path, ["noext"]);

 $data  = array_merge($data, $text);
 
 return $data;
}

// PRESENT STATIC DATA TO CLIENT
$data = Init_Data();
Client_PublishVar("application_data", $data);






// 3.1 INCLUDE BACKEND CODE
$path = "./application/lib";

Client_IncludeScripts($path, ["php"], ["recurse"], ["application/data"]);





// 3.2 INCLUDE FRONTEND CODE
$path = "./application";

Client_IncludeScripts($path, ["css"], ["nocache", "recurse"], ["application/data"]);
Client_IncludeScripts($path, ["js"],  ["nocache", "recurse"], ["application/data"]);

$path = "./resources";

Client_IncludeScripts($path, ["css"], ["nocache", "recurse"], ["application/data"]);





// 4 ...  BUILD?
if(isset($_REQUEST["build"])) 
{
 unset($_REQUEST["build"]);
	
	
 // PARTNER CONFIGS
 Storage_File_Create("application/data/" . $_SESSION["partner"] . ".cfg", json_encode($config));
 
 
 // HTML
 Storage_File_Create("application/data/html.dat", json_encode($html));
 
 
 // DATA FILES
 Storage_File_Create("application/data/data.dat", json_encode($data));
 
 
 // JAVASCRIPT
 $files[0] = Storage_Files_Collect("./application/lib",     ["js"], ["recurse"]);
 $files[1] = Storage_Files_Collect("./application/modules", ["js"], ["recurse"]);
 $files    = array_merge($files[0], $files[1]);
 $stream   = Storage_Files_Read($files, "stream");
 
 Storage_File_Create("application/data/client.js", $stream);
 
 
 // CSS
 $files[0] = Storage_Files_Collect("./application/css",     ["css"], ["recurse"]);
 $files[1] = Storage_Files_Collect("./application/modules", ["css"], ["recurse"]);
 $files    = array_merge($files[0], $files[1]);
 $stream   = Storage_Files_Read($files, "stream");

 Storage_File_Create("application/data/client.css", $stream);
 
 
 // PHP
 $files    = [];
 $files[0] = Storage_Files_Collect("./application/lib",     ["php"], ["recurse"]);
 $files[1] = Storage_Files_Collect("./application/modules", ["php"], ["recurse"]);
 $files    = array_merge($files[0], $files[1]);
 $stream   = Storage_Files_Read($files, "stream");
 
 Storage_File_Create("application/data/backend.php", $stream);
}
?>