// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      O U T C O M E                                             //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



async function Editor_Outcome()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 // ICONS
 UI_Element_Find(submodule, "outcome-new").onclick    = Editor_Outcome_New;
 UI_Element_Find(submodule, "outcome-delete").onclick = Editor_Outcome_Delete;
 UI_Element_Find(submodule, "outcome-find").onclick   = Editor_Outcome_Find;
 
 
 // LIST
 var list = UI_Element_Find(submodule, "outcomes-list");
 list.onclick = Editor_Outcome_Select;


 // DISPLAY TEST SHEETS
 await Editor_Outcome_List();
 
 
 // READ WIP
 var wip = await Core_Api("User_Config_Read", {file:"editor", section:"wip", field:"outcome"});
 if(wip)
 {
  var list = UI_Element_Find(submodule, "outcomes-list");
  Document_Select_SelectByValue(list, wip);
 
  Editor_Outcome_Select();
 }
}



async function Editor_Outcome_List()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
	
 // STORE LIST FOR LATER USE
 var outcomes = await Resources_Outcomes(false, "list");
 
 // DISPLAY
 var list       = UI_Element_Find(submodule, "outcomes-list");
 list.innerHTML = "";
 for(var outcome of outcomes)
 {
  Document_Select_AddOption(list, outcome, outcome);
 }
 
}



async function Editor_Outcome_Select(event)
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();	

 var list = UI_Element_Find(submodule, "outcomes-list");
 if(list.selectedIndex == -1) return;
 
 var option = list.options[list.selectedIndex];
 var id     = option.value;
 Core_State_Set("editor", ["outcomes", "selected-outcome"], id);
  
 var data     = await Core_Api("Outcome_Read", {folder:"content/outcomes/" + id});
 var config   = Core_Data_Page("outcomes/template");
 var template = Data_Page_FromConfig(config);
 var outcome  = Data_Page_Complete(data, template);
 
 var container = UI_Element_Find(submodule, "outcome-edit");
 var outcomes  = await Resources_Outcomes(false, "list");
 
 Editor_Data(container, outcome, config, {outcomes:outcomes}, Editor_Outcome_Save);
 
 UI_Element_Find(submodule, "outcome-panel-edit").style.visibility = "visible";
 
 // STORE AS LAST OUTCOME EDITED
 Core_Api("User_Config_WriteValue", {file:"editor", section:"wip", field:"outcome", value:id});
}




async function Editor_Outcome_Unselect()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
	
 var list           = UI_Element_Find(submodule, "outcomes-list");
 list.selectedIndex = -1;

 UI_Element_Find(submodule, "outcome-panel-edit").style.visibility = "hidden";
 
 UI_Element_Find(submodule, "outcome-edit").innerHTML = "";
}





async function Editor_Outcome_New()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 var title       = UI_Language_String("editor/outcome", "popup new title");
 var placeholder = UI_Language_String("editor/outcome", "popup new placeholder");
 var id          = await UI_Popup_Input(title, undefined, undefined, placeholder);
 if(!id) return;
 
 id = id.toLowerCase().trim();
 
 // CHECK OVERWRITING
 var outcomes = await Resources_Outcomes(false, "list");
 if(outcomes.includes(id))
 {
  var title   = UI_Language_String("editor/outcome", "popup overwrite title");
  var text    = UI_Language_String("editor/outcome", "popup overwrite text", {id});
  var picture = Resources_URL("images/cover-alert.jpg");
  var confirm = await UI_Popup_Confirm(title, text, picture);
  
  if(!confirm) return;
 }	 
 
 
 // CREATE
 var path   = "content/outcomes/" + id;
 
 var config = Core_Data_Page("outcomes/template");
 var data   = Data_Page_FromConfig(config);

 await Core_Api("Outcome_Write", {path:path, data:data});
  
 var list   = UI_Element_Find(submodule, "outcomes-list");
 var option = Document_Select_AddOption(list, id, id);
 Document_Select_Sort(list);
 
 // AUTOSELECT
 option.scrollIntoView({behavior: "smooth", block: "center"});
 option.selected = true; 
 list.dispatchEvent(new Event("click"));
}




async function Editor_Outcome_Delete()
{
 var id   = Core_State_Get("editor", ["outcomes", "selected-outcome"]);
 
 var title    = UI_Language_String("editor/outcome", "popup delete title");
 var subtitle = UI_Language_String("editor/outcome", "popup delete subtitle", {id});
 var confirm  = await UI_Popup_Code(title, subtitle, undefined, id);
 if(!confirm) return;
 
 
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 var path = "content/outcomes/" + id;
 
 Editor_Outcome_Unselect();

 await Core_Api("Outcome_Delete", {path:path});
 await Resources_Outcomes(true);
 
 var list = UI_Element_Find(submodule, "outcomes-list"); 
 var option = Document_Select_OptionByValue(list, id);
 if(option) option.remove();
}




async function Editor_Outcome_Find()
{
}



async function Editor_Outcome_Save(editor)
{
 if(!User_Can("modify-content")) return;
 
 var data = Document_Element_GetObject(editor, "data", {});
 
 var id   = Core_State_Get("editor", ["outcomes", "selected-outcome"]);
 var path = "content/outcomes/" + id;
 
 await Core_Api("Outcome_Write", {path:path, data:data});
}