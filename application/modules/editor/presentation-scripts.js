// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                        S C R I P T S                                           //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Editor_Presentation_ScriptsControls()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 // SCRIPTS
 var list     = UI_Element_Find(submodule, "scripts-list");
 list.onclick = Editor_Presentation_SelectScript; 
  
 // SCRIPTS PANEL MENU
 var menu = UI_Menu_Create("scripts-menu", 
 // MENU ITEMS
 {  
  create:
  {
   icon:    "file-lines", 
   text:    UI_Language_String("editor", "scripts menu create"),
   func:    Editor_Presentation_NewScript,
   tag:     "new"
  },
  
  moveup:
  {
   icon:    "arrow-up", 
   text:    UI_Language_String("editor", "scripts menu moveup"),
   func:    Editor_Presentation_MoveScriptUp,
   tag:     "modify"
  },
  
  movedown:
  {
   icon:    "arrow-down", 
   text:    UI_Language_String("editor", "scripts menu movedown"),
   func:    Editor_Presentation_MoveScriptDown,
   tag:     "modify"
  },
  
  play:
  {
   icon:    "play", 
   text:    UI_Language_String("editor", "scripts menu test"),
   func:    Editor_Presentation_PlayScript,
   tag:     "modify"
  },
  
  
  
  break1:
  {
  },
  
  delete:
  {
   icon:    "trash-can", 
   text:    UI_Language_String("editor", "scripts menu delete"),
   state:  "enabled",
   func:    Editor_Presentation_DeleteScript,
   tag:     "modify"
  }
 },
 
 // MENU EVENTS
 {
  onshow: Editor_Presentation_MenuScripts
 }); 
  
 UI_Menu_Assign(list, menu, {direction:"bottom right"});
 
 
 
 
 // SCRIPT LINE MENU
 var menu = UI_Menu_Create("scripts-menu", 
 // MENU ITEMS
 {  
  create:
  {
   icon:    "file-lines", 
   text:    UI_Language_String("editor", "script line create"),
   func:    Editor_Presentation_NewLine,
   state:   "enabled",
   tag:     "new"
  },
  
  sort:
  {
   icon:    "arrow-down-short-wide", 
   text:    UI_Language_String("editor", "script line sort"),
   func:    Editor_Presentation_SortScript,
   state:   "enabled",
   tag:     "new"
  },
  
  break1:
  {
  },
  
  delete:
  {
   icon:    "trash-can", 
   text:    UI_Language_String("editor", "script line delete"),
   state:  "enabled",
   func:    Editor_Presentation_DeleteLine,
   tag:     "modify"
  }
 },
 
 // MENU EVENTS
 {
  onshow: Editor_Presentation_MenuLines
 });
 
 var panel = UI_Element_Find(submodule, "script-lines");
 UI_Menu_Assign(panel, menu, {direction:"bottom right"});
}




function Editor_Presentation_ListScripts()
{	
 var slide = Core_State_Get("editor", ["selected-slide"]);
 if(!slide) return;
 
 
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 // DISPLAY THIS SLIDE'S SCRIPTS
 var list       = UI_Element_Find(submodule, "scripts-list");
 list.innerHTML = "";
 
 
 // LIST SCRIPTS
 var scripts = slide["scripts"];
 
 for(var script of scripts)
 {
  var value  = script["id"];
  var text   = script["name"];
  var option = Document_Select_AddOption(list, text, value, script);
  
  script["option"] = option;
 }
 
 
 // UNSELECT LINE IF ANY SELECTED
 Editor_Presentation_UnselectLine();
}




function Editor_Presentation_UnselectScript()
{	
 // UNSELECT IN STATE
 Core_State_Set("editor", ["selected-script"], undefined);
 
// GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 // UNSELECT IN SCRIPTS LIST
 var list = UI_Element_Find(submodule, "scripts-list");
 list.selectedIndex = -1;

 // UNSELECT LINE
 Editor_Presentation_UnselectLine();

 // HIDE PANELS THAT ARE NOT SUPPOSED TO BE VISIBLE IF NO SCRIPT IS SELECTED
 UI_Element_Find(submodule, "script-properties").style.visibility = "hidden"; 
}





function Editor_Presentation_SelectScript(event)
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 var list   = UI_Element_Find(submodule, "scripts-list");
 var option = Document_Select_SelectedOption(list);
 if(!option) return;
 
 var script = Document_Element_GetObject(option, "object");
 if(!script) return;
 
 
 // REFLECT SELECTED SCRIPT CHANGE
 Core_State_Set("editor", ["selected-script"], script);
 
 
 // POPULATE SCRIPT PROPERTIES PANEL AND REVEAL IT
 Editor_Presentation_DisplayScript();
}




