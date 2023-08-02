// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                               M U L T I P L E    C H O I C E                                   //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Test_MultipleChoice_Display(sheet, display)
{
 // PREPARE
 var elements = [];
 
 
 // QUESTION
 var question = Safe_Get(sheet, ["question"], {});
 var element  = Test_Element_Question("standard", question, {source:sheet["source"]}, sheet);
 elements.push(element);
 
 
 // CONTENT
 var content = Test_Element_Container("standard");
 elements.push(content);


 // ANSWERS
 var items = Object_Subset(sheet, "answer"); 
 for(var id in items)
 {
  var item        = items[id];
  var element     = Test_Element_Item("standard", item, {source:sheet["source"]}, sheet);
  element.onclick = Test_MultipleChoice_Select;
  
  if(Test_Mode() != "edit") item["element"] = element;
  
  // ADD ITEM TO CONTENT
  content.appendChild(element);
 }

 Document_Element_ShuffleChildren(content);
 

 return elements;
}







async function Test_MultipleChoice_Select(event)
{
 Media_Audio_Play(Resources_URL("sounds/click.mp3"));
 
 // ACQUIRE DATA FROM CLICKED ELEMENT
 var element = event.currentTarget;
 var item    = Document_Element_GetObject(element, "item");
 var sheet   = Document_Element_GetObject(element, "sheet");
 var items   = Object_Subset(sheet, "answer");
 

 
 // SELECT/UNSELECT 
 Safe_Switch(item, ["selected"]);
 
 
 // IF WE JUST SELECTED AN ITEM, AND WE ARE IN PRACTICE MODE, LET'S SEE IF WE NEED TO REJECT THE SELECTION
 if(item["selected"] && Test_Mode() == "practice")
 {
  Safe_Add(sheet, ["attempts"], +1); 
  
  switch(Test_MultipleChoice_Evaluate(item))
  {
   case "right":
	  item["selected"] = true;
	  await Test_Feedback_Right(item["element"], {permanent:true});
	  
	  Document_Element_Disable(item["element"]);
   break;
   
   default:
   
	  item["selected"] = false;
      await Test_Feedback_Wrong(item["element"]);
   
      Safe_Add(sheet, ["mistakes"], +1);
	  
	  return;
   break; 	  
  }
  
  return;
 }
 
 
 // MANAGE MULTI SELECT
 var multi = (Safe_Get(sheet, ["info", "multiple"], "no") == "yes");

 //IF MULTIPLE SELECTION NOT ALLOWED, UNSELECT ALL ITEMS EXCEPT THE CLICKED ONE
 if(!multi)
 {
  for(var id in items) 
  if(items[id] != item) 
  {
   items[id]["selected"] = false;
  }   
 }
 
 
 
 // UPDATE TEST VISUALS
 for(var id in items) 
 {
  var item = items[id];
  
  if(item["selected"]) 
  {
   Document_CSS_SetClass(item["element"], "style-outlined-accented");
  }
  else
  {
   Document_CSS_UnsetClass(item["element"], "style-outlined-accented");
  }
 }
 
}





function Test_MultipleChoice_Evaluate(item)
{
 var correct  = (item["correct"] == "yes");
 var selected = (item["selected"]);
 
 // CORRECT AND SELECTED. GOOD
 if(correct && selected)
 {
  return "right";
 }
 else
 // CORRECT BUT NOT SELECTED. BAD
 if(correct && !selected)
 {
  return "wrong";
 }
 // INCORRECT AND SELECTED. BAD
 if(!correct && selected)
 {
  return "wrong";
 }
 else
 // INCORRECT BUT NOT SELECTED. NEUTRAL
 if(!correct && !selected)
 {
  return "";
 }
}






async function Test_MultipleChoice_Feedback(sheet, silent)
{   
 // CORRECT ITEMS
 var max = 0;
 var items = Object_Subset(sheet, "answer");
 
 for(var id in items)
 {
  var item = items[id];
  
  if(item["correct"] == "yes") max = max + 1;
 }
 
 
 
 // DISABLE ELEMENTS
 for(var id in items)
 {
  var item = items[id];
  Document_Element_Disable(item["element"]);
 }
 
 
 
 // IN PRACTICE MODE, JUST CHECK THE SHEET'S NUMBER OF MISTAKES MADE
 if(Test_Mode() == "practice")
 {
  var mistakes = Safe_Get(sheet, ["mistakes"], 0);
  var attempts = Safe_Get(sheet, ["attempts"], 0);
  var score    = (1 - (mistakes / attempts)) || 0;
 }
 
 
 
 // IN TEST MODE, SCAN ITEMS AND FOR EACH ONE CHECK IF CORRECTLY SELECTED AS EXPECTED, OR NOT
 if(Test_Mode() == "test")
 {
  // CALCULATE SCORE
  var score = 0;
  
  for(var id in items)
  {
   var item = items[id];
   
   switch(Test_MultipleChoice_Evaluate(item))
   {
    case "right":
	 score = score + 1;
	
	 await Test_Feedback_Right(item["element"], {permanent:true});
	break;
   
    case "wrong":
	
 	 await Test_Feedback_Wrong(item["element"], {permanent:true});  
	 
	 score = score - 0.5;
	 
    break;
   }
   
  }
  
 
  if(score < 0) score = 0;
  score = score / max;
 }
 
 
 
 // RETURN SCORE
 return score;
}