// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     B O O K  P A G E                                           //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Editor_Bookpage()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
  
 
 // SET BY ANOTHER MODULE? 
 if(!source)
 {
  var source = Core_State_Get("editor", ["edit-bookpage"], false);
  if(source)
  {
   // UNSET
   Core_State_Set("editor", ["edit-bookpage"], false);
  }
 }
 
 // JUST SET IT TO THE USER'S TEMP FOLDER
 if(!source)
 {
  var user_id = Safe_Get(application, ["user", "id"]); 
  var source  = Resources_URL("temp/editor/bookpage", "user", user_id);
 }

 Core_State_Set("editor", ["current-source"], source);
 
 
 // READ WIP BOOK PAGE 
 var bookpage = await Bookpage_Read(source);
   
 // SET AS CURRENTLY EDITED
 Core_State_Set("editor", ["bookpage", "current"], bookpage);
 
 // STORE AS LAST DIALOGUE EDITED
 Core_Api("User_Config_WriteValue", {file:"editor", section:"wip", field:"bookpage", value:source});


 // SET UP UI
 
 
 // READ AND USE AVAILABLE TEMPLATES
 var templates = await Core_Api("Bookpage_List_Templates");
 
 var select    = UI_Element_Find(submodule, "paragraph-template");
 Document_Select_AddOption(select, "", "");
 
 var items = Safe_Get(templates, "paragraphs", []);
 for(var template of items)
 {
  Document_Select_AddOption(select, template, template);
 }
 
 
 // PAGE TEMPLATE
 var select    = UI_Element_Find(submodule, "page-template");
 Document_Select_AddOption(select, "", "");
 
 var items = Safe_Get(templates, "pages", []);
 for(var template of items)
 {
  Document_Select_AddOption(select, template, template);
 }
 
 select.value    = Safe_Get(bookpage, ["page", "template"], "standard");
 select.onchange = Editor_Bookpage_SetTemplate;
 
 
 
 // STANDARD PARAGRAPHS
 var config   = Core_Data_Page("bookpage/paragraphs");
 var standard = Safe_Get(config, ["info", "paragraphs"], "").split(",");
 
 var select = UI_Element_Find(submodule, "paragraphs-list");
 var size   = 0;
 for(var id of standard)
 {
  var text = UI_Language_Object(config[id] || {});  
 
  Document_Select_AddOption(select, text, id);
  
  size++;
 }
 select.setAttribute("size", size);
 select.onclick  = Editor_Bookpage_SelectParagraph;
 
 
 // PARAGRAPH FIELDS
 for(var field of ["template", "title", "subtitle"])
 {
  var element      = UI_Element_Find(submodule, "paragraph-" + field);
  element.onchange = Editor_Bookpage_UpdateParagraphHeader;
 }
 
 // PARAGRAPH BLOCKS
 for(var n = 1; n <= 6; n++)
 {  
  var element     = UI_Element_Find(submodule, "paragraph-text-" + n);
  
  Document_Element_SetData(element, "n", n);
  
  element.onchange = Editor_Bookpage_UploadParagraphText;
 }
 
 // PARAGRAPH PICTURES
 for(var n = 1; n <= 6; n++)
 {  
  var element     = UI_Element_Find(submodule, "paragraph-picture-" + n);
  
  Document_Element_SetData(element, "n", n);
  
  element.onclick = Editor_Bookpage_UploadParagraphPicture;
 }
 
 // MANUAL RENDER
 UI_Element_Find(submodule, "page-render").onclick =
 async function()
 {
  await Editor_Bookpage_Display();
 }
 
 // SET/UNSET LAYOUT VISUALIZATION
 UI_Element_Find(submodule, "page-layout").onclick =
 async function()
 {
  var layout = Core_State_Get("editor", ["bookpage", "view-layout"], false);
  Core_State_Set("editor", ["bookpage", "view-layout"], !layout);
  
  await Editor_Bookpage_Display();
 }
 
 // WINDOW PREVIEW
 UI_Element_Find(submodule, "page-window").onclick =
 async function()
 {
  var lesson_id = Path_Filename(Path_Folder(Core_State_Get("editor", ["current-source"])));
  window.open("?framework=null&module=bookpage&lesson=" + lesson_id, "_", "popup, width="+ screen.width + ", height=" + screen.height + ", fullscreen=yes");
 }
 
 
 
 // FIRST DISPLAY
 Editor_Bookpage_Display();
}





