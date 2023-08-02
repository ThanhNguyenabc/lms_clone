// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     R E S O U R C E S                                          //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Resources_Get(type, mode)
{
 switch(mode)
 {
  case "list":
	return Core_State_Get("resources", [type, "list"]); 
  break;
  
  case "catalog":
	return Core_State_Get("resources", [type, "catalog"]); 
  break;
  
  default:
	return Core_State_Get("resources", [type]); 
  break;
 }
}



async function Resources_Update(type, force, catalog_function)
{
 var list = Resources_Get(type, "list");
 
 if(!list || force)
 {
  var list = await Core_Api("Resources_" + String_Capitalize_Initial(type), {});
  Core_State_Set("resources", [type, "list"], list);
  
  if(catalog_function)
  {
   var catalog = catalog_function(list);
   Core_State_Set("resources", [type, "catalog"], catalog);
  }
 }
 
 return list;
}




function Resources_URL(path, type = "application", id)
{
 switch(type)
 {
  case "application":
	var resource = "resources/" + path;
  break;
  
  case "partner":
	var resource = "partners/" + Partner_Name() + "/" + path;
  break;
  
  case "user":
    var userfolder = User_Folder(id);
	var resource   = "partners/" + Partner_Name() + "/users/" + userfolder + "/" + path;
  break;
  
  case "content":
	var resource = "content/" + path;
  break;
  
  case "lesson":
	var resource = "content/lessons/" + id + "/" + path;
  break;
  
  case "curriculum":
	var resource = "content/curricula/" + id + "/" + path; 
  break;
  
  default:
	var resource = path;
  break;
 }
 
 return resource;
}




async function Resources_Lessons(update, mode)
{
 var list = await Resources_Update("lessons", update,
 function(list)
 {
  var catalog = {};
	 
  for(var item of list)
  {
   var parts = String_Split(item, ["_", "-", ".", " "]);
   
   // PAD MISSING PARTS
   for(var i = parts.length; i<3; i++)
   {
	Array_Element_Insert(parts, 0, "");
   }
   
   // STRUCTURE CATALOG
   Safe_Set(catalog, parts, {id:item});
  }
  
  return catalog;
 });
 
 return Resources_Get("lessons", mode);
}





async function Resources_Vocabulary(update, mode)
{
 var list = await Resources_Update("vocabulary", update,
 function(list)
 {
  var catalog = {};
  
  for(var item of list)
  {
   var parts = String_Split(item, ["_", "-", ".", " "]);
   
   // PAD MISSING PARTS
   for(var i = parts.length; i<2; i++)
   {
	Array_Element_Insert(parts, 0, "");
   }
   
   // STRUCTURE CATALOG
   Safe_Set(catalog, parts, {id:item});
  }
  
  return catalog;
 });
 
 return Resources_Get("vocabulary", mode);
}





async function Resources_Outcomes(update, mode)
{
 var list = await Resources_Update("outcomes", update,
 function(list)
 {
  var catalog = {};
  
  for(var item of list)
  {
   var parts = String_Split(item, ["_", "-", ".", " "]);
   
   // PAD MISSING PARTS
   for(var i = parts.length; i<3; i++)
   {
	Array_Element_Insert(parts, 0, "");
   }
   
   // STRUCTURE CATALOG
   Safe_Set(catalog, parts, {id:item});
  }

  return catalog;
 });
 
 return Resources_Get("outcomes", mode);
}




async function Resources_Skills(update)
{
 var list = await Resources_Update("skills", update);
 
 return Resources_Get("skills", "list");
}



async function Resources_Projects(update, mode)
{
 var list = await Resources_Update("projects", update,
 function(list)
 {
  var catalog = {};
  
  for(var item of list)
  {
   var parts = String_Split(item, ["_", "-", ".", " "]);
   
   // PAD MISSING PARTS
   for(var i = parts.length; i<3; i++)
   {
	Array_Element_Insert(parts, 0, "");
   }
   
   // STRUCTURE CATALOG
   Safe_Set(catalog, parts, {id:item});
  }

  return catalog;
 });
 
 return Resources_Get("projects", mode);
}




async function Resources_Index(index, update)
{
 if(!update)
 {
  var resource = Core_State_Get("resources", ["index", index], false);
  if(resource) return resource;
 }	 
 
 var resource = await Core_Api("Resources_Index", {index});
 Core_State_Set("resources", ["index", index], resource);
 
 return resource;
}
