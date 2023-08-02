<?PHP

function Characters_Load()
{
}



function Characters_List()
{
 $characters = []; 
 
 $folders = Storage_Folder_ListFolders("content/characters");
 foreach($folders as $folder)
 {
  $info                = parse_ini_file("content/characters/$folder/info.dat", true); 
  $characters[$folder] = $info["info"]["name"] ?? $folder; 
 }
 
 return $characters;
}




?>