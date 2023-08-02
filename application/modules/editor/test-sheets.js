// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         S H E E T S                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Editor_Test_ListSheets()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 var list     = UI_Element_Find(submodule, "test-sheets-list");
 var test     = Core_State_Get("editor", ["test"], {}); 
 var selected = Core_State_Get("editor", ["selected-sheet"]);
 var sheets   = test["sheets"] || [];
 
 
 list.innerHTML = "";
 for(var sheet of sheets)
 {
  var type  = Safe_Get(sheet, ["info", "type"], "unknown");
  
  var text  = UI_Language_String("test/types", type);
  var value = sheet["id"];
  
  var option      = Document_Select_AddOption(list, text, value, sheet);
  option.selected = (sheet == selected);
 }
 
 list.onkeyup = Editor_Test_MoveSheet;
}




function Editor_Test_UnselectSheet()
{
 var sheet = Core_State_Get("editor", ["selected-sheet"]);
 
 // UNSELECT IN STATE
 if(sheet)
 {
  Core_State_Set("editor", ["selected-sheet"], false);
 }
 
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 // UNSELECT IN LISTBOX
 UI_Element_Find(submodule, "test-sheets-list").selectedIndex = -1;
 
 // HIDE CONTROLS
 UI_Element_Find(submodule, "sheet-panel-edit").style.visibility = "hidden";
 UI_Element_Find(submodule, "sheet-panel-preview").style.visibility = "hidden";
 
 // SAVE
 Editor_Test_SaveSheet(sheet);
}




function Editor_Test_SelectSheet(event, sheet)
{ 
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 // FIRST OF ALL, UPDATE AND SAVE CURRENT
 Editor_Test_UpdateSheet();
 Editor_Test_SaveSheet();
 
 var list = UI_Element_Find(submodule, "test-sheets-list");
 
 // SELECT IN LISTBOX
 if(sheet)
 {
  var option      = Document_Select_OptionByObject(list, sheet);
  option.selected = true;
 }
 
 var index = list.selectedIndex;
 if(index == -1) return;
 
 
 // SELECT IN STATE
 var option = list.options[index];
 var sheet  = Document_Element_GetObject(option, "object");
 
 Core_State_Set("editor", ["selected-sheet"], sheet);
 
 
 // DISPLAY
 Editor_Test_DisplaySheet();
 
 
 // SHOW PANELS IF NOT VISIBLE ALREADY
 UI_Element_Find(submodule, "sheet-panel-edit").style.visibility    = "visible";
 UI_Element_Find(submodule, "sheet-panel-preview").style.visibility = "visible";
}







function Editor_Test_DisplaySheet(sheet)
{
 // DETERMINE SHEET: EXPLICIT OR CURRENTLY SELECTED
 if(!sheet)
 {
  var sheet = Core_State_Get("editor", ["selected-sheet"], {});
 }
 
 if(!sheet) return;
 
 var type       = Safe_Get(sheet, ["info", "type"]);
 var config     = Core_Data_Page("test/" + type);
 var sources    = Core_State_Get("editor", ["test", "sources"], {});

 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 var container = UI_Element_Find(submodule, "test-sheet-edit");
 
 // DISPLAY SHEET SOURCE AS EDITABLE INI
 var editor = Editor_Data(container, sheet, config, sources,
 // ON CHANGE, PREVIEW SHEET AND SAVE IT
 function(editor)
 {
  var sheet = Document_Element_GetObject(editor, "data");
   
  // UPDATE PREVIEW 
  Editor_Test_PreviewSheet(sheet);
  
  // FORCED SAVE
  Editor_Test_SaveSheet(sheet, true);
 });
 
 Core_State_Set("editor", ["test", "editor"], editor);
 
 Editor_Test_PreviewSheet(sheet);
}





function Editor_Test_PreviewSheet(sheet)
{ 
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 var display = UI_Element_Find(submodule, "test-sheet-display");
 Test_Sheet_Display(sheet, display); 
 
 
 // ACTIVATE OR DEACTIVATE SPECIAL TOOLS BASED ON TEST TYPE
 var type = Safe_Get(sheet, ["info", "type"]); 
 switch(type)
 {
  case "identify-items":
    var element = UI_Element_Find(submodule, "test-main-content");
	Document_Handler_SelectionRectangle(element, "style-outlined-accented", false, Editor_Test_SelectionRectangle);
  break;
 }
}




function Editor_Test_UpdateSheet()
{
 var sheet = Core_State_Get("editor", ["selected-sheet"]);
 if(!sheet) return;
 
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();

 var edit      = UI_Element_Find(submodule, "test-sheet-edit");
 
 // MARK FOR SAVING
 sheet["changed"] = true;
 
 Editor_Test_PreviewSheet(sheet);
}





