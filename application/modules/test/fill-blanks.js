// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                  F I L L    B L A N K S                                        //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Test_FillBlanks_Display(sheet, display)
{ 
 // PREPARE
 var elements = [];
 
 
 // QUESTION
 var question = Safe_Get(sheet, ["question"], {});
 var element  = Test_Element_Question("standard", question, {source:sheet["source"]}, sheet);
 elements.push(element);
 
 
 // CONTENT
 var content = Test_Element_Container("standard");
 if(Test_Mode() == "edit") Document_Element_Disable(content);

 // TEXT WITH BLANKS
 var assisted   = Safe_Get(sheet, ["info", "assisted"], "no");
 var paragraphs = Object_Subset(sheet, "paragraph");
 
 
 // COLLECT ALL BLOCKS FROM ALL PARAGRAPHS, FOR POSSIBLE USE LATER
 var allblocks = [];
 for(var id in paragraphs)
 {
  var paragraph = paragraphs[id];
  var string    = paragraph["text"];
  var blocks    = String_Extract_TagBlocks(string);
  
  for(var block of blocks)
  {
   if(block["type"] == "tag")
   {
	allblocks.push(block);
   }
  }
 }
 
 
 var blanks = [];
 for(var id in paragraphs)
 { 
  var paragraph = paragraphs[id];
  
  // CREATE PARAGRAPH BOX
  var box          = Test_Element_Box("blocks", sheet);
  Document_Element_SetObject(box, "paragraph", paragraph);
  if(Test_Mode() != "edit") 
  {
   paragraph["box"] = box;
  }
  
  var string       = paragraph["text"];
  var blocks       = String_Extract_TagBlocks(string);
     
	 
  // FOR EACH BLOCK OF TEXT WITHIN THIS PARAGRAPH...
  var uid = 0;
  for(var block of blocks)
  {
   switch(block["type"])
   {
	case "text":
		// JUST A TEXT BLOCK
		var element = Test_Element_Create("block-text", {text:block["content"]}, sheet);
	break;
	
	case "tag": 
	   
	   switch(assisted)
	   {
		case "yes":
			// IF ASSISTED, USE A SELECT WITH ALL POSSIBLE BLOCKS FOR THIS PARAGRAPH, IN SCRAMBLED ORDER
			var element = Test_Element_Create("block-select", blocks, sheet); 

			var tokens  = [];	
			for(var token of blocks) if(token["type"] == "tag") 
			{
			 tokens.push(token);
			}
		
			for(var token of tokens)
			{
			 // ATTACH THE CORRECT BLOCK AS OBJECT TO THE OPTION, SO THAT LATER WE CAN EASILY CHECK IF THE SELECTED OPTION IS CORRECT OR NOT
			 var option = Document_Select_AddOption(element, token["content"], token["content"], block);
			}
		
			// SCRAMBLE OPTIONS
			Document_Element_ShuffleChildren(element);
   
			// ADD NULL OPTION ON TOP
			Document_Select_InsertOption(element, "", "");
			element.selectedIndex = 0;
       break;   
		   
		   
	   case "all":
			// IF ASSISTED / ALL, USE A SELECT WITH ALL POSSIBLE BLOCKS FROM ALL PARAGRAPHS, IN SCRAMBLED ORDER
			var element = Test_Element_Create("block-select", blocks, sheet); 

			for(var token of allblocks)
			{
			 // ATTACH THE CORRECT BLOCK AS OBJECT TO THE OPTION, SO THAT LATER WE CAN EASILY CHECK IF THE SELECTED OPTION IS CORRECT OR NOT
			 var option = Document_Select_AddOption(element, token["content"], token["content"], block);
			}
		
			// SCRAMBLE OPTIONS
			Document_Element_ShuffleChildren(element);
   
			// ADD NULL OPTION ON TOP
			Document_Select_InsertOption(element, "", "");
			element.selectedIndex = 0;
       break;
	   
	   
	   default:
		    // IF NOT ASSISTED, USE A TEXT INPUT
	        var element = Test_Element_Create("block-input", block, sheet); 
       break;
	  }
	  
	  blanks.push(block);
	  
	break;
   } 
  
   Document_Element_SetData(element,   "uid",   uid);
   Document_Element_SetObject(element, "box",   box); 
   Document_Element_SetObject(element, "block", block);
   element.onchange = Test_FillBlanks_Input;
   
   if(Test_Mode() != "edit") block["element"] = element;
  
   // ADD ITEM TO THE PARAGRAPH
   box.appendChild(element);
  
   uid = uid + 1;
  }	
  
  // ADD PARAGRAPH TO THE CONTENT CONTAINER
  content.appendChild(box);
 }
 
 
 // IF NOT IN EDIT MODE, STORE BLANKS FOR LATER USE
 if(Test_Mode() != "edit") sheet["blanks"] = blanks;
 
 
 // ADD CONTENT CONTAINER TO THE TEST LAYOUT
 elements.push(content);
 return elements;
}






