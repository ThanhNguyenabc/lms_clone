// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                            T E S T                                             //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Editor_Test()
{
 // FLUSH EDITOR FROM CERTAIN SAVED STATES
 Editor_Flush();
 
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 
 // IMMEDIATELY SET TEST MODULE TO EDIT MODE
 Core_State_Set("test", ["mode"], "edit");
 
 
 // DETERMINE TEST TO EDIT
 var source = false;
  
 // SET BY ANOTHER MODULE? 
 if(!source)
 {
  var source = Core_State_Get("editor", ["edit-test"], false);
  if(source)
  {
   // UNSET
   Core_State_Set("editor", ["edit-test"], false);
  }
 }
 
 // JUST SET IT TO THE USER'S TEMP FOLDER
 if(!source)
 {
  var user_id = Safe_Get(application, ["user", "id"]); 
  var source  = Resources_URL("temp/editor/test", "user", user_id);
 }
 
 Core_State_Set("editor", ["current-source"], source);
 
	
 // READ WIP TEST
 var test = await Test_Load(source);   
 
  
 
 // SET AS CURRENTLY EDITED
 Core_State_Set("editor", ["test"], test);
 
 
 // STORE AS LAST TEST EDITED
 Core_Api("User_Config_WriteValue", {file:"editor", section:"wip", field:"test", value:source});

 
 // SHEETS LIST SELECT
 var list     = UI_Element_Find(submodule, "test-sheets-list");
 list.onclick = Editor_Test_SelectSheet;
 
 
 // SHEETS LIST MENU 
 var submenu = UI_Menu_FromObject("new", Core_Data_Page("test/types"), false, Editor_Test_NewSheet);

 var menu = UI_Menu_Create("sheets-list", 
 // MENU ITEMS
 {
  new:
  {
   icon:    "clipboard-list", 
   text:    UI_Language_String("editor", "test sheets-menu new"),
   state:   "enabled",
   tag:     "new",
   submenu: submenu
  },
  
  duplicate:
  {
   icon:    "clone", 
   text:    UI_Language_String("editor", "test sheets-menu duplicate"),
   state:   "enabled",
   tag:     "modify",
   func:    Editor_Test_DuplicateSheet
  },
  
  moveup:
  {
   icon:    "arrow-up", 
   text:    UI_Language_String("editor", "test sheets-menu moveup"),
   state:   "enabled",
   tag:     "new",
   func:    Editor_Test_MoveupSheet
  },
  
  movedown:
  {
   icon:    "arrow-down", 
   text:    UI_Language_String("editor", "test sheets-menu movedown"),
   state:   "enabled",
   tag:     "new",
   func:    Editor_Test_MovedownSheet
  },
  
  break1:
  {
  },
  
  delete:
  {
   icon:  "trash-can", 
   text:  UI_Language_String("editor", "test sheets-menu delete"),
   state: "enabled",
   tag:   "modify",
   func:  Editor_Test_DeleteSheet
  }
 },
 
 // MENU EVENTS
 {
  onshow: Editor_Test_MenuSheets
 }); 
  
 var list = UI_Element_Find(submodule, "test-sheets-list");
 UI_Menu_Assign(list, menu, {direction:"bottom right"});


 
 // ASSEMBLE TEST SOURCES
 var sources         = Core_State_Get("editor", ["test", "sources"], {});
 sources["outcomes"] = await Resources_Outcomes(false, "list");
 
 Core_State_Set("editor", ["test", "sources"], sources);
 

 // SET TEST PREVIEW
 UI_Element_Find(submodule, "preview-practice").onclick = Editor_Test_Preview;
 UI_Element_Find(submodule, "preview-test").onclick     = Editor_Test_Preview;


 // SET TEST EXPORT
 UI_Element_Find(submodule, "export").onclick =
 function()
 {
  var filename = "test.zip";
  Editor_Download(filename);
 }
 
 
 
 // SET UP UPLOAD OF NEW RESOURCES
 var icon     = UI_Element_Find(submodule, "upload-resources");
 icon.onclick = Editor_Test_AddResources;

 Document_Handler_FileDrop(UI_Element_Find(submodule, "resources-list"), {}, 
 function(files)
 {
  Editor_Test_AddResources(false, files);
 });

 // DISPLAY TEST RESOURCES
 UI_Element_Find(submodule, "resources-list").onclick = Editor_Resource_Preview;
 
 Editor_Test_ListResources();
 
 
 // DISPLAY TEST SHEETS
 Editor_Test_ListSheets();
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     R E S O U R C E S                                          //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



async function Editor_Test_AddResources(event, files)
{
 if(!files)
 {
  var files  = await Storage_File_Select({multiple:true});
 }
 
 var current = Core_State_Get("editor", ["test", "resources"], []); 
 
 await Editor_Resources_Upload(files, current);
 
 Editor_Test_ListResources();
 
 Editor_Test_DisplaySheet();
}





function Editor_Test_ListResources()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 var resources = Core_State_Get("editor", ["test", "resources"], []);
 var container = UI_Element_Find(submodule, "resources-list");
 
 var sources = Core_State_Get("editor", ["test", "sources"]);
 Editor_Resources_Catalog(resources, sources);
 
 Editor_Resources_Display(resources, container);
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                           M I S C                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



async function Editor_Test_Preview(event)
{ 
 if(event)
 {
  var element = event.currentTarget;
  var mode    = Document_Element_GetData(element, "uid");
  mode        = mode.split("-");
  mode        = mode[1];
 }
 else
 {
  var mode = "preview";
 }
 
 var source  = Core_State_Get("editor", ["current-source"]);
 console.log(source, mode);
 
 // CURRENT SHEET
 var sheets = Core_State_Get("editor", ["test", "sheets"], []);
 var sheet  = Core_State_Get("editor", ["selected-sheet"], {});
 var index  = sheets.indexOf(sheet);
 
 if(!index) index = 0;

 
 await Activity_Run(source,
 {
  display:    "popup", 
  escape:     true, 
  mode, 
  navigation: true,
  sheet:      index,
  student:    -1
 }); 
 
 // SANITIZE TEST POST PREVIEW
 var sheets = Core_State_Get("editor", ["test", "sheets"]);
 
 for(var sheet of sheets)
 { 
  var type   = Safe_Get(sheet, ["info", "type"]);
  var config = Core_Data_Page("test/" + type);
 
  Data_Page_Sanitize(sheet, config);
 }
 
 // BACK TO EDIT MODE
 Test_Mode("edit");
}



function Editor_Test_SelectionRectangle(rectangle)
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 var editor  = Core_State_Get("editor", ["test", "editor"]);
 if(!editor) return;
  
 var section = Document_Element_GetObject(editor, "selectedsection");
 if(!section) return;
 
 // IF SECTION HAS COORDINATES, USE THE RECTANGLE TO CHANGE THEM
 if(section["left"])
 {
  section["left"]   = parseInt(rectangle.style.left);
  section["top"]    = parseInt(rectangle.style.top);
  section["width"]  = parseInt(rectangle.style.width);
  section["height"] = parseInt(rectangle.style.height);
  
  var sheet = Document_Element_GetObject(editor, "data");
  Editor_Test_PreviewSheet(sheet);
 }
 
}