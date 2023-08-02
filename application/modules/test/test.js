// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          T E S T                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Test_Load(source)
{
 var test = await Core_Api("Test_Read", {source:source});

 // PROCESS SHEETS
 var sheets = Safe_Get(test, ["sheets"], []);
  
 for(var sheet of sheets)
 {   
  sheet["source"] = source;
 }
 
 test["state"] = {};
 test["index"] = 0;
 
 return test;
}




function Test_Mode(mode)
{
 // SETS THE MODE
 if(mode) 
 {
  Core_State_Set("test", ["mode"], mode); 
 }
 // WITH NO PARAMETERS, RETURNS THE MODE
 else
 {
  return Core_State_Get("test", ["mode"]); 
 }
}





// RETURNS A FUNCTION BASED ON THE TEST SHEET'S TYPE, APPROPRIATELY CAMEL-CASED AND USED AS A NAMESPACE TO IDENTIFY TEST-TYPE-SPECIFIC FUNCTION SETS
function Test_Function(sheet, funcname)
{
 var type      = Safe_Get(sheet, ["info", "type"], "");
 var namespace = String_Capitalize_Camel(type, "-", "");
 var func      = window["Test_" + namespace + "_" + String_Capitalize_Initial(funcname)];
 
 return func || function(){};
}




function Test_Evaluate(sheet, silent)
{
 Core_State_Set("test", ["stage"], "evaluate");
 
 var score = Test_Function(sheet, "evaluate")(sheet, silent);
 Test_SetState(sheet["id"], "evaluation", "score", score);
 
 UI_Element_Find("test-evaluate").style.visibility = "hidden";
}



function Test_Assign(test, display)
{
 test["display"] = display;
}



function Test_Display(test)
{
 Core_State_Set("test", ["current-test"], test);
 
 if(!test["display"]) return;
 
 var index = test["index"] || 0;
 var sheet = Safe_Get(test, ["sheets", index], false);
 
 if(sheet)
 { 
  Test_Sheet_Display(sheet, test["display"]);
 }
}




function Test_Result(test)
{
 var score = 0;
 var data  = [];
 
 for(var sheet of test["sheets"])
 {
  score = score + sheet["result"];
  data.push(
  {
   question: sheet["id"],
   score:    sheet["result"] || 0
  });
 }
 
 score = (score / data.length) || 0;
 
 var result = {score, data};
 return result;
}	



function Test_Disable()
{
 var display = Core_State_Get("test", ["current-test", "display"]);
 if(!display) return;
 
 display.style.pointerEvents = "none";
}



function Test_Enable()
{
 var display = Core_State_Get("test", ["current-test", "display"]);
 if(!display) return;
 
 display.style.pointerEvents = "";
}




// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       S H E E T S                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



function Test_Sheet_Display(sheet, display)
{ 
 Core_State_Set("test", ["stage"], "display");
 Core_State_Set("test", ["current-sheet"], sheet);
 
 // SANITIZE SHEET 
 var type       = Safe_Get(sheet, ["info", "type"]);
 var config     = Core_Data_Page("test/" + type);
 var sources    = Core_State_Get("editor", ["test", "sources"], {});

 Data_Page_Sanitize(sheet, config, true);
 console.log(sheet);
 
 // CALL SHEET'S DISPLAY FUNCTION
 var elements  = Test_Function(sheet, "display")(sheet, display); 
  
 display.innerHTML = "";
 for(var element of elements) display.appendChild(element);
 
 
 // THIS IS USED MOSTLY TO AVOID AUDIO FEEDBACK FROM REPEATING
 Core_State_Set("test", ["feedback", "last"], "");
  
 // IF SHEET NOT ALREADY EVALUATED, SET UP CONFIRM BUTTON
 /*
 var score = Test_GetState(sheet["id"], "evaluation", "score");
 if(typeof score == "undefined")
 {
  UI_Element_Find("test-evaluate").style.visibility = "visible";
  
  UI_Element_Find("test-evaluate-button").onclick = 
  function()
  {
   var sheet = Core_State_Get("test", ["current-sheet"]);
   Test_Evaluate(sheet, false);
  } 
 }
 else
 // IF SHEET ALREADY EVALUATED, HIDE THE CONFIRMATION BUTTON AND PERFORM A SILENT EVALUATION TO UPDATE IT VISUALLY
 {
  UI_Element_Find("test-evaluate").style.visibility = "hidden";
  Test_Evaluate(sheet, true);
 }
 */
 
 //if(Test_Mode() != "edit") Test_Function(sheet, "update")(sheet); 
}



