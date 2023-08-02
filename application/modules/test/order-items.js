// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                   O R D E R    I T E M S                                       //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Test_OrderItems_Display(sheet, display)
{
 // PREPARE
 var elements = [];
 
 
 // QUESTION
 var question = Safe_Get(sheet, ["question"], {});
 var element  = Test_Element_Question("standard", question, {source:sheet["source"]}, sheet);
 elements.push(element);
 
 
 // CONTENT
 var content = Test_Element_Container("blocks");
 Document_Element_SetData(content, "uid", "test-main-content");
 elements.push(content);



 
 // CREATE ITEMS
 var items  = Object_Subset(sheet, "item");
 var index  = 0;
 
 for(var id in items)
 {
  var item    = items[id];
  var element = Test_Element_Item("minimal", item, {mode:"single media", source:sheet["source"]}, sheet);
  
  content.appendChild(element);
  
  if(Test_Mode() != "edit") item["index"] = index;
  index = index + 1;
 }
 
 if(Test_Mode() != "edit") sheet["items"] = items;
 
 
 // SHUFFLE
 Document_Element_ShuffleChildren(content);
 
 
 // SET UP DRAGSWAPPING OF ITEMS
 Document_Handler_DragSwap(Document_Element_Children(content), "style-blurred-light", Test_OrderItems_Drag);
  
 
 return elements;
}








async function Test_OrderItems_Drag(event)
{ 
 var dragged = event["dragged"];
 var dropped = event["dropped"];
 
 if(event["success"])
 {
  Document_Element_Animate(dragged, "rubberBand 0.5s linear 1");
  Document_Element_Animate(dropped, "rubberBand 0.5s linear 1");
  
  Media_Audio_Play(Resources_URL("sounds/drop.mp3"));
  
  if(Test_Mode() == "practice")
  {
   Safe_Add(sheet, ["attempts"], +1); 
   
   var item = Document_Element_GetObject(dragged, "item"); 
   switch(Test_OrderItems_Evaluate(item))
   {
	case "right":
	   await Test_Feedback_Right(item["element"], {permanent:true});
	   
	   Document_Element_Disable(item["element"]);
	   Document_Element_SetData(item["element"], "evaluated", true);
	break;
	
	default:
       await Test_Feedback_Wrong(item["element"]);
   
       Document_Elements_Swap(dragged, dropped);
   
       var sheet = Document_Element_GetObject(dragged, "sheet");
       Safe_Add(sheet, ["mistakes"], +1); 
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





function Test_OrderItems_Evaluate(item)
{
 var true_index    = item["index"];
 var current_index = Document_Element_Index(item["element"]);
 
 if(true_index == current_index) return "right"; else return "wrong";
}




async function Test_OrderItems_Feedback(sheet)
{
 var items = sheet["items"];
 var max   = Object.keys(items).length;


 // DISABLE ELEMENTS INTERACTION
 for(var id in items)
 {
  var item = items[id];
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
  
  for(var id in items)
  {   
   var item = items[id];
   
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