// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                        D A T A B A S E                                         //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function Database_View_Create(service, pagerows, fields, language, onselectrow, actions, options = [])
{
 var view = {};
 
 view["service"]     = service;
 view["pagerows"]    = pagerows;
 view["fields"]      = fields;
 view["onselectrow"] = onselectrow;
 view["language"]    = language;
 view["actions"]     = actions;
 view["options"]     = options;
 
 console.log("Created database with view", view);
 
 var display = UI_Element_Create("database/list-standard");
 Document_Element_SetObject(display, "view", view);
 
 console.log(display);
 return display;
}




async function Database_View_Data(display, rows, fields)
{
 var view   = Document_Element_GetObject(display, "view");
 var search = Object_Copy(Document_Element_GetObject(display, "search"));
 
 
 //ROWS
 switch(rows)
 {
  // ALL ADDRESSABLE ROWS
  case "all":
	search["rows"] = false;
	search["page"] = false;
  break;

  // CURRENTLY DISPLAYED
  default:
  break;  
 }
 
 
 
 // FIELDS
 search["fields"] = fields || search["fields"];
 
 
 var data = await Core_Api(view["service"], search);
 return data;
}





async function Database_View_Download(display, rows, fields, filename)
{
 var data = await Database_View_Data(display, rows, fields);
 
 if(data.length == 0) return;
 var file = [];
 
 // HEADER
 var header = Object.keys(data[0]);
 header.join(",");
 file.push(header);
 
 // ROWS
 for(var row of data)
 {
  var line = Object.values(row);
  line     = line.join(",");
  
  file.push(line);
 }
 
 file = file.join("\r\n");
 
 Storage_Data_Download(file, filename, "text/csv");
}





async function Database_View_Query(display, search)
{
 var view = Document_Element_GetObject(display, "view");
  
 search["rows"] = view["pagerows"];
  
 // IF NO PAGE SELECTED, THEN DEFAULT TO PAGE 1 AND REQUEST STATS
 if(!search["page"]) 
 {
  search["page"]  = 0;
  search["stats"] = true;
 }
 
 Document_Element_SetObject(display, "search", search);
 
 
 console.log("Querying database with search", view["service"], search);
 
 // READ FROM DATABASE
 var data = await Core_Api(view["service"], search);
 
 
 
 // IF STATS REQUESTED, UPDATE
 if(search["stats"])
 {
  var stats    = data.pop();
  var count    = stats["count"];
  var pagesize = Module_Config("users", "page");
  var pages    = Math.floor(count / pagesize);
  
  view["count"] = count;
  view["pages"] = pages;  
 }
 
 view["current-page"] = search["page"];
  
  
  
 
 // CREATE TABLE
 var events    = {};
 events["row"] = view["onselectrow"];
 
 // HEADER EVENTS : SORT 
 for(var field in view["fields"])
 {
  events[field] = 
  async function(event)
  {
   element = event.currentTarget;
   field   = Document_Element_GetData(element, "field");
   
   console.log(search);
   console.log(view);
   
   // IF CLICKED THE SAME AGAIN, INVERT ORDER
   if(search["order"].replaceAll(" DESC", "") == field.replaceAll(" DESC", ""))
   {
	if(search["order"].includes(" DESC")) var mode = ""; else var mode = " DESC";
   }
   else
   {
	var mode = "";
   }
   
   search["order"] = field + mode;
   search["page"]  = 0;
   
   await Database_View_Query(display, search);
  }
 }
 
 var table = UI_Table_Data(data, view["fields"], view["language"], events, view["actions"]);
 
 
 // CREATE DISPLAY (VIEW)
 var container       = UI_Element_Find(display, "list");
 container.innerHTML = "";
 container.appendChild(table);
 
 
 // UPDATE PAGE SELECTOR
 var select = UI_Element_Find(display, "page");
 Document_Select_Clear(select);
 
 // IF STATS WERE REQUESTED, UPDATE PAGE SELECTOR ACCORDINGLY
 if(search["stats"])
 {
  for(var i = 0; i <  view["pages"]; i++)
  {
   var option = Document_Select_AddOption(select, UI_Language_String("database/list", "select page", {n:i + 1}), i);
  }
 }
 
 select.value = view["current-page"];
 
 Document_Element_SetObject(select, "display", display); 
 
 // PAGE CHANGE
 select.onchange = 
 async function(event)
 {
  var element = event.currentTarget;
  var display = Document_Element_GetObject(element, "display");
  var view    = Document_Element_GetObject(display, "view");
  var search  = Document_Element_GetObject(display, "search");
  
  search["page"] = element.value;
  
  await Database_View_Query(display, search);
 }
 
 console.log(view["current-page"], view["pages"]);
 

 // NAVIGATION
 
 // PREV
 var element = UI_Element_Find(display, "prev");
 if(parseInt(view["current-page"]) <= 0) Document_Element_Disable(element, "style-disabled"); else Document_Element_Restore(element);
 
 element.onclick = 
 function()
 {
  select.value = parseInt(select.value) -1;
  Document_Event_Trigger(select, "change");
 }

 
 // NEXT
 var element = UI_Element_Find(display, "next");
 if(parseInt(view["current-page"]) >= (view["pages"] - 1)) Document_Element_Disable(UI_Element_Find(display, "next"), "style-disabled");  else Document_Element_Restore(element);
 
 element.onclick = 
 function()
 {
  select.value = parseInt(select.value) +1;
  Document_Event_Trigger(select, "change");
 }
 
 
 // EXPORT
 
 // EXPORT PAGE
 var element = UI_Element_Find(display, "export-page");
 Document_Element_SetObject(element, "display", display);
 
 if(!User_Can("export-page")) Document_Element_Disable(element, "style-disabled");

 element.onclick = 
 function(event)
 {
  var element = event.currentTarget;
  var display = Document_Element_GetObject(element, "display");
  
  var filename = Safe_Get(view, ["service"], false);
  var fields   = Safe_Get(view, ["options", "export_fields"], false);
  
  Database_View_Download(display, view["pagerows"], fields, filename);
 }
 
 
 
 // EXPORT ALL
 var element = UI_Element_Find(display, "export-all");
 Document_Element_SetObject(element, "display", display);
 
 if(!User_Can("export-all")) Document_Element_Disable(element, "style-disabled");
 
 element.onclick = 
 function(event)
 {
  var element = event.currentTarget;
  var display = Document_Element_GetObject(element, "display");
  var view    = Document_Element_GetObject(display, "view");
  
  var filename = Safe_Get(view, ["service"], false);
  var fields   = Safe_Get(view, ["options", "export_fields"], false);
  
  Database_View_Download(display, "all", fields, filename);
 }
 
 
 
 // MORE OPERATIONS
 var operations = Safe_Get(view, ["options", "operations"], {});
 var container  = UI_Element_Find(display, "operations");
 
 for(id in operations)
 {
  var operation = operations[id];
  var element   = UI_Element_Create("database/list-operation", {id, icon:operation["icon"]});
   
  Document_Element_SetObject(element, "display", display);
  Document_Element_SetObject(element, "onclick", operation["onclick"]);
   
  element.onclick = 
  function(event)
  {
   var element = event.currentTarget;
   var display = Document_Element_GetObject(element, "display");
   var onclick = Document_Element_GetObject(element, "onclick");
    
   onclick(display);
  }
   
  container.appendChild(element);
 }
 
}