function Test_Sheet_Current(test)
{
 var sheets = test["sheets"] || [];
 var index  = test["index"]  || 0;
 
 return sheets[index];
}




function Test_Sheet_Last(test)
{
 var sheets = test["sheets"] || [];
 var index  = test["index"]  || 0;
 
 return (index == sheets.length - 1);
}





function Test_Sheet_Next(test, set)
{
 var sheets = test["sheets"] || [];
 var index  = test["index"]  || 0;
 
 index = index + 1;
 if(index >= sheets.length -1) index = sheets.length-1;
 
 test["index"] = index;
 var sheet     = Safe_Get(test, ["sheets", index], false);
 
 if(set) Test_Display(test);
 
 return sheet;
}




function Test_Sheet_Prev(test, set)
{
 var sheets = test["sheets"] || [];
 var index  = test["index"]  || 0;
 
 index = index - 1;
 if(index < 0) index = 0;
 
 test["index"] = index;
 var sheet     = Safe_Get(test, ["sheets", index], false);
 
 if(set) Test_Display(test);
 
 return sheet;
}










// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      E L E M E N T S                                           //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//





function Test_Element_Disable(element)
{
 Document_CSS_UnsetClass(element, "style-pushable");
 Document_CSS_UnsetClass(element, "style-selectable");
 Document_CSS_UnsetClass(element, "style-clickable");
 
 element.onclick = false;
}






function Test_Element_Setup(element, item = {}, options = {}, sheet = {})
{ 
 // MODE
 var mode = Core_State_Get("test", ["mode"]);
 switch(mode)
 {
  case "edit":
	element.style.pointerEvents = "none";
  break;
  
  default:
	item["element"] = element;
  break;
 }
 
 
 // SET RESOURCES PATH
 var source      = options["source"] || "";
 
 
 Document_Element_SetData(element, "source",  source);
 Document_Element_SetObject(element, "item",  item);
 Document_Element_SetObject(element, "sheet", sheet);
 
 
 // LOAD STANDARD COMPONENTS
 var components = {};
 
 
 // TEXT
 var text      = Safe_Get(item, ["text"], false);
 var component = UI_Element_Find(element, "text");
 
 if(text && component)
 {  
  component.innerHTML = text;
  components["text"]  = component; 
 }
 
 
 // PICTURE
 var picture   = Safe_Get(item, ["picture"], false);
 var component = UI_Element_Find(element, "picture");
 
 if(component)
 {
  Document_Image_Load(component, [source + "/" + picture, Resources_URL("images/cover-test.jpg")]);
  if(picture) components["picture"] = component;
 }
 
 
 
 // PDF
 var pdf       = Safe_Get(item, ["pdf"], false);
 var component = UI_Element_Find(element, "pdf");
 
 if(component)
 {
  component.src = source + "/" + pdf + "#toolbar=0&navpanes=0&scrollbar=0"; console.log(component.src);
  if(pdf) components["pdf"] = component;
 }
 
 
 
 // AUDIO
 var audio     = Safe_Get(item, ["audio"], false);
 var component = UI_Element_Find(element, "audio"); 
 if(audio && component)
 {
  component.src       = source + "/" + audio;
  components["audio"] = component;
 }
 else
 {
 }
 
 
 
 
 
 // INSTRUCTIONS
 var component    = UI_Element_Find(element, "instructions");
 var instructions = UI_Language_Object(sheet["instructions"] || sheet["info"] || {});
 
 if(instructions && component)
 {  
  component.innerHTML         = instructions;
  components["instructions"]  = component; 
 }


 // GRIP
 if(options["grip"])
 {
  var grip = UI_Element_Find(element, "grip-" + options["grip"]);
  if(grip) grip.style.display = "flex";
 }


 // NOW CONFIGURE ELEMENT LAYOUT ACCORDING TO MULTIMEDIA COMPONENTS & OPTIONS
 var remove     = [];
 

 // IF OPTIONS DICTATE IT, REMOVE
 for(var component of ["picture", "audio", "text", "pdf"])
 {
  if(options[component] === false) remove.push(component);
 }
 
 
 // IF COMPONENT ABSENT FROM THE HTML TEMPLATE, REMOVE
 for(var component of ["picture", "audio", "text", "pdf"])
 {
  if(!components[component]) remove.push(component);
 }
 
 
 // ONE MEDIA ELEMENT ONLY
 var mode = options["mode"] || "";
 switch(mode)
 {
  case "single media":
	  if(components["picture"])
	  {
	   remove.push("audio", "text", "pdf");
	  }
	  else
	  if(components["audio"])
	  {
	   remove.push("picture", "text", "pdf");
	  }
	  else
	  if(components["text"])
	  {
	   remove.push("picture", "audio", "pdf");
	  }
	  else
	  if(components["pdf"])
	  {
	   remove.push("picture", "audio", "text");
	  }
  break;
 }
 
 
 
 var exclusion = options["exclusion"] || "";
 switch(exclusion)
 {
  case "audio excludes text":
	  if(components["audio"])
	  {
	   UI_Element_Find(element, "text").style.display = "none";
	  }
	  else
	  if(components["text"])
	  {
	   UI_Element_Find(element, "audio").style.display = "none";
	  }
  break;
 }
 
 
 for(var component of remove) 
 {
  var div = UI_Element_Find(element, component);
  if(div) div.style.display = "none";
 }
 
 
 // COLLAPSE COMPOUND COMPONENTS IF ALL SUBCOMPONENTS ARE EMPTY
 for(var compound of ["audiotext"])
 {
  var div = UI_Element_Find(element, compound);
  if(div)
  {
   var collapse = false;
   
   switch(compound)
   {
	case "audiotext":
		var collapse = !components["audio"] && !components["text"];
	break;
   }
   
   if(collapse) div.style.display = "none";
  }
 }

 
 return components;
}





