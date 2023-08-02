// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                H I G H L I G H T    T E X T                                    //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Test_HighlightText_Display(sheet, display)
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
 
 
 
 // TEXT WITH HIGHLIGHTS
 var paragraphs = Object_Subset(sheet, "paragraph");
 var alltokens  = [];
 
 for(var id in paragraphs)
 {
  var paragraph = paragraphs[id]
  var string    = paragraph["text"]; 
  var blocks    = String_Extract_TagBlocks(string);
  
  // CREATE PARAGRAPH BOX
  var box = Test_Element_Box("blocks");
  Document_Element_SetObject(box, "paragraph", paragraph);
  if(Test_Mode() != "edit") paragraph["box"] = box;
  
  for(var block of blocks)
  {   
   var tokens = block["content"].split(" ");
   
   for(var text of tokens)
   if(text != "")
   {
	var element     = Test_Element_Create("block-text", {text}, sheet);
	element.onclick = Test_HighlightText_Highlight;
	    
	box.appendChild(element);
	
	if(Test_Mode() != "edit")
	{
     var token            = {};
	 
	 token["block"]       = block;
	 token["element"]     = element;
	 token["paragraph"]   = paragraph;
	 token["highlighted"] = false;
	 
	 Document_Element_SetObject(element, "token", token);
	 
	 alltokens.push(token);
	}
	
   }

  }	

  // ADD PARAGRAPH TO CONTENT CONTAINER
  content.appendChild(box);  
 }
 
 if(Test_Mode() != "edit")
 {
  sheet["tokens"] = alltokens;
 }
 
 return elements;
}





async function Test_HighlightText_Highlight(event)
{
 var element   = event.currentTarget;
 var sheet     = Document_Element_GetObject(element, "sheet");
 var token     = Document_Element_GetObject(element, "token");
 var paragraph = Safe_Get(token, ["paragraph"]);
 
 if(!token) return;
 
 console.log(paragraph);
 
 // IF WE ARE ABOUT TO HIGHLIGHT A TOKEN WE NEED TO CHECK IF THERE'S A LIMIT TO THE MAXIMUM NUMBER OF HIGHLIGHTABLE TOKENS
 if(!token["highlighted"])
 {
  var highlighted = Safe_Get(paragraph, ["highlighted"], 0);
  var max         = Safe_Get(paragraph, ["max"], 0);
  
  // ALREADY REACHED MAX NUMBER OF SELECTIONS? STOP HERE
  if(max > 0 && highlighted >= max)
  {
   return;
  }
 }
 
 
 // SWITCH STATE
 token["highlighted"] = !token["highlighted"];
  
 // UPDATE HIGHLIGHTED COUNT
 var highlighted = Safe_Get(paragraph, ["highlighted"], 0);
 if(token["highlighted"])
 {
  paragraph["highlighted"] = highlighted + 1;	 
 }	
 else
 {
  paragraph["highlighted"] = highlighted - 1;	 
 }	
 	

 // IF WE JUST HIGHLIGHTED SOMETHING, AND TEST MODE IS "PRACTICE" THEN WE NEED TO GIVE IMMEDIATE FEEDBACK
 if(token["highlighted"] && Test_Mode() == "practice")
 {  
  Safe_Add(sheet, ["attempts"], +1); 
 
  switch(Test_HighlightText_Evaluate(token))
  {
   case "right":
	  await Test_Feedback_Right(token["element"], {permanent:true, outline:"outer"});
	  
	  Document_Element_Disable(token["element"]);
   break;
   
   case "wrong":
	  await Test_Feedback_Wrong(token["element"]);
	  token["highlighted"] = false;
	
	  Safe_Add(sheet, ["mistakes"], +1); 
   break;
  }
 }
 
 
 // UPDATE VISUALS
 for(var token of sheet["tokens"])
 {
  if(token["highlighted"])
  {
   token["element"].style.backgroundColor = "var(--color-accented)";
  }
  else
  {
   token["element"].style.backgroundColor = "";
  }
 }
}

	

	
function Test_HighlightText_Evaluate(token)
{
 var highlighted = token["highlighted"];
 var correct     = (token["block"]["type"] == "tag");

 
 // INCORRECT TOKEN, BUT SELECTED
 if(!correct && highlighted)
 {
  return "wrong";
 }
 else
 // INCORRECT TOKEN, NOT SELECTED
 if(!correct && !highlighted)
 {
  return "";
 }
 else
 // CORRECT TOKEN, SELECTED
 if(correct && highlighted)
 {
  return "right";
 }
 else
 // CORRECT TOKEN, MISSED
 if(correct && !highlighted)
 {
  return "wrong";
 }
 	
}







async function Test_HighlightText_Feedback(sheet)
{
 // DISABLE ELEMENTS
 for(var token of sheet["tokens"])
 {
  Document_Element_Disable(token["element"]);
 }
 
 
 
 // CALCULATE MAX
 var max = 0;
 for(var token of sheet["tokens"])
 {
  if(token["block"]["type"] == "tag")
  {
   max = max + 1;
  }
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
  
  for(var token of sheet["tokens"])
  {
   switch(Test_HighlightText_Evaluate(token))
   {
    case "right":
        await Test_Feedback_Right(token["element"], {permanent:true, outline:"outer"});
		
		score = score + 1;
    break;
   
    case "wrong":
		await Test_Feedback_Wrong(token["element"], {permanent:true, outline:"outer"});
		
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


