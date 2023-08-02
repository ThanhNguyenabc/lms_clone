// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         D A T A                                                //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Editor_Data(display, data = {}, config = {}, sources = {}, onchange, onevent)
{
 var editor = UI_Element_Create("editor/data-table");

 Document_Element_SetObject(editor, "display",  display);
 Document_Element_SetObject(editor, "data",     data);
 Document_Element_SetObject(editor, "config",   config);
 Document_Element_SetObject(editor, "sources",  sources); 
 Document_Element_SetObject(editor, "onchange", onchange);
 Document_Element_SetObject(editor, "onevent",  onevent);
 

 // SECTIONS
 for(var section_id in data)
 {
  if(Data_Key_Compliant(section_id, config))
  {
   Editor_Data_Section(editor, section_id);
  }
 }
 

 display.innerHTML = ""; 
 display.appendChild(editor); 
 
 return editor;
}




function Editor_Data_Refresh(editor)
{
 var display  = Document_Element_GetObject(editor, "display");
 var data     = Document_Element_GetObject(editor, "data");
 var config   = Document_Element_GetObject(editor, "config");
 var sources  = Document_Element_GetObject(editor, "sources");
 var onchange = Document_Element_GetObject(editor, "onchange");

 editor       = Editor_Data(display, data, config, sources, onchange);

 return editor;
}





function Editor_Data_Section(editor, section_id)
{  
 var data     = Document_Element_GetObject(editor, "data");
 var config   = Document_Element_GetObject(editor, "config");
 
 var section  = data[section_id];

 
 // CREATE SECTION HEADER
 var section_element = UI_Element_Create("editor/data-section", {id:section_id});
 UI_Element_Find(section_element, "text").innerHTML = section_id;
 
 Document_Element_SetObject(section_element, "data",   data);
 Document_Element_SetObject(section_element, "config", config);
 Document_Element_SetObject(section_element, "editor", editor);
  
  
 // IF THIS SECTION IS ABSENT FROM CONFIG, THEN IT CAN BE DELETED
 if(Safe_Get(config, [section_id]) === undefined)
 {
  var icon              = UI_Element_Find(section_element, "delete");
  icon.style.visibility = "visible";
  icon.onclick          = Editor_Data_DeleteSection;
  
  Document_Element_SetObject(icon, "section", section_element);
 }
  
 editor.appendChild(section_element);
  
    
	
	
 // CREATE ONE ROW FOR EACH ITEM IN THE SECTION
 for(var field_id in section)
 {
  Editor_Data_Field(editor, section_id, field_id);
 }
 
 
 
 // CREATE MENU
 var items = {};
 
 // FIRST MENU SECTION: TEMPLATES
 var templates = Data_Config_Templates(config);
 for(var id in templates)
 {
  var item      = {};
  
  item["icon"]  = "folder-plus";
  item["text"]  = "New " + templates[id]["name"];
  item["state"] = "enabled"; 
  item["func"]  = Editor_Data_NewSection;
  item["tag"]   = editor;
  
  items[id]     = item;
 }

 var menu = UI_Menu_Create("editor-menu", items); 

 var header = UI_Element_Find(section_element, "header");
 Document_Element_SetObject(header, "editor",  editor);
 Document_Element_SetObject(header, "section", section);
 
 UI_Menu_Assign(header, menu, {direction:"bottom right"});
 
 header.onclick = 
 function(event)
 {  
  var element = event.currentTarget;
  var editor  = Document_Element_GetObject(element, "editor");
  var section = Document_Element_GetObject(element, "section");
  
  Document_Element_SetObject(editor, "selectedsection", section);
  console.log(section);
 }
 

 return section_element;
}





