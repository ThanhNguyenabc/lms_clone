// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          T E S T                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Activity_Test_Run(source, display, config)
{
 // IF MAGIC PARAMETER IS ON, ACTIVATE CHEATS
 if(Core_Magic())
 {
  Input_Keyboard_Assign(document.body,
  function()
  {
   // SKIP TEST
   if(Input_Keyboard_Pressed(false, [KEY_LCTRL, KEY_RIGHT]))
   {
    Activity_Test_Next();
   }
   
   // FINISH TEST
   if(Input_Keyboard_Pressed(false, [KEY_LCTRL, KEY_PGDN]))
   {
    Activity_Test_Finish();
   }
  });
 }
	
	
 // SET TEST MODULE IN THE DESIRED MODE AND LOAD TEST
 Test_Mode(config["mode"] || "test");
 
 
 var test = await Test_Load(source);
 Core_State_Set("activity", "data", test);
 
 
 // IN STUDENT MODE, DO NOT ALLOW GOING BACK
 if(config["student"])
 {
  // DISALLOW GOING BACK
  UI_Element_Find(display, "activity-prev").style.visibility = "hidden";
 }
 

 // FIND WHERE IN THE CONTAINER THE TEST WILL BE DISPLAYED, AND ASSIGN IT
 Test_Assign(test, UI_Element_Find(display, "activity-body"));
 
 
 // SET CURRENT SHEET
 test["index"] = config["sheet"] || 0;
 if(test["index"] > test["sheets"].length -1) test["index"] = 0;
 
 
 // SHOW FIRST SHEET
 Activity_Test_UpdateControls();
 Test_Display(test, "practice");
}





async function Activity_Test_Finish()
{
 var test   = Core_State_Get("activity", ["data"]);
 var result = Test_Result(test);

 Core_State_Set("activity", ["result"], result);
 
 var popup = Core_State_Get("activity", ["popup"]); 
 await UI_Popup_Close(popup); 
}





function Activity_Test_UpdateControls()
{
 var test      = Core_State_Get("activity", ["data"]);
 var container = Core_State_Get("activity", ["container"]);
 var config    = Core_State_Get("activity", ["config"]);
 var sheet     = Test_Sheet_Current(test);
 
 var progress       = UI_Element_Find(container, "activity-progress");
 var index          = parseInt(test["index"]) + 1;
 var total          = test["sheets"].length;
 progress.innerHTML = index + " / " + total;
 

 // DISABLE "PREV" ON THE FIRST SHEET
 var prev = UI_Element_Find(container, "activity-prev");
 if(index == 1)
 {
  Document_CSS_SetClass(prev, "style-disabled");
 }
 else
 {
  Document_CSS_UnsetClass(prev, "style-disabled");
 }
  

 // DISABLE "NEXT" ON THE LAST SHEET, IN BROWSING MODE ONLY
 if(!config["student"])
 {
  var next = UI_Element_Find(container, "activity-next");
  if(index == total)
  {
   Document_CSS_SetClass(next, "style-disabled");
  }
  else
  {
   Document_CSS_UnsetClass(next, "style-disabled");
  }
 }
 
}





function Activity_Test_ControlPrev()
{
 var test = Core_State_Get("activity", ["data"]);
 
 Test_Sheet_Prev(test, true);
 
 Activity_Test_UpdateControls();
}



async function Activity_Test_Next()
{
 var config    = Core_State_Get("activity", ["config"]);
 var test      = Core_State_Get("activity", ["data"]);
 var container = Core_State_Get("activity", ["container"]);
 var index     = parseInt(test["index"]) + 1;
 var total     = test["sheets"].length;
 var sheet     = Test_Sheet_Current(test);
 
 await Test_Sheet_Next(test, true);
 Activity_Test_UpdateControls();
}




async function Activity_Test_ControlNext()
{
 var config    = Core_State_Get("activity", ["config"]);
 var test      = Core_State_Get("activity", ["data"]);
 var container = Core_State_Get("activity", ["container"]);
 var index     = parseInt(test["index"]) + 1;
 var total     = test["sheets"].length;
 var sheet     = Test_Sheet_Current(test);

 var next      = UI_Element_Find(container, "activity-next");
 
 // IF IN STUDENT MODE
 if(config["student"]) 
 { 
  
  // IF THERE WAS STILL NO FEEDBACK, GIVE FEEDBACK
  if(typeof sheet["result"] == "undefined")
  {
   // DISABLE INTERACTION
   var popup = Core_State_Get("activity", ["popup"]);
   next.style.visibility = "hidden";
   Document_Element_Disable(popup);
  
   // GET FEEDBACK
   sheet["result"] = await Test_Feedback_CurrentSheet();
   console.log("Sheet Result: ", sheet["result"]);

   // RESTORE INTERACTION
   next.style.visibility = "visible";
   Document_Element_Restore(popup);
   
   // IN TEST MODE, DON'GO FORWARD. REQUIRE ONE MORE CLICK LATER
   if(config["mode"] == "test")
   {
    // BLINK CONTROL TO SIGNAL THAT THE USER CAN NOW REALLY GO FORWARD
    await Document_Element_Animate(next, "flash 1.5s 1.5");
   }
   else
   // IN OTHER MODES JUST GO FORWARD	   
   {
	Test_Sheet_Next(test, true);
    Activity_Test_UpdateControls(); 
   }
  }
  else
  {
   // ADVANCE
   Test_Sheet_Next(test, true);
   Activity_Test_UpdateControls();
  }
  
  // IF THIS WAS THE LAST TEST TO EVALUATE, HIDE NEXT AND SHOW "FINISH"
  if(index == total)
  {
   next.style.display = "none";
	
   var finish = UI_Element_Find(container, "activity-finish")
   finish.style.display = "flex";
   Document_Element_Animate(finish, "flash 1.5s 1.5");
  }
  
 }
 
 else
 
 // IF NOT IN STUDENT MODE, JUST GO FORWARD
 {
  Test_Sheet_Next(test, true);
  Activity_Test_UpdateControls();
 }

}



async function Activity_Test_ControlFinish()
{
 await Activity_Test_Finish();
}