function Editor_Presentation_UpdateScript(event)
{
 var script = Core_State_Get("editor", ["selected-script"]);
 if(!script) return;
 
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 // SCRIPT NAME
 var control           = UI_Element_Find(submodule, "script-name");
 script["name"]        = control.value;
 script["option"].text = script["name"];
 
 
 // MARK CURRENT SLIDE AS CHANGED
 Editor_Presentation_SlideChanged();
}





function Editor_Presentation_DisplayScript()
{ 
 // IF THERE'S ACURRENTLY SELECTED LINE, UNSELECT IT
 Editor_Presentation_UnselectLine();
 
 // GET SELECTED SCRIPT INFO
 var script = Core_State_Get("editor", ["selected-script"]);
 if(!script) return;
 
 
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 // DISPLAY LINES
 var list = UI_Element_Find(submodule, "script-lines");
 list.innerHTML = "";
 
 // SCRIPT NAME
 var control      = UI_Element_Find(submodule, "script-name");
 control.value    = script["name"];
 control.onchange = Editor_Presentation_UpdateScript;
 
 for(var line of script["lines"])
 {	  
  // CREATE
  var element = UI_Element_Create("editor/script-line");
   
	
  // FILL ELEMENT'S SELECTS WITH OPTIONS
  Editor_Presentation_UpdateControls(element);
  
  
  // ASSOCIATE ELEMENT'S CONTROLS WITH LINE
  var controls = Document_Element_FindChildren(element, "uid", undefined, ["recurse"]);
  for(var control of controls)
  {
   var uid       = Document_Element_GetData(control, "uid");
   control.value = line[uid];
   
   Document_Element_SetObject(control, "line", line);
   control.onchange = Editor_Presentation_UpdateLine;
  }
  
  // LINE HINT
  Editor_Presentation_UpdateLineHint(element, line["command"]);
  
  // ON CLICK SELECT LINE
  element.onclick = Editor_Presentation_SelectLine;
  
  //ON DOUBLE CLICK TEST LINE
  element.ondblclick = Editor_Presentation_TestLine;
  
  // LINK WITH LINE, AND APPEND
  Document_Element_SetObject(element, "line", line);
  line["control"] = element;
  
  list.appendChild(element);
 }
 
 
 // HIGHLIGHT CURRENTLY SELECTED LINE
 Editor_Presentation_UpdateLineSelection();
 
 
 // SHOW SCRIPT PROPERTIES
 var container = UI_Element_Find(submodule, "script-properties");
 container.style.visibility = "visible"; 
}


 

 
 
 
function Editor_Presentation_NewScript()
{
 var slide = Core_State_Get("editor", ["selected-slide"]);
 if(!slide) return;
 
 
 // DETERMINE ID
 var max = -1;
 for(var s of slide["scripts"])
 {
  var i = parseInt(String_Filter_AllowDigits(s["id"]));
  if(i > max) max = i;
 }
 max    = max + 1;
 var id = String(max).padStart(2, "0");
 
 var data     = {};
 data["name"] = "Script " + id;
 
 
 // CREATE SCRIPT
 var script = Presentation_Script_Create(id, data, slide);
 slide["scripts"].push(script);
 
 
 // ADD AT LEAST ONE FIRST LINE
 var line = Presentation_Script_CreateLine(script);
 
 
 // SELECT AND DISPLAY
 Core_State_Set("editor", ["selected-script"], script);
 Editor_Presentation_ListScripts();
 
 
 // MARK CURRENT SLIDE AS CHANGED
 Editor_Presentation_SlideChanged();
}






function Editor_Presentation_DeleteScript()
{  
 var script = Core_State_Get("editor", ["selected-script"]);
 if(!script) return;
 
 var slide = Core_State_Get("editor", ["selected-slide"]);
 if(!slide) return;
 
 var index = slide["scripts"].indexOf(script);
 if(index !== -1) slide["scripts"].splice(index, 1);
 
 
 Editor_Presentation_UnselectScript();
 Editor_Presentation_ListScripts();
 
 
 // MARK CURRENT SLIDE AS CHANGED
 Editor_Presentation_SlideChanged();
}





function Editor_Presentation_SwapScripts(slide, index_a, index_b)
{
 var temp                        = slide["scripts"][index_b]["id"];
 slide["scripts"][index_b]["id"] = slide["scripts"][index_a]["id"];
 slide["scripts"][index_a]["id"] = temp;
 
 var temp                  = slide["scripts"][index_b];
 slide["scripts"][index_b] = slide["scripts"][index_a];
 slide["scripts"][index_a] = temp; 
}




