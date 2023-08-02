// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                I D E N T I F Y    I T E M S                                    //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Test_IdentifyItems_Display(sheet, display)
{ 
 // PREPARE
 var elements = [];
 
 
 // QUESTION
 var question = Safe_Get(sheet, ["question"], {});
 var element  = Test_Element_Question("standard", question, {picture:false, source:sheet["source"]}, sheet);
 elements.push(element);
 
 
 
 // BIG PICTURE
 var bigpicture = Test_Element_Container("bigpicture");
 Document_Element_SetData(bigpicture, "uid", "test-main-content");
 elements.push(bigpicture);

 var source    = sheet["source"] + "/" + Safe_Get(sheet, ["question", "picture"], "");
 
 var picture   = UI_Element_Find(bigpicture, "picture");
 Document_Image_Load(picture, [source]);
 
 // PREVENT PICTURE FROM BEING DRAGGED AROUND
 picture.ondragstart =
 function(event)
 {
  return false;
 }
 
 
 // ITEM SELECTION
 picture.onclick = Test_IdentifyItems_Select;
 
 
 // CREATE ITEMS CLICKAREAS
 var items     = Object_Subset(sheet, "item");
 var z         = 1000;
 for(var id in items)
 {
  var item                 = items[id];
  
  var element              = Test_Element_Create("area-square");
  element.style.left       = item["left"];
  element.style.top        = item["top"];
  element.style.width      = item["width"];
  element.style.height     = item["height"];
  element.style.zIndex     = z;
  
  element.onclick          = Test_IdentifyItems_Select;
  element.innerHTML        = item["name"].toUpperCase();
  Document_Element_SetData(element, "type", "item-square");
  
  bigpicture.appendChild(element);
  
  z++;
  
  // IF IN EDIT MODE, MAKE THE ELEMENT VISIBLE
  if(Test_Mode() == "edit") element.style.visibility = "visible";
 }
 
  
 return elements;
}





async function Test_IdentifyItems_Select(event)
{  
 // CAN ADD ONE MORE SELECTION?
 var sheet      = Core_State_Get("test", ["current-sheet"]); 
 var items      = Object_Subset(sheet, "item");
 var content    = UI_Element_Find("test-main-content"); 
 var selections = Document_Element_FindChildren(content, "type", "user-cross");
 if(selections.length >= Object.keys(items).length) return; 
 
 
 var container = UI_Element_Find("test-main-content");
 var coords    = Document_Event_RelativeCoords(event);
 
 var element              = UI_Element_Create("test/element-area-cross");
 element.style.visibility = "hidden";
 container.appendChild(element);
 var rect                 = element.getBoundingClientRect();


 element.style.left       = coords["x"] - (parseInt(rect.width) / 2);
 element.style.top        = coords["y"] - (parseInt(rect.height) / 2);
 element.style.zIndex     = 1000;
 Document_Element_SetData(element, "type", "user-cross");
 
 element.style.visibility = "visible";
 Media_Audio_Play(Resources_URL("sounds/drop.mp3"));   
 Document_Element_Animate(element, "rubberBand 0.5s linear 1");
 
 element.onclick = Test_IdentifyItems_Remove;
 
 
 // IN PRACTICE MODE, GIVE IMMEDIATE FEEDBACK
 if(Test_Mode() == "practice")
 { 
  Safe_Add(sheet, ["attempts"], +1); 
  
  switch(Test_IdentifyItems_Evaluate(element, "item-square", true)) 
  {
   case "right":
	   element.style.color = "var(--color-good)";	
	   await Test_Feedback_Right(element, {permanent:true, nostyle:true});
	   
	   Document_Element_Disable(element);
   break;
  
   case "wrong":
      element.style.color = "var(--color-bad)";
      await Test_Feedback_Wrong(element, {nostyle:true});
  
      element.remove();
  
      var sheet = Core_State_Get("test", ["current-sheet"]); 
      Safe_Add(sheet, ["mistakes"], +1);
   break;
  }
 }
 
}





async function Test_IdentifyItems_Remove(event)
{
 var element = event.currentTarget;
 
 Media_Audio_Play(Resources_URL("sounds/swosh.mp3"));
 await Document_Element_Animate(element, "fadeOutUp 0.5s linear 1");
 
 element.remove();
}





function Test_IdentifyItems_Evaluate(element, mode, remove)
{
 var result = "wrong";
 var list   = Document_Element_ListColliding(element);
 
 for(var collider of list)
 {  
  var type = Document_Element_GetData(collider, "type"); 
  if(type == mode) 
  {
   if(remove) collider.remove();
   result = "right";
  }
 }
	
 return result;
}





async function Test_IdentifyItems_Feedback(sheet)
{
 var items = Object_Subset(sheet, "item");
 var max   = Object.keys(items).length;


 // DISABLE ELEMENTS INTERACTION
 var content = UI_Element_Find("test-main-content");
 Document_Element_Disable(content);
 
 
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
  
  // CHECK AREAS: CORRECTLY MARKED, OR NOT?
  var elements = Document_Element_FindChildren(content, "type", "item-square");
  for(var element of elements)
  {   
   switch(Test_IdentifyItems_Evaluate(element, "user-cross"))
   {
    case "right":
 	 element.style.innerHTML       = ""; 
	 element.style.visibility      = "visible";
	 element.style.backgroundColor = "var(--color-right)";
	
	 await Test_Feedback_Right(element, {nostyle:true, permanent:true});
	
	 score = score + 1;
    break;
	
	case "wrong":
 	 element.style.innerHTML       = ""; 
	 element.style.visibility      = "visible";
	 element.style.backgroundColor = "var(--color-bad)";
	
	 await Test_Feedback_Wrong(element, {nostyle:true, permanent:true});
	
	 score = score - 1;
    break;
   }
  }
  
  
  if(score < 0) score = 0;
  score = score / max;
 }
 
 
 return score;
}



/*
 // CHECK CROSSES
 var elements = Document_Element_FindChildren(content, "type", "user-cross");
  for(var element of elements)
  {
   switch(Test_IdentifyItems_Evaluate(element, "item-square"))
   {
	case "right":
	    element.style.color = "var(--color-good)";
		
		await Test_Feedback_Right(element, {nostyle:true, permanent:true});
		
		score = score + 1;
	break;
	
	case "wrong":
		element.style.color = "var(--color-bad)";
		
		await Test_Feedback_Wrong(element, {nostyle:true, permanent:true});
		
		score = score - 0.5;
	break;
   }
  }
*/