// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     A C T I V I T I E S                                        //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Activity_Function(type, action)
{
 var f = window["Activity_" + String_Capitalize_Initial(type) + "_" + String_Capitalize_Initial(action)];
 
 return f || async function(){};	 
}




async function Activity_Run(source, config = {mode:"test", escape:true})
{
 console.log("ACTIVITY RUN");
 console.log(source);
 console.log(config);
 console.log("");

 // IF ESCAPING IS ALLOWED AND MODE = TEST, MUST CONFIRM ESCAPING
 if(config["escape"] && config["mode"] == "test")
 {
  config["escape"] =
  async function(popup)
  {
   // FASTEXIT: JUST EXIT
   if(config["fastexit"])
   {
	return true;
   }
   else
   // CONFIRM EXIT
   {
    // POPUP
    var title    = UI_Language_String("activities", "escape popup title"); 
    var content  = UI_Language_String("activities", "escape popup text"); 
    var picture  = Resources_URL("images/cover-logout.png");

    var confirm  = await UI_Popup_Confirm(title, content, picture);
    return confirm;
   }
  }
 }
 
 
 // DETERMINE TYPE FROM SOURCE
 var type = String_Filter_AllowAlpha(Path_Filename(source.toLowerCase())); 

 Core_State_Set("activity", ["result"], false);
 Core_State_Set("activity", ["type"],   type);
 Core_State_Set("activity", ["source"], source);
 Core_State_Set("activity", ["config"], config);
 
 // DETERMINE NAMESPACE
 var namespace = "Activity_" + String_Capitalize_Initial(type);
 
 
 // SET UP CONTAINER
 var container = UI_Element_Create("activities/" + type + "-container");
 Core_State_Set("activity", ["container"], container);
 
 for(var control of ["prev", "feedback", "next", "finish"])
 {
  var element = UI_Element_Find(container,  "activity-" + control);
  var func    = window[namespace + "_Control" + String_Capitalize_Initial(control)];
  if(element && func) element.onclick = func;
 }
 


 // CREATE RUN PROMISE
 var promise = new Promise(async(resolve, reject) =>
 {  
  // DISPLAY
  var template = config["popup"] || "standard";
  var popup    = await UI_Popup_Create({content:container}, undefined, "activities/display-popup-" + template, 
  {
   open:   true, 
   escape: config["escape"], 
  
   onescape:
   function()
   {
    // ESCAPING THE ACTIVITY NULLS THE RESULT
    Core_State_Set("activity", ["result"], false);	   
   },
  
   onclose:
   function()
   {
    var result = Core_State_Get("activity", ["result"]);
   
    resolve(result);
   }		  
  });
	
  Core_State_Set("activity", ["popup"], popup);
  var display = UI_Element_Find(popup, "popup-window");
   
 
   
  // RUN
  var run = Safe_Function(namespace + "_Run"); console.log(namespace + "_Run");
  await run(source, display, config);
 
  
 
  // TERMINATE
 });
 
 Core_State_Set("activity", ["result"], false);
 
 return promise;
}




async function Activity_Result_Store(result)
{
 var config   = Core_State_Get("activity", ["config"]);
 var type     = Core_State_Get("activity", ["type"]);
 var source   = Core_State_Get("activity", ["source"]);
 
 var duration = 0;
 
 // STORE ACTIVITY RESULT
 await Core_Api("Activity_Result_Store", 
 {
  student_id: User_Id(), 
  source:     source.replace("content/lessons/", ""), 
  mode:       config["mode"],
  score:      result["score"], 
  data:       result["data"], 
  duration:   duration
 });
}


async function Activity_Result_Popup(result)
{
 if(!result) return;
 console.log(result);
 
 var config   = Core_State_Get("activity", ["config"]);
 var type     = Core_State_Get("activity", ["type"]);
 var source   = Core_State_Get("activity", ["source"]);
 
 var duration = 0;
 
 // STORE ACTIVITY RESULT
 await Activity_Result_Store(result);
 
 
 // DISPLAY END OF ACTIVITY POPUP BASED ON RESULT 
 var score           = result["score"];
 if(score < 0) score = 0;
 
 for(var level of ["good", "soso", "bad"])
 {
  if(score >= Module_Config("test", "score-" + level))
  {  
   var subtitle = UI_Language_String("activities/results", "popup result title");
   var title    = UI_Language_String("activities/results", level + " title");
   var content  = UI_Language_String("activities/results", level + " text");
   
   var animation = Core_Data_Value("activities/results", "popup result animation", level);
   var picture   = Resources_URL("images/activity-" + level + ".png");
	   
   await UI_Popup_Create({title, subtitle, content, picture}, undefined, undefined, {escape:true, open:true, animation:animation});
   
   break;
  }
 }
 
}