function Editor_Data_Field(editor, section_id, field_id)
{
 var data     = Document_Element_GetObject(editor, "data");
 var config   = Document_Element_GetObject(editor, "config");
 var sources  = Document_Element_GetObject(editor, "sources"); 
 var onchange = Document_Element_GetObject(editor, "onchange");
 
 var section = data[section_id];
 var field   = data[section_id][field_id];
 
 var row     = UI_Element_Create("editor/data-row");
   
   
 // DISPLAY FIELD ID
 UI_Element_Find(row, "key").innerHTML = field_id;
    
 
 // IF SECTION_ID CONTAINS NUMBERS, IT MEANS IT CAME FROM A SECTION TEMPLATE, SO DERIVE IT
 var numbers = String_Filter_AllowDigits(section_id);
 if(numbers.length > 0)
 {
  var s_id = String_Filter_AllowAlpha(section_id) + " " + "N".repeat(numbers.length);
 }
 else
 {
  var s_id = section_id;
 }
	
 
 // IF FIELD CONTAINS NUMBERS, IT MEANS IT CAME FROM A FIELD TEMPLATE, SO DERIVE IT
 var numbers = String_Filter_AllowDigits(field_id);
 if(numbers.length > 0)
 {
  var f_id = String_Filter_AllowAlpha(field_id) + " " + "N".repeat(numbers.length);
 }
 else
 {
  var f_id = field_id;
 }
 
 
 
 // DETERMINE FIELD CONFIGURATION 
 var field_config = Object_From_String(Safe_Get(config, [s_id, f_id], ""));
 var type         = field_config["type"] || "text";
   
 var control           = UI_Element_Find(row, type);
 control.style.display = "inline-block";
   
 Document_Element_SetObject(control, "section", section);
 Document_Element_SetData(control,   "field",   field_id);
 Document_Element_SetData(control,   "type",    type);
 Document_Element_SetData(control,   "source",  field_config["source"]);
 
 
 switch(type)
 {
  case "text":
		control.innerHTML = section[field_id];
		//control.onkeyup   = Function_Debounce(Editor_Data_SetValue, 1500);
		control.onblur    = Editor_Data_SetValue;
		
		// FILTER SPECIAL CHARACTERS
		Document_Handler_KeyFilter(control, ['"', '\\']);
  break;
	
  case "select":
	    Document_Select_AddOption(control, "", "");
		 
		if(field_config["values"])
		{
		 var values = field_config["values"].split(",") || [];
		 for(var value of values) Document_Select_AddOption(control, value, value);
		}
		
		// IF SELECT SOURCE TYPE SPECIFIED, GET MEDIA FROM PROVIDED SOURCE
		var source = field_config["source"];
		if(source)
		{
		 // IF SOURCE CONTAINS A SLASH, THEN IT IS IMPLIED IT'S A DATA FILE
	     if(source.includes("/"))
		 {
		  var options = Core_Data_Page(source);
		  for(var value in options)
		  {
		   var text = UI_Language_Object(options[value]);
		   
		   Document_Select_AddOption(control, text, value);
		  }
		 }
		 // OTHERWISE TAKE FROM SPECIFIED SOURCES
		 else
		 {
		  var options = sources[source] || [];
	 
		  for(var option of options)
		  {
	       if(field_config["field-value"]) var value = option[field_config["field-value"]]; else var value = option;
		   if(field_config["field-text"])  var text  = option[field_config["field-text"]];  else var text  = option;
		   
		   Document_Select_AddOption(control, text, value, option);
		  }
		 }
		}
		    
		control.value    = section[field_id];
		control.onchange = Editor_Data_SetValue;
  break;
 }
   
  
 // IF THIS FIELD IS ABSENT FROM CONFIG, THEN IT CAN BE DELETED
 if(Safe_Get(config, [section_id, field_id]) === undefined)
 {
  UI_Element_Find(row, "delete").style.visibility = "visible";
 }
   
   
 // IS THIS FIELD EVEN EDITABLE AT ALL?
 if(field_config["edit"] == "hidden") row.style.display = "none";
   
 var section = UI_Element_Find(editor, "section-" + section_id);
 var fields  = UI_Element_Find(section, "fields");
 
 
 
 // CREATE FIELD CREATION MENU
 var items = {};
 
 // FIRST MENU SECTION: TEMPLATES
 var templates = Data_Config_Templates(config, section_id);
 for(var id in templates)
 {
  var item      = {};
  
  item["icon"]  = "square-plus";
  item["text"]  = UI_Language_String("editor", "data menu new", {id:templates[id]["name"]});
  item["state"] = "enabled"; 
  item["func"]  = Editor_Data_NewField;
  item["tag"]   = editor;
  
  var cid       = section_id + "_" + id;
  items[cid]    = item;
 }
 
 
 // IF THIS FIELD IS COMPLIANT WITH TEMPLATES IN THE CONFIGURATION DATA, THEN IT'S A FIELD THAT CAN BE DELETED
 if(Data_Key_Compliant(field_id, config[section_id], true)) 
 {
  var item = {};
  item["icon"]  = "trash-can";
  item["text"]  = UI_Language_String("editor", "data menu delete", {id:field_id});
  item["state"] = "enabled";
  item["func"]  = Editor_Data_DeleteField;
  item["tag"]   = editor;
  
  var cid         = section_id + "_" + field_id;
  items["break1"] = {};
  items[cid]      = item;
 }
 
 var menu = UI_Menu_Create("section-menu", items); 
 UI_Menu_Assign(row, menu, {direction:"bottom right"});
 
 
 Document_Element_SetData(row, "uid", section_id + "-" + field_id);
 fields.appendChild(row);
 return row;
}




function Editor_Sources_Update(editor, update)
{
 var sources  = Document_Element_GetObject(editor, "sources");
 if(update)
 {
  Object.assign(sources, update);
 }
 
 var controls = Document_Element_FindChildren(editor, "source", undefined, ["recurse"]);
 
 for(var control of controls)
 {
  var source = Document_Element_GetData(control, "source");
  if(sources[source])
  {
   var selected = control.value;   
      
   Document_Select_Clear(control);
   for(var item of sources[source]) Document_Select_AddOption(control, item, item);  

   control.value = selected;   
  }
 }
}




