// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       E D I T O R                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Editor_OnLoad(module, data)
{ 
 // CONTENT DEVELOPERS LIST 
 var users = await Core_Api("Users_List_ByRole", {role:["contdev", "contman"]});
 var devs  = [];
 for(var user of users)
 { 
  var dev     = {}; 
  dev["id"]   = user["id"];
  dev["name"] = user["firstname"] + " " + user["lastname"];  
  
  devs.push(dev);
 }
 Core_State_Set("editor", ["developers", "index"], devs);
}





async function Editor_OnShow(module, data)
{
 // FOR THE EDITOR WE DON'T WANT TO PRESERVE LAST PAGE. MODULE PAGE WILL BE TAKEN ONLY FROM URL PARAMETER STRING, IF PRESENT
 Core_State_Set("editor", ["page"], false);
 
 var page = Module_Page_Get(); 
 
 await Editor_SetPage(false, page);
}




async function Editor_OnUnload()
{
}


 
 
 


async function Editor_Download()
{
 var source = Core_State_Get("editor", ["current-source"]);
 var blob   = await Core_Api("Storage_Folder_Download", {dir:source, passthru:true}, {type:"blob"});
 
 var filename = Path_Filename(Path_Folder(source)) + ".zip";
 Storage_Blob_Download(blob, filename);
}





async function Editor_ProcessImage(file, options = {})
{
 if(options["asktype"]) 
 {
  var title   = "";
  var content = "";
  var picture = "";
  
  var transparency = await UI_Popup_Confirm(title, content, picture);
  if(transparency) var format = "image/png"; else var format = "image/jpeg";
 }
 else
 {
  // DETERMINE FORMAT
  var format = options["type"] || file["override-type"] || file["type"] || "image/png";
 }
 
 // TURN FILE INTO DATA URL
 var data = await Storage_File_Read(file, {whole:true});
 
 // RESIZE
 var blob     = await Document_Image_Resize(data, {constraints:{width:800, height:600}, format:format, quality:0.5});
 blob["name"] = file["override-name"] || file["name"];
 
 return blob;
}






async function Editor_Main(submodule)
{
 var pages = Module_Data("editor", "module", "pages");
 var pages = pages.split(","); 
 
 for(var page of pages)
 {
  page = page.trim();
  
  
  var vars         = {};
  vars["pretitle"] = "";
  vars["title"]    = UI_Language_Object(Core_Data_Section("editor/" + page, "title"));
  vars["text"]     = UI_Language_Object(Core_Data_Section("editor/" + page, "text"));
  vars["picture"]  = Resources_URL("images/" + Core_Data_Value("editor/" + page, "media", "card"));
  
  var card     = UI_Element_Create("core/card-vertical-small", vars);
  Document_Element_SetData(card, "page", page);
  card.onclick = Editor_SetPage;
  
  submodule.appendChild(card);
 }
}




async function Editor_SetPage(event, page)
{
 if(event)
 {
  var element = event.currentTarget;
  var page    = Document_Element_GetData(element, "page");
 }
 
 // ANY WORK IN PROGRESS?
 var wip = await Core_Api("User_Config_Read", {file:"editor", section:"wip", field:page});
 if(wip)
 {
  Core_State_Set("editor", ["edit-" + page], wip);
 }
 
 // FLUSH EDITOR FROM CERTAIN SAVED STATES
 Editor_Flush();
 
 // LOAD
 await Module_Page_Set(page);
 
 // QUICK SEMI-HACK TO PROVIDE ALL INPUTS AND TEXT AREAS WITH FILTERING OF SPECIAL CHARACTERS
 var container = UI_Element_Find("module-page");
 var elements  = Document_Element_Children(container, true);
 for(var element of elements)
 {
  var type = element.nodeName.toLowerCase();
  if(type == "input" || type == "textarea") Document_Handler_KeyFilter(element, ['"', '\\']);
 }
}




function Editor_Control_UpdateQuirks(control)
{
	
 // COLOR QUIRK: IF A CONTROL IS A SELECT THAT PICKS FROM COLORS, THEN IT'S FONT COLOR SHOULD REFLECT THE CURRENTLY SELECTED COLOR'S VALUE
 var source =  Document_Element_GetData(control, "source");
 if(source == "colors")
 {
  var option = Document_Select_SelectedOption(control);
  if(option) var color = option.style.color; else var color = "";
  
  control.style.color = color;
 }
 
}



