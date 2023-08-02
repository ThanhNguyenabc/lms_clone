<?PHP

// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          T E S T                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Test_Read($source)
{
 $test           = [];
 $test["source"] = $source;
 
 
 // SHEETS
 $test["sheets"] = [];
 $files          = Storage_Files_Collect($source, ["dat"]);
 
 foreach($files as $file)
 {
  $id = Storage_Path_RemoveExtension(Storage_Path_GetFilename($file));
  
  $sheet       = Ini_File_Read($file);
  $sheet["id"] = $id;
  
  array_push($test["sheets"], $sheet);
 }
 
 
 // RESOURCES
 $files             = Test_Resources_List($source);
 $test["resources"] = $files;
 
 
 return $test;
}








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     R E S O U R C E S                                          //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//




function Test_Resources_List($source)
{
 $list  = [];
 
 $files = Storage_Files_Collect($source, ["jpg", "jpeg", "gif", "png", "svg", "wav", "mp3", "ogg", "mp4", "mpg", "mpeg", "mov", "avi", "pdf"]);
 foreach($files as $file)
 {
  $filename = Storage_Path_GetFilename($file);	  
  array_push($list, $filename);
 }
 
 return $list;
}








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         S H E E T S                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



function Test_Sheet_Write($path, $sheet_id, $data)
{
 $filename = "$path/$sheet_id.dat";
 
 Ini_File_Write($filename, $data);
}






function Test_Sheet_Delete($path, $sheet_id)
{
 $filename = "$path/$sheet_id.dat";
 
 unlink($filename);
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          S T O R E                                             //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function Test_Results_Store($id, $test_id, $score, $data)
{
 $db      = Core_Database_Open();

 $date    = Date_Now();
 $data    = json_encode($data);
 
 $id      = SQL_Format($id,      $db);
 $date    = SQL_Format($date,    $db);
 $test_id = SQL_Format($test_id, $db);
 $data    = SQL_Format($data,    $db);
 $score   = SQL_Format($score,   $db);

 $query   = "INSERT INTO tests_store (id, date, test_id, score, data) VALUES($id, $date, $test_id, $score, $data) ON DUPLICATE KEY UPDATE date = $date, test_id = $test_id, score = $score, data = $data";
 SQL_Query($query, $db);
 
 SQL_Close($db);
}




function Tests_Results_Read($id)
{
 $db    = Core_Database_Open();
 
 $id    = SQL_Format($id, $db);
 $query = "SELECT date, test_id, score, data FROM tests_store WHERE id = $id";
 $rows  = SQL_Query($query, $db);
 
 SQL_Close($db);
 
 if(count($rows) < 1) return false;
 
 $results = $rows[0];
 $results["data"] = json_decode($results["data"]);
 
 return $results;
}



?>