function Editor_Presentation_MoveScriptUp()
{
 var slide = Core_State_Get("editor", ["selected-slide"]);
 
 var script = Core_State_Get("editor", ["selected-script"]);
 if(!script) return;
 
 var index = slide["scripts"].indexOf(script);
 
 if(index > 0)
 {  
  Editor_Presentation_SwapScripts(slide, index - 1, index);
 }
 
 // UPDATE SCRIPTS LIST DISPLAY
 Editor_Presentation_ListScripts();
 
 
 // MARK CURRENT SLIDE AS CHANGED
 Editor_Presentation_SlideChanged();
}




function Editor_Presentation_MoveScriptDown()
{
 var slide = Core_State_Get("editor", ["selected-slide"]);
 
 var script = Core_State_Get("editor", ["selected-script"]);
 if(!script) return;
 
 var index = slide["scripts"].indexOf(script);
 
 if(index < slide["scripts"].length - 1)
 {
  Editor_Presentation_SwapScripts(slide, index, index + 1);
 }
 
 // UPDATE SCRIPTS LIST DISPLAY
 Editor_Presentation_ListScripts();
 
 
 // MARK CURRENT SLIDE AS CHANGED
 Editor_Presentation_SlideChanged();
}





function Editor_Presentation_SortScript()
{
 var script =  Core_State_Get("editor", ["selected-script"]); 
 if(!script) return;
 
 script["lines"].sort(
 function(a, b)
 {
  if(parseFloat(a["time"]) > parseFloat(b["time"])) return +1; 
  else 
  if(parseFloat(a["time"]) < parseFloat(b["time"])) return -1; 
  else 
  return 0
 }); 
 
 Editor_Presentation_DisplayScript();
 
 
 // MARK CURRENT SLIDE AS CHANGED
 Editor_Presentation_SlideChanged();
}



async function Editor_Presentation_PlayScript()
{
 var script = Core_State_Get("editor", ["selected-script"]);
 if(!script) return;
 
 var slide = script["slide"];
 
 // TAKE A SNAPSHOT OF THE SLIDE AS IT IS NOW, EXECUTE SCRIPT, WAIT A SECOND, RESTORE THE SLIDE AS IT WAS
 
 Presentation_Slide_Snapshot(slide);
 
 await Presentation_Script_Execute(script,
 // FOR EACH LINE THAT IS STARTED`
 function(line)
 {
  var control = line["control"];
  
  // MARK LINE AS EXECUTING
  control.style.border = "5px dashed var(--color-accented)";
 },
 
 // FOR EACH LINE THAT HAS BEEN EXECUTED
 function(line)
 {
  var control = line["control"];
  
  // MARK LINE AS EXECUTED 
  control.style.border = "5px solid var(--color-accented)";
	
  // UPDATE DISPLAY HELPERS TO REFLECT CHANGES
  Editor_Presentation_UpdateDisplayHelpers();
 });
 
 
 // GIVE TIME TO SEE CHANGES
 await Client_Wait(1.5);
 
 
 // RESET SLIDE TO INITIAL STATE
 Presentation_Slide_Reset(slide);
 Editor_Presentation_UpdateDisplayHelpers();
}









// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                           L I N E S                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



function Editor_Presentation_SelectLine(event)
{
 var script = Core_State_Get("editor", ["selected-script"]);
 if(!script) return;
 
 var element = event.currentTarget;
 var line    = Document_Element_GetObject(element, "line");

 Core_State_Set("editor", ["selected-line"], line);
 
 
 // HIGHLIGHT ELEMENT TARGETED BY THIS LINE
 Editor_Presentation_HighlightLineElement(line);
 
 
 // UPDATE DISPLAY TO REFLECT SELECTION
 Editor_Presentation_UpdateLineSelection();
}





function Editor_Presentation_UnselectLine()
{
 var line = Core_State_Get("editor", ["selected-line"]);
 if(!line) return;
 
 Core_State_Set("editor", ["selected-line"], false);
 
 // UPDATE DISPLAY TO REFLECT SELECTION
 Editor_Presentation_UpdateLineSelection();
}




function Editor_Presentation_UpdateLineSelection()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 var selected_line = Core_State_Get("editor", ["selected-line"]);
 
 var container = UI_Element_Find(submodule, "script-lines");
 Document_Conditional_Class(container, "color-accented", 
 function(element)
 {
  return (Document_Element_GetObject(element, "line") == selected_line);
 });
}





