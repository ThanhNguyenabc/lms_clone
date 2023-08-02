<?php

// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     V O C A B U L A R Y                                        //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Vocabulary_List($folder = "content/vocabulary")
{
 $list = Storage_Folder_ListFolders($folder);
 
 return $list;
}




function Vocabulary_Read_Term($source)
{ 
 $term = parse_ini_file("$source/info.dat", true);
 
 if($term)
 {
  $term["source"] = $source;
 
  // DOES IT HAVE SAMPLED AUDIO?
  $audio = "$source/audio.mp3"; 
  if(file_exists($audio))
  {
   $term["audio"] = $audio;
  }
 
  return $term;
 }
 
 return false;
}






function Vocabulary_Read_Terms($terms, $source = false)
{
 // IF TERMS IS A STRING, THEN IT IDENTIFIES THE SECTION WE'LL READ FROM AN INFO.DAT TO DETERMINE THE TERMS THEMSELVES
 if(gettype($terms) == "string")
 {
  $data  = parse_ini_file("$source/info.dat", true);
  $terms = array_values($data[$terms]);
 }
 
 $list = [];
 
 foreach($terms as $term)
 {
  $item = Vocabulary_Read_Term("content/vocabulary/$term");
 
  if($item) $list[$term] = $item;
 }
 
 return $list;
}




function Vocabulary_Write_Term($path, $data)
{
 Storage_Path_Create($path);
 
 Ini_File_Write("$path/info.dat", $data);
}



function Vocabulary_Delete($path)
{
 Storage_Folder_Delete($path);
}




?>