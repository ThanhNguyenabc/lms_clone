<?PHP

function Dialogue_Load()
{
}




function Dialogue_Read($source)
{
 $file  = "$source/info.dat";
 $info  = parse_ini_file($file, true);
 
 $file  = "$source/script.dat";
 $lines = parse_ini_file($file, true);
 
 $dialogue          = [];
 $dialogue["info"]  = $info  ?: [];
 $dialogue["lines"] = $lines ?: [];
 
 $dialogue["lines"] = Dialogue_Purge($dialogue["lines"]);
 
 return $dialogue;
}



function Dialogue_WriteHeader($path, $data)
{
 if(!file_exists($path)) Storage_Path_Create($path);
 
 Ini_File_Write("$path/info.dat", $data);
}



function Dialogue_Purge($lines)
{
 $purged = [];
 
 foreach($lines as &$line)
 {
  $purge  = true;
  
  $values = array_values($line);
  foreach($values as $value) if(trim($value) != "")
  {
   $purge = false;
   break;
  }
  
  if(!$purge) array_push($purged, $line);
 }
 
 return $purged;
}



function Dialogue_WriteLine($path, $n, $data)
{
 $lines     = parse_ini_file("$path/script.dat", true);
 $lines[$n] = $data;
 
 $purged    = Dialogue_Purge($lines);
 
 Ini_File_Write("$path/script.dat", $purged);
}



function Dialogue_Export($path)
{
 $script = Ini_File_Read("$path/script.dat");
  
 // LANGUAGES
 $languages = array_keys($script[0]);
 Array_Item_Delete($languages, "character");

 // TEXT
 foreach($languages as $locale)
 {
  $data = [];
  
  foreach($script as $line)
  {
   $character = $line["character"];
   $text      = $line[$locale];
   
   array_push($data, "$character: $text");
  }
  
  $data = implode("\r\n", $data);
  
  // PUT IT WITHIN THE DIALOGUE
  //file_put_contents("$path/$locale.txt", $data);
  
  // PUT IT WITHIN A VIDEO FOLDER IN THE SAME PATH AS THE DIALOGUE FOLDER
  $parent = Storage_Path_GetFolder($path);
  $video  = "$parent/video";
  Storage_Path_Create($video);
  
  file_put_contents("$video/$locale.txt", $data);
 } 
 
}



?>