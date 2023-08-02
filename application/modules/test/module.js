// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          T E S T                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Test_OnLoad(module, data)
{
 UI_Element_Find(module, "button-confirm").onclick = Test_Confirm;
 UI_Element_Find(module, "button-next").onclick    = Test_Next;
 UI_Element_Find(module, "button-finish").onclick  = Test_Finish;
  
 var source = Module_Parameter_Get("test");
 var test   = await Test_Load(source);
 if(!test) return;
 
 Core_State_Set("test", ["test"], test);
 Test_State("wait-answer");
 
 var mode   = Module_Parameter_Get("mode") || "test";
 Test_Mode(mode);
 
 var display = UI_Element_Find(module, "test-display");
 Test_Assign(test, display);
 
 Test_Display(test);
 Test_Update(module);


 // INIT TEST STORE (CAPTURE AT LEAST DATE AND TEST ID) 
 var store = Module_Parameter_Get("store");
 Core_State_Set("test", ["store"], store);

 Test_Store();
}




async function Test_OnShow(module, data)
{	

}




async function Test_OnUnload()
{
}




async function Test_Store()
{
 var test  = Core_State_Get("test", ["test"]);
 var store = Core_State_Get("test", ["store"]);

 if(!store) return;

 await Core_Api("Test_Results_Store", {id:store, test_id:test["source"], score:0, data:{}});
}




function Test_State(state)
{
 if(state == undefined) return Core_State_Get("test", ["state"]);
 
 Core_State_Set("test", ["state"], state);
}




async function Test_Update(display)
{
 if(!display) var display = document.body;
 
 var test           = Core_State_Get("test", ["test"], {});
 var index          = parseInt(test["index"]) + 1;
 var total          = test["sheets"].length;
 UI_Element_Find(display, "test-progress").innerHTML = index + " / " + total;
 
 
 var buttons = {};
 for(var button of ["confirm", "next", "finish"])
 {
  buttons[button] = UI_Element_Find(display, "button-" + button);
 }
 
 var state = Test_State();
 switch(state)
 {
  case "wait-answer":
    buttons["confirm"].style.display = "flex";
	buttons["next"].style.display    = "none";
	buttons["finish"].style.display  = "none";
  break;
  
  case "wait-continue":
    buttons["confirm"].style.display = "none";
	buttons["next"].style.display    = "flex";
	buttons["finish"].style.display  = "none";
  break;
  
  case "wait-end":
    buttons["confirm"].style.display = "none";
	buttons["next"].style.display    = "none";
	buttons["finish"].style.display  = "flex";
  break;
  
  default:
	for(var button in buttons) buttons[button].style.display = "none";
  break;
 }
}



async function Test_Confirm()
{
 // HIDE BUTTONS
 UI_Element_Find("test-buttons").style.visibility = "hidden";
 
 var test = Core_State_Get("test", ["test"], {});
 
 Test_State("none");
 Test_Update();
 
 var sheet       = Test_Sheet_Current(test);
 sheet["result"] = await Test_Feedback_CurrentSheet(); 
 
 await Client_Wait(2);
 
 if(Test_Sheet_Last(test))
 {
  Test_State("wait-end");
 }
 else
 {
  Test_State("wait-continue");
 }
 
 Test_Update();
 
 // SHOW BUTTONS
 UI_Element_Find("test-buttons").style.visibility = "visible";
}



async function Test_Next()
{
 // HIDE BUTTONS
 UI_Element_Find("test-buttons").style.visibility = "hidden";
 
 
 var test                 = Core_State_Get("test", ["test"], {});
 
 var display              = UI_Element_Find("test-display");
 
 await Document_Element_Animate(display, "bounceOut 0.75s ease-in-out");
 Test_Sheet_Next(test, true);
 await Document_Element_Animate(display, "bounceIn 0.75s ease-in-out");
 
 await Client_Wait(1);
 
 Test_State("wait-answer"); 
 Test_Update();
 
 
 // SHOW BUTTONS
 UI_Element_Find("test-buttons").style.visibility = "visible";
}



function Test_Finish()
{
 var test = Core_State_Get("test", ["test"], {});
 
 Test_State("none");
 Test_Update();
 
 var display       = UI_Element_Find("test-display");
 display.innerHTML = "";
 
 Test_Store();
}
