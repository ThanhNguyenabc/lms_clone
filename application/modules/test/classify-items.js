// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                              C L A S S I F Y    I T E M S                                      //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Test_ClassifyItems_Display(sheet, display)
{
 // PREPARE
 var elements = [];
 
 // QUESTION
 var question = Safe_Get(sheet, ["question"], {});
 var element  = Test_Element_Question("standard", question, {source:sheet["source"]}, sheet);
 elements.push(element);
 
 
 // CONTAINERS FOR DRAG AND DROP AND LIST OF ALL ITEMS
 var containers = [];
 var allitems   = [];
 
 
 // CONTENT
 var content = Test_Element_Container("twocolumns");
 var left    = UI_Element_Find(content, "left");
 var right   = UI_Element_Find(content, "right");
 elements.push(content);
 
 containers.push(right);
 
 
 
 // ORGANIZE ITEMS BY CATEGORY
 var items      = Object_Subset(sheet, "item");
 var categories = {};
 for(var id in items)
 {
  var item = items[id];
  Safe_Push(categories, item["category"], item);
 }


 
 // CREATE CATEGORY BOXES
 for(var category in categories)
 {
  var box = Test_Element_Create("category-box", {category}, sheet);
  Document_Element_SetData(box, "category", category);
  
  // ADD THIS CATEGORY BOX'S ITEMS SUBDIV TO THE LIST OF DRAG AND DROP CONTAINERS
  containers.push(UI_Element_Find(box, "category-items"));
  
  // ADD CATEGORY BOX TO THE TEST
  left.appendChild(box);
  
  
  // NOW ADD THIS CATEGORY'S ITEMS TO THE CONTENT PILE
  var items = categories[category];
  for(var item of items)
  {
   var element = Test_Element_Item("small", item, {mode:"single media", source:sheet["source"]});
   Document_Element_SetObject(element, item);
   
   // ADD ITEM TO THE CONTENT CONTAINER
   right.appendChild(element);
   
   allitems.push(item);
  }
  
 }
 
 // SHUFFLE ITEMS
 console.log(right);
 Document_Element_ShuffleChildren(right);
 
 Document_Handler_DragSwapParent(containers, "style-highlight-accented", Test_ClassifyItems_Drag);
 
 if(Test_Mode() != "edit")
 {   
  sheet["items"] = allitems; 
 }
 
 
 return elements;
}




async function Test_ClassifyItems_Drag(event)
{   
 var element   = event["dragged"];
 var from      = event["from"];
 
 // DRAG ACTION SUCCEEDED
 if(event["success"])
 {
  var sheet        = Core_State_Get("test", ["current-sheet"]);
  
  var container    = Document_Element_FindParent(event["container"], "category");
  if(!container) return;
  
  var category     = Document_Element_GetData(container, "category");
  var item         = Document_Element_GetObject(element, "item");
  
  item["put-into"] = category;
  
  // PRACTICE MODE: BOUNCE BACK ELEMENT IF WRONG
  if(Test_Mode() == "practice")
  {
   Safe_Add(sheet, ["attempts"], +1); 
  
   switch(Test_ClassifyItems_Evaluate(item))
   {
	case "wrong":
		await Test_Feedback_Wrong(item["element"]);
	
		// RESTORE TO PREVIOUS CONTAINER
		item["element"].remove();
		from.appendChild(item["element"]);
	
		Safe_Add(sheet, ["mistakes"], +1); 
	break;
	
	default:
	    if(Test_ClassifyItems_Evaluate(item) == "right")
		{
	 	 await Test_Feedback_Right(item["element"], {permanent:true});
		
		 Document_Element_Disable(item["element"]);
		}	
	break;
   }
   
   return;
  }
  
  Document_Element_Animate(element, "rubberBand 0.5s linear 1");

  Media_Audio_Play(Resources_URL("sounds/drop.mp3"));
 }
 else
 {
  Document_Element_Animate(element, "shakeY 0.5s linear 1"); 
   
  Media_Audio_Play(Resources_URL("sounds/swosh.mp3"));
 }
}





function Test_ClassifyItems_Evaluate(item)
{
 if(item["category"] == item["put-into"]) return "right"; else return "wrong";
}




async function Test_ClassifyItems_Feedback(sheet)
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
  
  for(var item of sheet["items"])
  {
   switch(Test_ClassifyItems_Evaluate(item))
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
  
  score = score / max;
 }
 
 return score;
}