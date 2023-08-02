<?php

// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       E D I T O R                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Editor_Folder_Download($user_id, $folder)
{
 $path    = "partners/default/users/$user_id/temp";
 $zipfile = "$path/temp.zip";
 Zip_Folder("partners/default/users/$user_id/temp/editor/$folder", $zipfile, ["recurse"]);
 
 header('Content-Description: File Transfer');
 header('Content-Type: application/octet-stream');
 header('Content-Disposition: attachment; filename=' . basename($zipfile));
 header('Content-Transfer-Encoding: binary');
 header('Expires: 0');
 header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
 header('Pragma: public');
 header('Content-Length: ' . filesize($zipfile));
 ob_clean();
 flush();
 readfile($zipfile);
}



function Editor_Folder_Zip($user_id, $folder)
{
 $path    = "partners/default/users/$user_id/temp";
 $zipfile = "$path/temp.zip";
 Zip_Folder("partners/default/users/$user_id/temp/editor/$folder", $zipfile, ["recurse"]);
 
 $handle   = fopen($zipfile, "rb");
 $contents = fread($handle, filesize($zipfile));
 return $contents;
}




function Editor_Import_Resource($dest, $source)
{
 $filename = Storage_Path_GetFilename($source);
 $dest     = "$dest/$filename";
 
 copy($source, $dest);
 
 return $dest;
}




function Editor_Templates_List($content, $category = false)
{
 if($category) $content = "$content/$category";
 
 $folders = Storage_Folders_Collect("content/templates/$content", ["recurse", "uproot"]);
 
 return $folders;
}



function Editor_Files_Upload($srcfilename = "", $path = "", $overwrite = true)
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
  
   $dest     = "$path/$name.$ext";
  }
 }
 
 Storage_File_Upload($dest);
 
 return $dest;
}


function Editor_Lesson_DeleteFile($lesson, $file)
{
 $dest = "content/lessons/$lesson/$file";
 
 unlink($dest);
}


?>