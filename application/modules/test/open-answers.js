// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                  O P E N   Q U E S T I O N S                                   //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Test_OpenAnswers_Display(sheet, display)
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
  var item    = items[id];
  var element = Test_Element_Item("opentext", item, {mode:"single media", source:sheet["source"]}, sheet);
  
  if(Test_Mode() != "edit") item["element"] = element;
  
  var input         = UI_Element_Find(element, "input");
  input.onchange    = Test_OpenAnswers_Input;
  input.placeholder = UI_Language_String("test", "item placeholder type");
  Document_Element_SetObject(input, "item", item);
  Document_Element_SetObject(input, "container", element);
  
  if(Test_Mode() != "edit") item["input"] = input;
  
  
  // ADD ITEM TO CONTENT CONTAINER
  content.appendChild(element);
 }
 
 return elements;
}




async function Test_OpenAnswers_Input(event)
{ 
 var input     = event.currentTarget;
 var item      = Document_Element_GetObject(input, "item");
 var sheet     = Document_Element_GetObject(input, "sheet");

 
 // IF TEST MODE IS "PRACTICE" WE NEED TO GIVE IMMEDIATE FEEDBACK
 if(Test_Mode() == "practice")
 {  
  Safe_Add(sheet, ["attempts"], +1); 
  
  switch(Test_OpenAnswers_Evaluate(item))
  {
   case "right":
		await Test_Feedback_Right(item["element"], {permanent:true});
		
		Document_Element_Disable(item["element"]);
   break;
   
   default:
		Safe_Add(sheet, ["mistakes"], +1); 
		
		await Test_Feedback_Wrong(item["element"]);
   
		input.value = "";
	break;
  }
 }
 

}




function Test_OpenAnswers_Evaluate(item)
{
 var input = item["input"].value;
 input     = input.trim().toLowerCase();
  
 // TEST INPUT AGAINST ALL POSSIBLE ANSWERS
 var compare = [];
 var answers = Safe_Get(item, ["answers"], "").split("/");
 for(var answer of answers) 
 {
  var text = answer.trim().toLowerCase();
    
  var similarity = 1 - String_Analysis_Distance(text, input, {alphanum:true});  
  console.log(text, input, similarity);
   
  compare.push({answer, similarity}); 
 }
   
 // SORT BY BETTER SIMILARITY AND PICK FIRST AS BEST MATCH
 Array_Items_Sort(compare, "similarity");
 compare.reverse();
 var best = compare[0];
    
 if(best["similarity"] >= Module_Config("test", "score-perfect")) 
 { 
  return "right";
 }	   
 else
 {
  return "wrong";
 }
 
}




async function Test_OpenAnswers_Feedback(sheet)
{  
 // ITEMS
 var items = Object_Subset(sheet, "answer");
 var max  = Object.keys(items).length;

 
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
   var item  = items[id];
  
   switch(Test_OpenAnswers_Evaluate(item))
   {
	case "right":
		score = score + 1;
		
		await Test_Feedback_Right(item["element"], {permanent:true}); 
		
		item["input"].value = UI_Language_String("test", "item answers yours") + ' "' + item["input"].value + '"\r\n' + UI_Language_String("test", "item answers valid") + " " + item["answers"];
	break;
	
	case "wrong":
		await Test_Feedback_Wrong(item["element"], {permanent:true});
		
		item["input"].value = UI_Language_String("test", "item answers yours") + ' "' + item["input"].value + '"\r\n' + UI_Language_String("test", "item answers valid") + " " + item["answers"];
		//item["input"].value = UI_Language_String("test", "item answers valid") + " " + item["answers"];


		// MAKE SURE EVERYTHING CAN BE READ
		item["input"].parentElement.style.height = "";
		Document_Element_FitText(item["input"], {mode:"vertical"});
	break;
   }
  }
  
  if(score < 0) score = 0;
  score = score / max;
 }
 
 
 
 return score;
}