function Editor_Bookpage_SelectParagraph(event)
{ 
 var page      = Core_State_Get("editor", ["bookpage", "current"]);
 
 var select    = UI_Element_Find("paragraphs-list");
 var id        = select.value;
 if(!id) return;
 
 Core_State_Set("editor", ["bookpage", "selected-paragraph"], id);
 
 UI_Element_Find("paragraph-edit").style.visibility = "visible";

 // FIELDS
 for(var field of ["template", "title", "subtitle"])
 {
  var element   = UI_Element_Find("paragraph-" + field);
  element.value = Safe_Get(page, [id, field], "");
 }
 
 // TEXTS
 for(var n = 1; n <= 6; n++)
 {
  var texts = Safe_Get(page, [id, "texts"], []);
  var text  = texts[n] || "";
  
  var element   = UI_Element_Find("paragraph-text-" + n);
  element.value = text;
 }
 
 // PICTURES
 for(var n = 1; n <= 6; n++)
 {
  var pictures = Safe_Get(page, [id, "pictures"], []);
  var picture  = pictures[n] || false;
  
  var element  = UI_Element_Find("paragraph-picture-" + n);
  if(picture) element.src = picture + "?c=" + Date.now(); else element.src = Resources_URL("images/none.png");
 }
}





async function Editor_Bookpage_Display()
{
 var page            = Core_State_Get("editor", ["bookpage", "current"]);
 var layout          = Core_State_Get("editor", ["bookpage", "view-layout"], false);
 var element         = await Bookpage_Render(page, {}, {layout});
 
 var container       = UI_Element_Find("page-preview");
 container.innerHTML = "";
 container.appendChild(element);

 Document_Element_FitContent(element, 0.01);
}



async function Editor_Bookpage_SetTemplate()
{
 var page   = Core_State_Get("editor", ["bookpage", "current"]);
 var path   = Core_State_Get("editor", ["current-source"]);
 
 var select = UI_Element_Find("page-template");
 Safe_Set(page, ["page", "template"], select.value);
 
 var header = page["page"];

 Editor_Bookpage_Display();
 
 await Core_Api("Bookpage_Write_Header", {path, header});
}





async function Editor_Bookpage_UpdateParagraphHeader(event)
{ 
 var page      = Core_State_Get("editor", ["bookpage", "current"]);
 
 var select    = UI_Element_Find("paragraphs-list");
 var id        = select.value;
 if(!id) return;
  

 for(var field of ["template", "title", "subtitle"])
 {
  var element   = UI_Element_Find("paragraph-" + field); 
  Safe_Set(page, [id, field], element.value);
 }
 
 
 // UPDATE
 var path    = Core_State_Get("editor", ["current-source"]);
  
 // UPDATE PARAGRAPH HEADER
 var header = {};
 for(var field in page[id]) header[field] = page[id][field];	
 await Core_Api("Bookpage_Write_ParagraphHeader", {path, id, header});
 
 // DEPENDING ON UPDATED FIELD, PERFORM OTHER ACTIONS
 var element = event.srcElement;
 var uid     = Document_Element_GetData(element, "uid");
 
 Editor_Bookpage_Display();
}




async function Editor_Bookpage_UploadParagraphText(event)
{ 
 var page      = Core_State_Get("editor", ["bookpage", "current"]);
 var path      = Core_State_Get("editor", ["current-source"]);
 
 var element   = event.currentTarget;
 var n         = Document_Element_GetData(element, "n");
 var paragraph = Core_State_Get("editor", ["bookpage", "selected-paragraph"]);
 
 var texts    = Safe_Get(page, [paragraph, "texts"], []);
 var text     = texts[n] || "";
 
 var text = element.value;
 await Core_Api("Bookpage_Write_ParagraphText", {path, paragraph, n, text});
 
 Safe_Set(page, [paragraph, "texts", n], text);
 
 // RENDER PAGE AGAIN
 await Editor_Bookpage_Display();
}






async function Editor_Bookpage_UploadParagraphPicture(event)
{ 
 var page      = Core_State_Get("editor", ["bookpage", "current"]);
 var path      = Core_State_Get("editor", ["current-source"]);
 
 var element   = event.currentTarget;
 var n         = Document_Element_GetData(element, "n");
 var paragraph = Core_State_Get("editor", ["bookpage", "selected-paragraph"]);
 
 var pictures  = Safe_Get(page, [paragraph, "pictures"], []);
 var picture   = pictures[n] || false;
 
 // IF THERE IS ALREADY A PICTURE, DELETE IT
 if(picture)
 {
  Safe_Set(page, [paragraph, "pictures", n], false);
  element.src = Resources_URL("images/none.png");
  
  await Core_Api("Bookpage_Picture_Delete", {path, paragraph, n});
 }
 
 else

 // IF THERE IS NO PICTURE, UPLOAD ONE
 {
  var files = await Storage_File_Select({accept:".jpg"}) || [];
  if(files.length == 0) return;
 
  var dest = path + "/" + paragraph + "-" + n + ".jpg";
  await Storage_Files_Upload(files, "api.php?direct&f=Storage_File_Upload&dest=" + dest, {});
 
  UI_Element_Find("paragraph-picture-" + n).src = dest + "?c=" + Date.now();
 
  Safe_Set(page, [paragraph, "pictures", n], dest);
 }
 
 
 // RENDER PAGE AGAIN
 await Editor_Bookpage_Display();
 
}