async function Editor_Test_NewSheet(item)
{
 var test = Core_State_Get("editor", ["test"]);
 
 // DETERMINE ID BASED ON EXISTING SHEETS
 var max = 0;
 for(var sheet of test["sheets"])
 {  
  var n = parseInt(sheet["id"]);
  if(n > max) max = n;
 }
 max         = max + 1;

 
 // DETERMINE WHAT TYPE OF SHEET ARE WE CREATING
 var type      = Document_Element_GetData(item, "uid");
 var config    = Core_Data_Page("test/" + type);
 var sheet     = Data_Page_FromConfig(config);

 sheet["id"] = String(max).padStart(2, "0");
 test["sheets"].push(sheet);
 
 sheet["source"] = test["source"]; 
 
 await Core_Api("Test_Sheet_Write", {path:test["source"], sheet_id:sheet["id"], data:sheet});
 
 // SELECT AND DISPLAY
 Editor_Test_ListSheets(); 
 Editor_Test_SelectSheet(null, sheet);
}





async function Editor_Test_DuplicateSheet()
{
 var test  = Core_State_Get("editor", ["test"], {});
 var sheet = Core_State_Get("editor", ["selected-sheet"], {});
 
 var duplicate = JSON.parse(JSON.stringify(sheet));

 // DETERMINE ID BASED ON EXISTING SHEETS
 var max = 0;
 for(var sheet of test["sheets"])
 {  
  var n = parseInt(sheet["id"]);
  if(n > max) max = n;
 }
 max             = max + 1;
 duplicate["id"] = String(max).padStart(2, "0");
 
 duplicate["source"] = test["source"];
 
 test["sheets"].push(duplicate);
 
 await Core_Api("Test_Sheet_Write", {path:test["source"], sheet_id:duplicate["id"], data:duplicate});
 
 
 // SELECT AND DISPLAY
 Editor_Test_ListSheets(); 
 Editor_Test_SelectSheet(null, duplicate);
}




async function Editor_Test_DeleteSheet()
{
 var test  = Core_State_Get("editor", ["test"], {});
 var sheet = Core_State_Get("editor", ["selected-sheet"], {});
 
 // UNSELECT CURRENT SHEET
 Editor_Test_UnselectSheet();
 
 // DELETE
 await Core_Api("Test_Sheet_Delete", {path:test["source"], sheet_id:sheet["id"]});
 Array_Element_Delete(test["sheets"], sheet);

 // REFRESH LIST OF SHEETS
 Editor_Test_ListSheets(); 
}






function Editor_Test_SwapSheets(test, index_a, index_b)
{
 var temp                      = test["sheets"][index_b]["id"];
 test["sheets"][index_b]["id"] = test["sheets"][index_a]["id"];
 test["sheets"][index_a]["id"] = temp;
 
 var temp                = test["sheets"][index_b];
 test["sheets"][index_b] = test["sheets"][index_a];
 test["sheets"][index_a] = temp;
 
 Editor_Test_SaveSheet(test["sheets"][index_a], true);
 Editor_Test_SaveSheet(test["sheets"][index_b], true);
}




function Editor_Test_MoveupSheet()
{
 var test = Core_State_Get("editor", ["test"]);
 
 var sheet = Core_State_Get("editor", ["selected-sheet"]);
 if(!sheet) return;
 
 var index = test["sheets"].indexOf(sheet);
 
 if(index > 0)
 {  
  Editor_Test_SwapSheets(test, index - 1, index);
 }
 
 // UPDATE sheetS LIST DISPLAY
 Editor_Test_ListSheets();
}




function Editor_Test_MovedownSheet()
{
 var test = Core_State_Get("editor", ["test"]);
 
 var sheet = Core_State_Get("editor", ["selected-sheet"]);
 if(!sheet) return;
 
 var index = test["sheets"].indexOf(sheet);
 
 if(index < test["sheets"].length - 1)
 {
  Editor_Test_SwapSheets(test, index, index + 1);
 }
 
 // UPDATE sheetS LIST DISPLAY
 Editor_Test_ListSheets();
}





async function Editor_Test_MoveSheet(event)
{
 if(!event.ctrlKey) return;
 var swapping = Core_State_Get("editor", ["test", "swapping-sheets"]);
 if(swapping) return;
 
 Core_State_Set("editor", ["test", "swapping-sheets"], true);
 
 switch(event.key)
 {
  case "ArrowDown":
     await Editor_Test_MovedownSheet();
  break;
  
  case "ArrowUp":
	await Editor_Test_MoveupSheet();
  break;
 }
	 
 Core_State_Set("editor", ["test", "swapping-sheets"], false);
}





function Editor_Test_ResourceToSheet(item)
{
 var id     = Document_Element_GetData(item, "uid");
 
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
  
 var edit      = UI_Element_Find(submodule, "test-sheet-edit"); 
 edit.value    = edit.value.substring(0, edit.selectionStart) + id + edit.value.substr(edit.selectionEnd);
 
 Editor_Test_UpdateSheet();
}



function Editor_Test_MenuSheets(menu)
{
}



async function Editor_Test_SaveSheet(sheet, forced)
{
 if(!User_Can("modify-content")) return;
 
 
 // IF NO SHEET PASSED, SAVE CURRENT
 if(!sheet) var sheet = Core_State_Get("editor", ["selected-sheet"]);
 if(!sheet) return;

 // SHEET HAS CHANGES TO SAVE OR FORCED SAVE?
 if(!forced && !sheet["changed"]) return;
 var test = Core_State_Get("editor", ["test"]);

 // SAVE
 await Core_Api("Test_Sheet_Write", {path:test["source"], sheet_id:sheet["id"], data:sheet});
 
 delete sheet["changed"];
}