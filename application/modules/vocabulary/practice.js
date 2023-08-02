// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       P R A C T I C E                                          //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Vocabulary_Practice(list, index, display, config = {})
{
 // HACKS. REMOVE LATER
 var native_lang  = "vn";//Client_Language_Get();
 var content_lang = config["content_lang"] || "en"; 
 
 var term         = list[index]; console.log(term);
 var text         = Safe_Get(term, ["info", content_lang], "").toLowerCase();
 
 term["display"]  = display;
 term["config"]   = config;
 
 var content = UI_Element_Create("vocabulary/term-practice");
 
 
 // PICTURE
 var element = UI_Element_Find(content, "picture");
 var source  = term["source"] + "/picture.png";
 Document_Image_Load(element, [source]);
 
 Document_Element_SetObject(element, "config", config); 
 Document_Element_SetObject(element, "term",   term);
 Document_Element_SetObject(element, "text",   text);
 
 element.onclick = 
 function(event)
 {
  var element = event.currentTarget;
  var term    = Document_Element_GetObject(element, "term");
  
  Vocabulary_Term_Listen(term);
 }
 
 
 
 // MEANING 
 var element = UI_Element_Find(content, "meaning");
 
 Document_Element_SetObject(element, "config", config); 
 Document_Element_SetObject(element, "term",   term);
 Document_Element_SetObject(element, "text",   text);
 
 for(var item of list)
 { 
  var value = Safe_Get(item, ["info", content_lang], "");
  var itext = Safe_Get(item, ["info", native_lang],  "");
   
  Document_Select_AddOption(element, itext, value);
 }
  
 Document_Element_ShuffleChildren(element); 
 Document_Select_InsertOption(element, "", "");
  
 Safe_Set(term, ["meaning", "element"], Document_Element_FindParent(element, "component", "item"));
 element.value    = "";
 element.onchange = Vocabulary_Practice_Meaning;
 
  
 
  
 // SPELLING
 var element      = UI_Element_Find(content,   "spelling");

 Document_Element_SetObject(element, "config", config); 
 Document_Element_SetObject(element, "term",   term);
 Document_Element_SetObject(element, "text",   text);
  
 Safe_Set(term, ["spelling", "element"], Document_Element_FindParent(element, "component", "item"));
 element.onchange = Vocabulary_Practice_Spelling;
 
 
 
   
 // PRONUNCIATION
 var element     = UI_Element_Find(content,    "record");

 Document_Element_SetObject(element, "config", config); 
 Document_Element_SetObject(element, "term",   term);
 Document_Element_SetObject(element, "text",   text);
  
 Safe_Set(term, ["pronunciation", "element"], Document_Element_FindParent(element, "component", "item")); 
 element.onclick = Vocabulary_Practice_Pronunciation;


  
 // LISTEN
 Vocabulary_Term_Listen(term);
 
 
 // DISPLAY 
 display.innerHTML = "";
 display.appendChild(content);
}





async function Vocabulary_Practice_Meaning(event)
{
 var element    = event.currentTarget;
 var config     = Document_Element_GetObject(element, "config");
 var term       = Document_Element_GetObject(element, "term");
 var text       = Document_Element_GetObject(element, "text");
  
 if(text == element.value) var result = 1; else result = 0;
 console.log(text, element.value);
 
 // STORE RESULT
 Safe_Set(term, ["meaning", "result"], result);
 
 
 // FEEDBACK
 var result = await Vocabulary_Practice_Feedback(term, "meaning", config["mode"]);
 
 // IN PRACTICE MODE, IF BAD RESET AND RETRY
 if(config["mode"] == "practice" && !result)
 {
  element.value = "";
 }

}



