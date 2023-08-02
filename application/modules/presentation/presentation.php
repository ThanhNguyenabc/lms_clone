<?php

// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                   P R E S E N T A T I O N                                      //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//




function Presentation_Read($path)
{	
 if(!file_exists($path)) Storage_Path_Create($path);


 $presentation              = [];
 $presentation["slides"]    = [];
 $presentation["resources"] = [];
 
 
 // HEADER
 $presentation["path"] = $path;
 
 
 // LIST RESOURCES
 $presentation["resources"] = Presentation_ListResources($path);
 

 
 // PARSE SLIDES
 $files = Storage_Files_Collect($path, ["dat"]);
 foreach($files as $file)
 {
  $filename = Storage_Path_GetFilename($file);	  
  
  if($filename == "info.dat")
  {
   $data                 = parse_ini_file($file, true);
   $presentation["info"] = $data;
  }
  else
  {
   $data = Presentation_ReadSlide($file);
   array_push($presentation["slides"], $data);
  } 
  
 }
 
 return $presentation;
}





function Presentation_ReadSlide($path, $slide_id = false)
{
 // IF A SLIDE ID IS SPECIFIED, THEN PATH IS JUST A PATH TO A PRESENTATION FOLDER, NOT THE DIRECT PATH TO THE SLIDE FILE
 if($slide_id)
 {
  $path = "$path/$slide_id.dat";
 }
 
 $slide       = parse_ini_file($path, true);
 $slide["id"] = Storage_Path_RemoveExtension(Storage_Path_GetFilename($path));
 
 return $slide;
}





function Presentation_DeleteSlide($path, $slide_id)
{
 $filename = "$path/$slide_id.dat";
 
 unlink($filename);
}




function Presentation_WriteSlide($path, $slide_id, $data)
{
 $filename = "$path/$slide_id.dat";
 
 Ini_File_Write($filename, $data);
}





function Presentation_CopySlide($source, $source_id, $dest, $dest_id)
{
 // READ SOURCE SLIDE
 $slide = parse_ini_file("$source/$source_id.dat", true);
 
 // COLLECT SOURCE MEDIA
 $files    = [];
 $sections = array_keys($slide);
 foreach($sections as $section)
 { 
  $src = urldecode($slide[$section]["src"] ?: "");
  
  if($src)
  {
   array_push($files, $src);
  }	  
 }
 
 // IF DESTINATION PATH DOES NOT EXIST, CREATE IT
 if(!file_exists($dest)) Storage_Path_Create($dest);
 
 // WRITE DESTINATION SLIDE
 Ini_File_Write("$dest/$dest_id.dat", $slide);
 
 // WRITE DESTINATION MEDIA
 foreach($files as $file)
 {
  copy("$source/$file", "$dest/$file");
 }
}





function Presentation_WriteElement($path, $slide_id, $element_id, $data)
{
 $filename = "$path/$slide_id.dat";
 
 Ini_Section_Write($filename, $element_id, $data);
}




function Presentation_ListResources($source)
{
 $list  = [];
 
 $files = Storage_Files_Collect($source, ["jpg", "jpeg", "gif", "png", "svg", "wav", "mp3", "ogg", "mp4", "mpg", "mpeg", "mov", "avi"]);
 foreach($files as $file)
 {
  $filename = Storage_Path_GetFilename($file);	  
  array_push($list, $filename);
 }
 
 return $list;
}




?>