<?php


function Queries_List($filter = [])
{
 $list = Core_Files_PartnerQueries();
 
 if($filter["fixed"])
 {
  $filtered = [];
  foreach($list as &$item) if(str_contains($item, "fixed")) array_push($filtered, $item);
  
  $list = $filtered;
 }
 
 return $list;
}



function Queries_Read($name)
{
 // STANDARD QUERY INFO
 $filename = "partners/" . $_SESSION["partner"] . "/queries/$name.dat";
 $file     = parse_ini_file($filename, true);
 
 return $file;
}




function Queries_Query($name, $fields = false, $data = [])
{ 
 // STANDARD QUERY INFO
 $file     = Queries_Read($name);
 
 
 // FIELDS
 if(!$fields) $fields = $file["sql"]["fields"] ?? "*";
 if(gettype($fields) == "array") $fields = implode(", ", $fields);
 
 // OPEN DATABASE
 $db       = Core_Database_Open();
 
 // BUILD QUERY
 $query    = $file["sql"]["query"];
 foreach($data as &$field) $field = SQL_Format($field, $db);
 $data["fields"] = $fields;
 
 // EXECUTE QUERY
 $query    = String_Variables_Apply($query, $data, "$");
 $rows     = SQL_Query($query, $db);
 
 // CLOSE DATABASE
 Core_Database_Close($db);
 
 // RETURN ROWS
 return $rows;
}




function Queries_Fields($name)
{
 $file  = Queries_Read($name);
 $table = $file["sql"]["table"]; 
 
 $db     = Core_Database_Open();
 $fields = SQL_Table_Fields($table, $db);
  
 Core_Database_Close($db);
 
 return $fields;
}



?>