async function Vocabulary_Practice_Spelling(event)
{
 var element    = event.currentTarget;
 var config     = Document_Element_GetObject(element, "config");
 var term       = Document_Element_GetObject(element, "term");
 var text       = Document_Element_GetObject(element, "text");
   
 var dist       = String_Analysis_Distance(text.toLowerCase(), element.value.toLowerCase());
 var result     = 1 - dist;
 
 // STORE RESULT
 Safe_Set(term, ["spelling", "result"], result);
 
 
 // FEEDBACK
 var result = await Vocabulary_Practice_Feedback(term, "spelling", config["mode"]);
 
 // IN PRACTICE MODE, IF BAD RESET AND RETRY
 if(config["mode"] == "practice" && !result)
 {
  element.value = "";
 }
 
}




async function Vocabulary_Practice_Pronunciation(event)
{
 var element    = event.currentTarget;
 var config     = Document_Element_GetObject(element, "config");
 var term       = Document_Element_GetObject(element, "term");
 var text       = Document_Element_GetObject(element, "text");
  
 var content_lang = config["content_lang"] || "en"; 
 var icon         = UI_Element_Find(element, "microphone");
 var sentences    = [text];
   
 var result = await Handler_Speech_Recognition(sentences, content_lang, element, {icon});
 result     = result["confidence"] || 0;
 if(result >= Module_Config("vocabulary", "score-soso")) result = 1; else result = 0;
    
 // STORE RESULT
 Safe_Set(term, ["pronunciation", "result"], result);
 
 
 // FEEDBACK
 var result = await Vocabulary_Practice_Feedback(term, "pronunciation", config["mode"]);
 
 // IN PRACTICE MODE, IF BAD RESET AND RETRY
 if(config["mode"] == "practice" && !result)
 {
 }
}




async function Vocabulary_Practice_Feedback(term, component, mode)
{
 var element = Safe_Get(term, [component, "element"]);
 var result  = Safe_Get(term, [component, "result"]);
 
 if(result == 1) var value = "good"; else value = "bad";
 
 var result = false;
 switch(mode)
 {
  case "practice":
	if(value == "good")
	{
     await Handler_Element_Feedback(element, value, {permanent:true});
	 Document_Element_Disable(element);
	 
	 Safe_Add(term, ["attempts"], +1);
	 result = true;
	}
	else
    {
     await Handler_Element_Feedback(element, value);
	 
	 delete term[component]["result"];
	 
	 Safe_Add(term, ["attempts"], +1);
	 Safe_Add(term, ["mistakes"], +1);
	 result = false;
	}
  break;
  
  case "test":
	 await Handler_Element_Feedback(element, value, {permanent:true});
	 Document_Element_Disable(element);
	 
	 if(value == "good") result = true; else result = false;
  break;
 }

 var oncomplete = Safe_Get(term, ["config", "oncomplete"]);
 Vocabulary_Practice_TermComplete(term);
 
 return result;
}



async function Vocabulary_Practice_TermComplete(term)
{
 var config     = term["config"] || {};
 
 var complete   = true;
 var score      = 0;
 
 // CHECK COMPLETION
 var count      = 0;
 var components = ["meaning", "spelling", "pronunciation"];
 for(var component of components)
 {
  if(typeof Safe_Get(term, [component, "result"]) != "undefined")
  {
   score = score + Safe_Get(term, [component, "result"]);
   count = count + 1;
  }
 }
 
 term["completion"] = components.length / count;
 
 
 // COMPLETE?
 if(count == components.length)
 {	 
  if(config["mode"] == "practice")
  {
   term["score"] = (1 - (term["mistakes"] / term["attempts"])) || 0;
  }
  else
  {
   term["score"] = score / count;
  }
  
  var picture = UI_Element_Find(term["display"], "picture");
  Document_CSS_PurgeClasses(picture, "style-blurred");
  
  var oncomplete = config["oncomplete"];
  if(oncomplete) oncomplete(term);
 }
}




function Vocabulary_Practice_Result(list)
{
 var score = 0;
 var data  = [];
 
 for(var term of list)
 {
  score = score + term["score"];
  data.push(
  {
   term:  term["id"],
   score: term["score"] || 0
  });
 }
 
 score = (score / data.length) || 0;
 
 var result = {score, data};
 return result;
}
