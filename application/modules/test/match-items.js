// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                   M A T C H    I T E M S                                       //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Test_MatchItems_Display(sheet, display)
{
 // PREPARE
 var elements   = [];
 var containers = {};
 var allitems   = [];
 
 
 // QUESTION
 var question = Safe_Get(sheet, ["question"], {}); 
 var element  = Test_Element_Question("standard", question, {source:sheet["source"]}, sheet);
 elements.push(element);
 
 
 
 // LEFT SIDE
 containers["left"] = Test_Element_Container("compact");
 elements.push(containers["left"]);
 
 
 // RIGHT SIDE
 containers["right"] = Test_Element_Container("compact");
 elements.push(containers["right"]);
 


 // CREATE ITEMS
 var items = Object_Subset(sheet, "item"); 
 for(var id in items)
 {
  var item    = items[id];
  var column  = item["column"] || "left";
  
  if(column == "left") 
  {
   var grip   = "right"; 
   var style  = false;
  }
  else 
  {
   var grip  = "left";
   var style = false;
   
   allitems.push(item);
  }
  
  var element = Test_Element_Item("magnetic", item, {grip:grip, source:sheet["source"]}, sheet);
  if(style) Document_CSS_SetClass(element, style);
  
  containers[column].appendChild(element);
  
  if(Test_Mode() != "edit")
  {
   item["index"] = Document_Element_Index(item["element"]);
  }
 }
 
 
 // SHUFFLE RIGHT COLUMN
 Document_Element_ShuffleChildren(containers["right"]);
 
 
 // SET UP DRAGSWAPPING OF ITEMS ON THE RIGHT COLUMN
 Document_Handler_DragSwap(Document_Element_Children(containers["right"]), "style-blurred-light", Test_MatchItems_Drag);
 

 if(Test_Mode() != "edit")
 {
  sheet["items"] = allitems;
 }	 
 
 return elements;
}






async function Test_MatchItems_Drag(event)
{  
 if(event["success"])
 {
  var sheet  = Core_State_Get("test", ["current-sheet"]);
   
  var dragged = event["dragged"];
  var dropped = event["dropped"];
  
  
  Document_Element_Animate(dragged, "rubberBand 0.5s linear 1");
  Document_Element_Animate(dropped, "rubberBand 0.5s linear 1");
  
  Media_Audio_Play(Resources_URL("sounds/drop.mp3"));
  
  // IF PRACTICE MODE, CHECK IF CORRECT
  if(Test_Mode() == "practice")
  {
   Safe_Add(sheet, ["attempts"], +1); 
   
   var item = Document_Element_GetObject(dragged, "item");
   
   switch(Test_MatchItems_Evaluate(item))
   {
	case "right":
		 await Test_Feedback_Right(item["element"], {permanent:true});
		
		 Document_Element_Disable(item["element"]);
		 Document_Element_SetData(item["element"], "evaluated", true);
	break;
  
    case "wrong":
    
       await Test_Feedback_Wrong(dragged);
       Document_Elements_Swap(dragged, dropped);
   
       var sheet = Document_Element_GetObject(dragged, "sheet");
       Safe_Add(sheet, ["mistakes"], +1); 
	   
	   return;
    break;
   }
  }
  
 }
 else
 {
  Document_Element_Animate(dragged, "shakeY 0.5s linear 1"); 
   
  Media_Audio_Play(Resources_URL("sounds/swosh.mp3"));
 }
}







function Test_MatchItems_Evaluate(item)
{
 var element       = item["element"];
 var true_index    = item["index"];
 var current_index = Document_Element_Index(item["element"]); 
 
 if(true_index == current_index) return "right"; else return "wrong";
}







async function Test_MatchItems_Feedback(sheet)
{
 var items = sheet["items"];
 var max   = items.length;


 // DISABLE ELEMENTS INTERACTION
 for(var item of items)
 {
  item["element"].draggable = false;
 }
 
 
 // IN PRACTICE MODE, JUST CHECK THE SHEET'S NUMBER OF MISTAKES MADE
 if(Test_Mode() == "practice")
 {
  var mistakes = Safe_Get(sheet, ["mistakes"], 0);
  var attempts = Safe_Get(sheet, ["attempts"], 0);
  var score    = (1 - (mistakes / attempts)) || 0;
 }
 

 
 if(Test_Mode() == "test")
 {
  var score = 0;
  
  for(var item of items)
  {  
   switch(Test_MatchItems_Evaluate(item))
   {
    case "right":
	    await Test_Feedback_Right(item["element"], {permanent:true});
		
		score = score + 1;
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
 
 
 return score;
}