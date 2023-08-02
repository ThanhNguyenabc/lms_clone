<?php

// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      O U T C O M E S                                           //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Outcomes_List($folder = "content/outcomes")
{
 $list = Storage_Folder_ListFolders($folder);
 
 return $list;
}





function Outcome_Write($path, $data)
{
 Storage_Path_Create($path);
 
 Ini_File_Write("$path/info.dat", $data);
}





function Outcome_Read($folder)
{
 $outcome = parse_ini_file("$folder/info.dat", true);
 
 return $outcome;
}




function Outcomes_Read($list, $folder = "outcomes")
{
 $outcomes = [];
 
 foreach($list as $id)
 {
  $outcomes[$id] = Outcome_Read("content/$folder/$id");
 }
 
 return $outcomes;
}





function Outcome_Delete($path)
{
 Storage_Folder_Delete($path);
}



?>