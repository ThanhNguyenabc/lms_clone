<?PHP

function Bookpage_Load()
{
}


function Bookpage_Read($source, $options = [])
{
 $bookpage = [];
 $bookpage = parse_ini_file("$source/info.dat", true) ?: [];
 
 // READ PARAGRAPHS INFO
 $keys     = array_keys($bookpage);
 foreach($keys as $key)
 { 
  if($key != "page")
  {   
   // TEXT
   $bookpage[$key]["texts"] = [];
   for($i = 1; $i<=9; $i++)
   {
	$file = "$source/$key-$i.txt";
	
	if(file_exists($file))
	{
     $bookpage[$key]["texts"][$i] = file_get_contents($file);
	}
   }
   
   // PICTURES
   $bookpage[$key]["pictures"] = [];
   for($i = 1; $i<=9; $i++)
   {
	$file = "$source/$key-$i.jpg";
	
	if(file_exists($file))
	{
     $bookpage[$key]["pictures"][$i] = $file;
	}
   }
  }
 }
 
 return $bookpage;
}




function Bookpage_Write_Header($path, $header)
{
 if(!file_exists($path)) Storage_Path_Create($path);
 
 Ini_Section_Write("$path/info.dat", "page", $header);
}



function Bookpage_Write_ParagraphHeader($path, $id, $header)
{
 if(!file_exists($path)) Storage_Path_Create($path);
 
 Ini_Section_Write("$path/info.dat", $id, $header);
}




function Bookpage_Write_ParagraphText($path, $paragraph, $n, $text)
{
 if(!file_exists($path)) Storage_Path_Create($path);
 
 Ini_Key_Write("$path/info.dat", $paragraph, "updated", "");
 file_put_contents("$path/$paragraph-$n.txt", $text);
}




function Bookpage_Picture_Delete($path, $paragraph, $n)
{
 unlink("$path/$paragraph-$n.jpg");
}




function Bookpage_List_Templates()
{
 $list = [];
 
 $files = Storage_Files_Collect("content/templates/paragraphs", ["html"], ["recurse", "uproot"]);
 foreach($files as &$file) $file = Storage_Path_RemoveExtension($file);
 
 $list["paragraphs"] = $files;
 
 $files = Storage_Files_Collect("content/templates/bookpages", ["html"], ["recurse", "uproot"]);
 foreach($files as &$file) $file = Storage_Path_RemoveExtension($file);
 
 $list["pages"] = $files;
 
 return $list;
}



?>