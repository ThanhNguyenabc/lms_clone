// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                             S P E E C H    R E C O G N I T I O N                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Test_SpeechRecognition_Display(sheet, display)
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
 
 
 
 // DISPLAY SPEECH ITEMS
 var items     = Object_Subset(sheet, "item");
 var sentences = [];
 
 for(var id in items)
 {
  var item    = items[id];
  
  // ADD THIS ITEM'S TEXT TO THE LIST OF RECOGNIZABLE SENTENCES
  var answers = Safe_Get(item, ["answers"], "").split("/");
  for(answer of answers) sentences.push(answer.toLowerCase().trim());
  
  
  // CREATE ELEMENT 
  var element = Test_Element_Item("speech", item, {mode:"single media", source:sheet["source"]}, sheet);
  if(Test_Mode() != "edit") item["element"] = element;
  
  // ELEMENT'S MICROPHONE ICON (CLICK AND RECORD)  
  var speak = UI_Element_Find(element, "speak");  
  
  Document_Element_SetObject(speak, "sentences", sentences);
  Document_Element_SetObject(speak, "sheet", sheet);
  Document_Element_SetObject(speak, "item",  item);
  
  speak.onclick = Test_SpeechRecognition_Record;
  
  
  // ELEMENT'S EAR ICON (CLICK AND RE-LISTEN)  
  var listen = UI_Element_Find(element, "listen"); 
  Document_Element_SetObject(speak, "item",  item);
 
  listen.onclick = Test_SpeechRecognition_Playback;
  Document_Element_SetObject(listen, "item",  item);
  
  content.appendChild(element);  
 }
 
 
 return elements;
}







async function Test_SpeechRecognition_Record(event)
{
 var element   = event.currentTarget;
 var icon      = UI_Element_Find(element, "icon");
 
 var sheet     = Document_Element_GetObject(element, "sheet");
 var item      = Document_Element_GetObject(element, "item");
 var sentences = Document_Element_GetObject(element, "sentences");
 
 
 // DISABLE TEST DISPLAY BEFORE RECORDING STARTS
 Test_Disable();
 
 var content_lang = "en";
 var result       = await Handler_Speech_Recognition(sentences, content_lang, element, {icon, letter_time:300, pause_time:500});
 
 // RE ENABLE TEST DISPLAY
 Test_Enable();
 
 
 // STORE RESULT FOR PLAYBACK
 if(Test_Mode() != "edit")
 {
  var item       = Document_Element_GetObject(element, "item");
  item["result"] = result;
  
  var listen = UI_Element_Find(item["element"], "listen");
  
  // IF TEST IN PRACTICE MODE, GIVE IMMEDIATE FEEDBACK
  if(Test_Mode() == "practice")  
  {
   Safe_Add(sheet, ["attempts"], +1); 
   
   switch(Test_SpeechRecognition_Evaluate(item))
   {
	case "right":
		var icon = UI_Element_Find(item["element"], "speak");
		Document_Element_Disable(icon);
		Document_CSS_SetClass(icon, "style-disabled");
		
		await Test_Feedback_Right(item["element"], {permanent:true});   
	break;
	
	case "wrong":
		listen.style.visibility = "hidden";
		await Test_Feedback_Wrong(item["element"]);   
   
		Safe_Add(sheet, ["mistakes"], +1);
   
		return;
	break;
   }
  }
 
  
  // ACTIVATE PLAYBACK BUTTON AND MAKE SURE THE USER SEES IT
  listen.style.visibility = "visible";
  
  Document_Element_Animate(listen, "flash 1.5s");
 }
 
}




function Test_SpeechRecognition_Evaluate(item)
{
 var confidence = Safe_Get(item, ["result", "confidence"], 0);
 
 if(confidence >= Module_Config("test", "score-soso")) return "right"; else return "wrong";
}




async function Test_SpeechRecognition_Playback(event)
{
 var element = event.currentTarget;
 var item    = Document_Element_GetObject(element, "item");
 var result  = item["result"];
  
 var sample  = Safe_Get(result, ["sample"]);
 
 if(sample)
 {
  var icon = UI_Element_Find(element, "icon");
  Document_Element_Animate(icon, "flash 1.5s ease-in-out infinite");
	
  await Media_Audio_Play(sample);
	
  Document_Element_Animate(icon, false);
 }
}




async function Test_SpeechRecognition_Feedback(sheet)
{
 var items = Object_Subset(sheet, "item");
 var max   = Object.keys(items).length;
  
 // DISABLE
 for(var id in items)
 {
  var item  = items[id];
  var speak = UI_Element_Find(item["element"], "speak");
  
  Document_CSS_SetClass(speak, "style-disabled");
 }
 
 
 
 // IN PRACTICE MODE, JUST CHECK THE SHEET'S NUMBER OF MISTAKES MADE
 if(Test_Mode() == "practice")
 {
  var mistakes = Safe_Get(sheet, ["mistakes"], 0);
  var attempts = Safe_Get(sheet, ["attempts"], 0);
  var score    = (1 - (mistakes / attempts)) || 0;
 }
	 
 
 
 // CALCULATE SCORE
 if(Test_Mode() == "test")
 {
  var score = 0;
  
  for(var id in items)
  {
   var item = items[id];
 
   switch(Test_SpeechRecognition_Evaluate(item))
   {
    case "right":
		await Test_Feedback_Right(item["element"], {permanent:true});
		
		score = score + 1;
    break;
   
    case "wrong":
		await Test_Feedback_Wrong(item["element"], {permanent:true});
		
		UI_Element_Find(item["element"], "audio").style.display   = "none";
		UI_Element_Find(item["element"], "picture").style.display = "none";
		UI_Element_Find(item["element"], "text").style.display    = "flex";
		
		UI_Element_Find(item["element"], "text").innerHTML        = UI_Language_String("test", "item answers valid") + " " + item["answers"];
    break;
   } 	  
  }
  
  if(score < 0) score = 0;
  score = score / max;
 }
 
 return score;
}