async function Editor_Data_SetValue(event)
{
 var element = event.currentTarget || event.target; 
 var editor  = Document_Element_FindParent(element, "uid", "editor");

 var section = Document_Element_GetObject(element, "section");
 var field   = Document_Element_GetData(element,   "field");
 var type    = Document_Element_GetData(element,   "type");
 
 switch(type)
 {
  case "text":
	var value = element.innerText;
  break;
  
  case "select":
	var value = element.value;
  break;
 }
 
 Safe_Set(section, [field], value);
 
 var onchange = Document_Element_GetObject(editor, "onchange");
 if(onchange) await onchange(editor, section, field);
}



function Editor_Data_FindSection(editor, id)
{
 var section = UI_Element_Find(editor, "section-" + id);
 
 return section;
}




async function Editor_Data_NewSection(item)
{ 
 var id       = Document_Element_GetData(item,     "uid");
 var editor   = Document_Element_GetObject(item,   "tag");
 var data     = Document_Element_GetObject(editor, "data");
 var config   = Document_Element_GetObject(editor, "config");
 var onchange = Document_Element_GetObject(editor, "onchange");
 
 var sections = Object.keys(data);
 var template = String_Numtemplate_Info(id);
 var next     = String_Numtemplate_Next(template, sections);
  
  
 // CREATE NEW DATA SECTION AND SET FIELD VALUES ACCORDING TO CONFIGURATION 
 data[next] = {};
 for(var field in config[id])
 {
  var field_config  = Object_From_String(config[id][field]);
  data[next][field] = field_config["default"] || "";
 }
 var element = Editor_Data_Section(editor, next); 
 
 
 // MAKE SURE THE NEWLY CREATED SECTION IS SEEN
 element.scrollIntoView({behavior: "smooth", block: "end"});
 Document_Element_Animate(element, "flash 1.5s");
 
 if(onchange) await onchange(editor);
 
 return data[next];
}






async function Editor_Data_NewField(item)
{ 
 var id       = Document_Element_GetData(item,     "uid");
 var editor   = Document_Element_GetObject(item,   "tag");
 var data     = Document_Element_GetObject(editor, "data");
 var config   = Document_Element_GetObject(editor, "config");
 var onchange = Document_Element_GetObject(editor, "onchange");
 
 
 // DERIVE SECTION AND FIELD IF FROM THE ITEM ID (PACKED AS SECTION_FIELD)
 var id         = id.split("_");
 var section_id = id[0];
 var field_id   = id[1];
 
 console.log(config);
 console.log(section_id, field_id);
 
 
 // DERIVE NEXT FIELD ID FROM FIELD IT AS TEMPLATE AND ALL OTHER FIELDS ALREADY PRESENT IN THE SECTION
 var section  = data[section_id];
 var fields   = Object.keys(section);
 var template = String_Numtemplate_Info(field_id);
 var next     = String_Numtemplate_Next(template, fields);
  

 // CREATE NEW SECTION FIELD ACCORDING TO CONFIGURATION 
 // GET DEFAULT VALUE
 var field_config = Object_From_String(config[section_id][field_id] || "");
 var value        = field_config["default"] || "";
 
 data[section_id][next] = value; 
 var element = Editor_Data_Field(editor, section_id, next); 
 
 
 // MAKE SURE THE NEWLY CREATED FIELD IS SEEN
 element.scrollIntoView({behavior: "smooth", block: "end"});
 Document_Element_Animate(element, "flash 1.5s");
 
 
 if(onchange) await onchange(editor, section_id, field_id);
}




function Editor_Data_DeleteField(item)
{
 var id       = Document_Element_GetData(item,     "uid");
 var editor   = Document_Element_GetObject(item,   "tag");
 var data     = Document_Element_GetObject(editor, "data");
 var config   = Document_Element_GetObject(editor, "config");
 var onchange = Document_Element_GetObject(editor, "onchange");
 
 
 // DERIVE SECTION AND FIELD IF FROM THE ITEM ID (PACKED AS SECTION_FIELD)
 var id         = id.split("_");
 var section_id = id[0];
 var field_id   = id[1];
 
 
 // REMOVE ROW FROM EDITOR
 var element = UI_Element_Find(editor, section_id + "-" + field_id);
 element.remove();
 
 
 // DELETE FROM DATA
 Safe_Delete(data, [section_id, field_id]);
 
 
 if(onchange) onchange(editor, section_id, field_id);
}






async function Editor_Data_DeleteSection(event)
{
 var icon     = event.currentTarget;
 var section  = Document_Element_GetObject(icon, "section");
 
 var id       = Document_Element_GetData(section,    "uid");
 id           = id.replace("section-", "");
 
 var editor   = Document_Element_GetObject(section,  "editor");
 var data     = Document_Element_GetObject(section,  "data");
 var config   = Document_Element_GetObject(section,  "config");
 var onchange = Document_Element_GetObject(editor,   "onchange");
 var onevent  = Document_Element_GetObject(editor,   "onevent");

 // DELETE FROM EDITOR
 section.remove();
 
 
 // DELETE FROM DATA
 var item = data[id];
 delete data[id]; 
 
 if(onevent)  await onevent(editor, "delete-section", id, item);
 if(onchange) await onchange(editor);
}