function Editor_Presentation_UpdateLineHint(box, command)
{
 var page = Core_Data_Page("core/presentation-commands");
 var hint = Safe_Get(page, [command, "hint"], "");
 
 var control         = UI_Element_Find(box, "params");
 control.placeholder = hint;
}




function Editor_Presentation_UpdateLine(event)
{
 var control = event.currentTarget;
 
 var field = Document_Element_GetData(control, "uid");
 var line  = Document_Element_GetObject(control, "line");

 line[field] = control.value; 


 // DEPENDING ON FIELD THAT CHANGED, HIGHLIGHT CHANGES
 switch(field)
 {
  case "command":
	var box     = Document_Element_FindParent(control, "uid", "line");
	var command = line[field];
	
    Editor_Presentation_UpdateLineHint(box, command);
  break;
  
  case "element":
    Editor_Presentation_HighlightLineElement(line); 
  break;
 }
 
 
 // MARK CURRENT SLIDE AS CHANGED
 Editor_Presentation_SlideChanged();
}





function Editor_Presentation_NewLine(menu, item, event)
{
 var selected_script = Core_State_Get("editor", ["selected-script"]);
 if(!selected_script) return;
 
 var line = Presentation_Script_CreateLine(selected_script);
 
 Editor_Presentation_DisplayScript();
 
 // MARK CURRENT SLIDE AS CHANGED
 Editor_Presentation_SlideChanged();
}





function Editor_Presentation_DeleteLine(menu, item, event)
{
 var script = Core_State_Get("editor", ["selected-script"]);
 if(!script) return;
 
 var line = Core_State_Get("editor", ["selected-line"]);
 if(!line) return;
 
 Editor_Presentation_UnselectLine();
 
 var index = script["lines"].indexOf(line);
 if(index == -1) return;
 
 script["lines"].splice(index, 1);
 
 Editor_Presentation_DisplayScript();
 
 // MARK CURRENT SLIDE AS CHANGED
 Editor_Presentation_SlideChanged();
}




function Editor_Presentation_HighlightLineElement(line)
{
 // SELECT ELEMENT SPECIFIED IN THIS LINE (IF ANY)
 var slide   = Core_State_Get("editor", ["selected-slide"]);

 // FIND ELEMENT TARGETED BY THE LINE
 var element = Presentation_Slide_FindElement(slide, line["element"]);
 if(element) 
 {
  Editor_Presentation_SetSelectedElement(element);
 }
 else
 {
  Editor_Presentation_UnselectElement();
 }
 
}




async function Editor_Presentation_TestLine(event, line)
{
 // IF CALLED BY EVENT, DETERMINE LINE THROUGH EVENT SOURCE
 if(event)
 {
  var script = Core_State_Get("editor", ["selected-script"]);
  if(!script) return;
 
  var element = event.currentTarget;
  var line    = Document_Element_GetObject(element, "line");
 }
 
 if(!line) return;
 
 
 // GET ELEMENT AFFECTED BY THIS LINE
 var element = Presentation_Script_LineTarget(line);
 
 
 // EXECUTE LINE FOR TESTING (UPDATE DISPLAY HELPERS TO REFLECT CHANGES)
 await Presentation_Script_ExecuteLine(line);
 Editor_Presentation_UpdateDisplayHelpers();
 

 // WAIT 1.5 SECONDS TO GIVE TIME TO SEE CHANGES
 await Client_Wait(1.5);  
 
 
 // RESET AFFECTED ELEMENT AND RESTORE DISPLAY HELPERS
 if(element) Presentation_Element_Reset(element);
 Editor_Presentation_UpdateDisplayHelpers();
}










// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                           M E N U S                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



function Editor_Presentation_MenuScripts(menu, event)
{ 
 var selected_script = Core_State_Get("editor", ["selected-script"]);
  
 // SETUP MENU
 var items = UI_Menu_ListItems(menu);
 for(var id in items)
 {
  var item = items[id];
  
  if(item["tag"] == "modify" && !selected_script)  item["state"] = "disabled";
  else
  item["state"] = "enabled";
 }  
}



function Editor_Presentation_MenuLines(menu, event)
{ 
 var selected_line = Core_State_Get("editor", ["selected-line"]);


 // SETUP MENU
 var items = menu["items"];
 
 for(var id in items)
 {
  var item = items[id];
  
  if(item["tag"] == "modify" && !selected_line)  item["state"] = "disabled";
  else
  item["state"] = "enabled";
 }  
}