function Test_Element_Container(template)
{
 // CREATE ELEMENT
 var element = UI_Element_Create("test/element-container-" + template); 
 
 return element;
}




function Test_Element_Box(template, sheet, item)
{
 // CREATE ELEMENT
 var element = UI_Element_Create("test/element-box-" + template); 
 
 Document_Element_SetObject(element, "item",  item);
 Document_Element_SetObject(element, "sheet", sheet);
 
 return element;
}





function Test_Element_Item(template, item = {}, options = {}, sheet = {})
{
 // CREATE ELEMENT
 var element = UI_Element_Create("test/element-item-" + template, item); 
 Document_Element_SetObject(element, "item", item);
 
 // SETUP ELEMENT MULTIMEDIA COMPONENTS
 Test_Element_Setup(element, item, options, sheet);

 return element;
}






function Test_Element_Question(template, question = {}, options = {}, sheet = {})
{
 // CREATE ELEMENT
 var element = UI_Element_Create("test/element-question-" + template, question); 
 
 // SETUP ELEMENT MULTIMEDIA COMPONENTS
 Test_Element_Setup(element, question, options, sheet);
 
 return element;
}





function Test_Element_Create(template, item = {}, sheet = {})
{
 // CREATE ELEMENT
 var element = UI_Element_Create("test/element-" + template, item); 
 
 Document_Element_SetObject(element, "item",  item);
 Document_Element_SetObject(element, "sheet", sheet);
 
 return element;
}








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       F E E D B A C K                                          //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//




async function Test_Feedback_CurrentSheet()
{
 Core_State_Set("test", ["stage"], "feedback");
 
 var sheet  = Core_State_Get("test", ["current-sheet"]); 
 var result = await Test_Function(sheet, "feedback")(sheet);
 
 return result;
}





async function Test_Feedback_Wrong(element, options = {})
{ 
 // AVOID REPEATING AUDIO FEEDBACK 
 if(Core_State_Get("test", ["stage"], "") == "feedback" && Core_State_Get("test", ["feedback", "last"], "") == "wrong")
 {
  options["silent"] = true;
 }
 Core_State_Set("test", ["feedback", "last"], "wrong");
 
 var display     = Core_State_Get("test", ["current-test", "display"]);
 options["lock"] = display;
 
 await Handler_Element_Feedback(element, "bad", options);
}




async function Test_Feedback_Right(element, options = {})
{  
 // AVOID REPEATING AUDIO FEEDBACK 
 if(Core_State_Get("test", ["stage"], "") == "feedback" && Core_State_Get("test", ["feedback", "last"], "") == "right")
 {
  options["silent"] = true;
 }
 Core_State_Set("test", ["feedback", "last"], "right");
 
 var display     = Core_State_Get("test", ["current-test", "display"]);
 options["lock"] = display;
 
 await Handler_Element_Feedback(element, "good", options);
}


