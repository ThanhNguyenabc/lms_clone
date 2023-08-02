// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                   D I A L O G U E                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Activity_Dialogue_Run(source, display, config)
{ 
 // TRICK: USE PARENT DIRECTORY, SO THAT IF WE RUN lessons/xxx/vocabulary  IT ACTUALLY READS FROM lessons/xxx/ THE INFO.DAT FILE
 source = Path_Folder(source);
 
 // SET TEST MODULE IN THE DESIRED MODE AND LOAD TEST
 var terms = await Vocabulary_Terms_Read(source);
 terms     = Object_To_Array(terms, "id");
 
 Core_State_Set("activity", ["data"], terms); 
 Core_State_Set("activity", ["index"], 0);
 
 // UPDATE CONTAINER CONTROLS 
 Activity_Vocabulary_UpdateControls();
 
 // DISPLAY FIRST TERM
 Activity_Vocabulary_DisplayTerm()
}




async function Activity_Vocabulary_Finish()
{
 var terms  = Core_State_Get("activity", ["data"]);
 var config = Core_State_Get("activity", ["config"]);
 
 var result = Vocabulary_Practice_Result(terms); 
 Core_State_Set("activity", ["result"], result);
 
 var popup = Core_State_Get("activity", ["popup"]); 
 await UI_Popup_Close(popup); 
}




function Activity_Vocabulary_DisplayTerm()
{
 var popup     = Core_State_Get("activity", ["popup"]);
 var terms     = Core_State_Get("activity", ["data"]);
 var config    = Core_State_Get("activity", ["config"]);

 var container = UI_Element_Find(popup, "activity-body");
 var index     = Core_State_Get("activity", ["index"]);
 var term      = terms[index];
 
 Vocabulary_Practice(terms, index, container, {mode:config["mode"], oncomplete:
 function()
 {
  var popup = Core_State_Get("activity", ["popup"]);
  
  var terms = Core_State_Get("activity", ["data"]);
  var index = Core_State_Get("activity", ["index"]);
  
  
  // IF THIS WAS THE LAST TERM, DISPLAY THE FINISH FLAG
  Activity_Vocabulary_UpdateLastTerm();
  
  
 }});
}




function Activity_Vocabulary_UpdateLastTerm()
{
 var popup = Core_State_Get("activity", ["popup"]);
 var terms = Core_State_Get("activity", ["data"]);
 var index = Core_State_Get("activity", ["index"]);

 // IF THIS WAS THE LAST TERM, DISPLAY THE FINISH FLAG
 var finish = UI_Element_Find(popup, "activity-finish");
 var next   = UI_Element_Find(popup, "activity-next");
  
 if(index == terms.length - 1)
 {
  next.style.display   = "none";
  finish.style.display = "flex";
  
  Document_Element_Animate(finish, "flash 1.5s 1.5");  
 }
 else
 // OTHERWISE DISPLAY THE "NEXT" BUTTON
 {
  next.style.visibility = "visible";
   
  //Document_Element_Animate(next, "flash 1.5s 1.5");  
 }
}





function Activity_Vocabulary_UpdateControls()
{
 var popup     = Core_State_Get("activity", ["popup"]);
 var terms     = Core_State_Get("activity", ["data"]);
 var config    = Core_State_Get("activity", ["config"]);
 
 var index     = Core_State_Get("activity", ["index"]);
 var total     = terms.length;
 
 var progress       = UI_Element_Find(popup, "activity-progress");
 var index          = parseInt(index) + 1;
 progress.innerHTML = index + " / " + total;
 
 
 // IN TEST MODE, HIDE "NEXT". NEXT IS MADE AVAILABLE ONLY ON TERM COMPLETION
 if(config["mode"] == "test")
 {
  var next              = UI_Element_Find(popup, "activity-next");	 
  next.style.visibility = "hidden";
 }
 

 if(config["mode"] == "practice")
 {
  // DISABLE "PREV" ON THE FIRST SHEET
  var prev = UI_Element_Find(popup, "activity-prev");
  if(index == 1)
  {
   Document_CSS_SetClass(prev, "style-disabled");
  }
  else
  {
   Document_CSS_UnsetClass(prev, "style-disabled");
  }
 
  // ON THE LAST SHEET, "NEXT" MUST BE FINISH INSTEAD
  Activity_Vocabulary_UpdateLastTerm();
  
 }
 
}




function Activity_Vocabulary_ControlPrev()
{
 var index = Core_State_Get("activity", ["index"]);
 
 if(index > 0) 
 {
  index = index - 1;
  Core_State_Set("activity", ["index"], index);
  
  Activity_Vocabulary_DisplayTerm();
  Activity_Vocabulary_UpdateControls();
 }
}




function Activity_Vocabulary_ControlNext()
{
 var config = Core_State_Get("activity", ["config"]);
 var terms  = Core_State_Get("activity", ["data"]);
 var index  = Core_State_Get("activity", ["index"]);
 var total  = terms.length;
 var term   = terms[index];
 
 // IF IN STUDENT MODE
 if(config["student"]) 
 { 
  // IN ALL OTHER CASES, MOVE FORWARD 
  {
   index = index + 1;
   Core_State_Set("activity", ["index"], index);
  
   Activity_Vocabulary_UpdateControls();
   Activity_Vocabulary_DisplayTerm();
  }

 }
 
 else
 
 // IF NOT IN STUDENT MODE, JUST GO FORWARD
 {
  index = index + 1;
  Core_State_Set("activity", ["index"], index);
  
  Activity_Vocabulary_UpdateControls();
  Activity_Vocabulary_DisplayTerm();
 }
}




async function Activity_Vocabulary_ControlFinish()
{
 await Activity_Vocabulary_Finish();
}