function Editor_Flush()
{
 var state = Core_State_Get("editor");
 var keys  = Object.keys(state);
 
 for(var key of keys) 
 {
  if(key.startsWith("selected-"))
  {
   Core_State_Set("editor", key, false);
  }
 }
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     R E S O U R C E S                                          //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



async function Editor_Resources_Upload(files, current)
{
 var title    = UI_Language_String("editor", "popup upload title");
 var subtitle = UI_Language_String("editor", "popup upload subtitle");
 var picture  = Resources_URL("images/files.png");
 var popup    = await UI_Popup_Create({title, subtitle, picture}, undefined, undefined, {escape:false, instant:true, open:true})


 var path  = Core_State_Get("editor", ["current-source"], "");
 var added = [];
 

 // OF THE UPLOADED RESOURCES, WE MUST FIRST OF ALL PROCESS IMAGES FOR SIZE REDUCTION
 var upload = [];
 for(var file of files)
 {   
  if(Media_Info_Type(file["name"] || "") == "image")
  {  
   console.log("File " + file["name"] + " needs processing");
   var processed = await Editor_ProcessImage(file);
   
   upload.push(processed);
  }
  else
  {
   upload.push(file);
  }
 }
 
 
 // THEN WE SEND FILES TO THE DESTINATION FOLDER
 await Storage_Files_Upload(upload, "api.php?direct&f=Core_Files_Upload&overwrite=0&path=" + path, {}, 
 // ON FILE UPLOADED
 function(name, data, response)
 {
  var res = Safe_JSON(response["path"]);
  var ext = Path_Extension(name).toLowerCase();
  var src = Path_Filename(res);
  
  added.push(src);
 });
 
 
 // UPDATE IN-MEMORY STRUCTURE
 for(var filename of added)
 {
  if(current.indexOf(filename) == -1) current.push(filename);
 }
 
 
 
 // UPDATE ALL SELECTS THAT MAKE USE OF RESOURCES
 Editor_Resources_UpdateControls(current);
 

 
 // RETURN PATHS FOR ALL THE NEWLY STORED RESOURCES
 UI_Popup_Close(popup);
 return added;
}





function Editor_Resources_UpdateControls(resources, container)
{
 if(!container) var container = document.body;
 
 
 // ALL MEDIA FILE SELECTS
 var selects     = Document_Element_FindChildren(container, "source", "media", ["recurse"]);
 var sources     = resources.filter(
 function(item)
 {
  var type = Media_Info_Type(item);
  return (type == "image" || type == "video" || type == "audio")
 }); 
 
 for(var select of selects)
 {  
  Document_Select_Clear(select);
  Document_Select_AddOption(select, "", "");
  
  for(var source of sources)
  {
   Document_Select_AddOption(select, source, source);
  }
 }
 
 
 // ALL PICTURE/VIDEO FILE SELECTS
 var selects     = Document_Element_FindChildren(container, "source", "pictures", ["recurse"]);
 var sources     = resources.filter(
 function(item)
 {
  var type = Media_Info_Type(item);
  return (type == "image" || type == "video")
 }); 
 
 for(var select of selects)
 {  
  Document_Select_Clear(select);
  Document_Select_AddOption(select, "", "");
  
  for(var source of sources)
  {
   Document_Select_AddOption(select, source, source);
  }
 }

 
 // ALL AUDIO FILE SELECTS
 var selects     = Document_Element_FindChildren(container, "source", "sounds", ["recurse"]);
 var sources     = resources.filter(
 function(item)
 {
  var type = Media_Info_Type(item);
  return (type == "audio")
 }); 
 
 for(var select of selects)
 { 
  Document_Select_Clear(select);
  Document_Select_AddOption(select, "", "");
 
  for(var source of sources)
  {
   Document_Select_AddOption(select, source, source);
  }
 }
}



async function Editor_Resources_Delete(item)
{
 var container = Document_Element_GetObject(item, "tag");
 var selected  = Document_Select_SelectedOption(container);
 if(!selected) return;
 
 var title     = UI_Language_String("editor", "popup delete title");
 var subtitle  = UI_Language_String("editor", "popup delete subtitle", {item:selected.value});
 var picture   = Resources_URL("images/delete.png");
 
 var confirm   = await UI_Popup_Confirm(title, subtitle, picture);
 
 if(confirm)
 {
  var resources = Document_Element_GetObject(container, "resources", resources);
  var path      = Core_State_Get("editor", ["current-source"], "");
  
  // DELETE FROM MEMORY
  Array_Element_Delete(resources, selected.value);
  
  // DELETE FILE
  await Core_Api("Core_File_Delete", {filename:path + "/" + selected.value});
  
  Editor_Resources_Display(resources, container);
 }
}



function Editor_Resources_Display(resources, container)
{
 container.innerHTML = "";
 
 for(var category of ["image", "audio", "video", "pdf"])
 {
  var text        = UI_Language_String("editor/media-types", category);
  var option      = Document_Select_AddOption(container, text, text);
  option.disabled = true;
  Document_CSS_SetClass(option, "text-option-category");
 
  
  for(var resource of resources)
  {
   var type = Media_Info_Type(resource);
   if(type == category)
   {
	Document_Select_AddOption(container, resource, resource);
   }
  }
  
  Document_Select_AddOption(container, "", "");
  option.disabled = true;
 }
 
 // MENU
 var items =
 {
  delete:
  {
   icon:  "trash-can", 
   text:  UI_Language_String("editor", "resources menu delete"),
   state: "enabled",
   tag:   container,
   func:  Editor_Resources_Delete
  }
 }
 
 var menu  = UI_Menu_Create("resources-menu", items);
 UI_Menu_Assign(container, menu);
 
 Document_Element_SetObject(container, "resources", resources);
}





function Editor_Resources_Catalog(resources, catalog)
{
 console.log(resources);
 for(var category of ["image", "audio", "video", "pdf"]) catalog[category] = [];
 
 for(var resource of resources)
 {
  var category = Media_Info_Type(resource);
  catalog[category].push(resource);
 }
 
}



function Editor_Resource_Preview()
{
 var container     = UI_Element_Find("resources-list");
 var preview       = UI_Element_Find("resource-preview");
 preview.innerHTML = "";  
  
 var option = Document_Select_SelectedOption(container);
 if(!option) return;
  
 var file = option.value;
 var type = Media_Info_Type(file);
  
 if(type)
 {
  var element = UI_Element_Create("editor/thumbnail-" + type);
   
  var source = Core_State_Get("editor", ["current-source"]);
  var media  = UI_Element_Find(element, "media");
  media.src  = source + "/" + file;
   
  var preview = UI_Element_Find("resource-preview");
  preview.appendChild(element);
 }
}