async function Test_FillBlanks_Input(event)
{
 var input     = event.currentTarget;
 
 var item      = Document_Element_GetObject(input, "item");
 var sheet     = Document_Element_GetObject(input, "sheet");
 var box       = Document_Element_GetObject(input, "box");
 var block     = Document_Element_GetObject(input, "block");
 var paragraph = Document_Element_GetObject(box,   "paragraph");
  
 var assisted  = (Safe_Get(sheet, ["info", "assisted"], "no") == "yes");
 
 // IF TEST MODE IS "PRACTICE" WE NEED TO GIVE IMMEDIATE FEEDBACK
 if(Test_Mode() == "practice")
 {   
  Safe_Add(sheet, ["attempts"], +1); 
  
  switch(Test_FillBlanks_Evaluate(block))
  {
   // IS THIS A CORRECT ITEM? IF NOT, GIVE NEGATIVE FEEDBACK, MARK THE SHEET, AND STOP HERE
   case "right":
       await Test_Feedback_Right(input, {permanent:true});
	
	   Document_Element_Disable(input);
   break;
  
   default:
       Safe_Add(sheet, ["mistakes"], +1); 

       await Test_Feedback_Wrong(input);
	  
	   input.value = "";
   break;
  }
 }
}


function Test_FillBlanks_Evaluate(block)
{ 
 // FIND OUR BLOCK AND THE CORRESPONDING STORED INPUT
 var value  = block["element"].value;
 var input  = value.trim().toLowerCase(); 
 var answer = block["content"];    
 
 console.log(answer);
 
 // COMPARE INPUT TO BLOCK
 var similarity = 1 - String_Analysis_Distance(String_Simplify(answer), String_Simplify(input));
 
 
 if(similarity >= Module_Config("test", "score-perfect", 0.9)) 
 {	 
  return "right";
 }	   
 else
 {
  return "wrong";
 }
  
}





async function Test_FillBlanks_Feedback(sheet)
{
 var paragraphs = Object_Subset(sheet, "paragraph"); 
 var blanks     = sheet["blanks"];
 var max        = blanks.length;
 
 
 // DISABLE ELEMENTS
 for(var block of blanks)
 {
  Document_Element_Disable(block["element"]);
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
  // CALCULATE SCORE
  var score = 0;
  
  for(var block of blanks)
  {
   switch(Test_FillBlanks_Evaluate(block))
   {
	case "right":
		score = score + 1;
		
		await Test_Feedback_Right(block["element"], {permanent:true}); 
	break;
	
	case "wrong":
		await Test_Feedback_Wrong(block["element"], {permanent:true}); 
		
		block["element"].value = block["content"];
		
		// MAKE ELEMENT WIDE ENOUGH TO SHOW THE WHOLE CORRECT ANSWER
		block["element"].style.width = "";
		//block["element"].size        = "";
	break;
   }
  }
   
  if(score < 0) score = 0; 
  var score = score / max;  
 }
 
 

 return score;
}