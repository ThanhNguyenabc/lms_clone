// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     V O C A B U L A R Y                                        //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Vocabulary_Term_Read(source)
{
 var term = await Core_Api("Vocabulary_Read_Term", {source:source}); 
 
 return term;
}




async function Vocabulary_Terms_Read(source, list = "vocabulary")
{
 var terms = await Core_Api("Vocabulary_Read_Terms", {terms:list, source:source}); 
 
 return terms;
}




async function Vocabulary_Term_Display(term, template = "standard", options = {})
{
 var content_lang = "en";  // HACK, TO BE CHANGED LATER    
 var user_lang    = "vn";  // HACK, TO BE CHANGED LATER
 
 
 // IF TERM IS A STRING RATHER THAN AN OBJECT, THEN WE INTERPRET IT AS A SINGLE VOCABULARY TERM TO BE LOADED FROM THE GLOBAL VOCABULARY
 if(typeof term == "string")
 {
  var term = await Vocabulary_Term_Read("content/vocabulary/" + term); 
 }
	

 // IF OPTIONS SPECIFY "HTML" THEN WE ARE PASSING EXPLICIT HTML IN "TEMPLATE" AND WE USE THAT TO BUILD THE DISPLAY	
 // THIS IS USED WHEN VOCABULARY_DISPLAY IS BUILDING A DISPLAY WITH SEVERAL TERMS AND USING A DYNAMIC TEMPLATE FROM CONTENT/TEMPLATES
 if(options["html"])
 {
  var display = UI_Element_Create(template, {}, {html:true});
 }
 else
 {
  var display = UI_Element_Create("vocabulary/term-" + template);
 }
 
 Document_Element_SetObject(display, "term", term);
 
 
 
 // PICTURE
 // Picture-Background is a clone used to display a copy of the picture as background in some special cases/templates
 for(var component of ["picture", "picture-background"])
 {
  var picture = UI_Element_Find(display, component);
  if(picture)
  {
   await Document_Image_Load(picture, [term["source"] + "/picture.png"], {nocache:true, waitloaded:true});
   Document_Element_SetObject(picture, "term", term);
   
   picture.onclick = 
   function(event)
   {
    var element = event.currentTarget;
    var term    = Document_Element_GetObject(element, "term");
    
    Vocabulary_Term_Listen(term);
   }
  } 
 }
 
 
 // TEXT
 var text = UI_Element_Find(display, "text");
 if(text) 
 {
  var info       = term["info"] || {};
  var word       = UI_Language_Object(info, "", undefined, content_lang)
  text.innerHTML = word;
 
  Document_Element_SetObject(text, "term", term);
  Document_Element_SetData(text,   "lang", content_lang);

  text.onclick = Vocabulary_Term_ShowTranslation; 
 }
 
 
 
 // EXAMPLE
 var example = UI_Element_Find(display, "example");
 if(example)
 {
  example.innerHTML = UI_Language_Object(term["example 00"]);
 }
 
 
 
 return display;
}





async function Vocabulary_Term_Sticker(term, element, corner, template = "standard", options = {side_short:10, side_long:20, color:"var(--color-accented)", z:1000})
{
 var display  = await Vocabulary_Term_Display(term, template); 
 var term     = Document_Element_GetObject(display, "term");
 var frame    = UI_Sticker_Frame("frame-bubble-" + corner, display, options); 
 
 var sticker  = UI_Sticker(element, frame, {corner:corner, z:options["z"]});
 Document_Element_SetObject(sticker, "term", term);
 

 if(options["translate"]) 
 {
  var text = UI_Element_Find(sticker, "text");
  Vocabulary_Term_ShowTranslation({currentTarget:text});
 }
 
 
 if(options["listen"])
 {
  Vocabulary_Term_Listen(term);
 }
 
 
 return sticker;
}




async function Vocabulary_Term_Listen(term)
{
 var content_lang = "en";      
 var user_lang    = Client_Language_Get();
 
 if(term["audio"]) 
 // USE SAMPLED AUDIO
 {
  await Media_Audio_Play(term["audio"]);
 }
 else
 // USE SPEECH SYNTHESIS	  
 {
  var text = UI_Language_Object(term["info"], undefined, undefined, content_lang);
  await Media_Speech_Speak(text, "en-us", {rate:0.5});
 }
}




async function Vocabulary_Term_ShowTranslation(event)
{
 var element = event.currentTarget;
 var term    = Document_Element_GetObject(element, "term");
 
 var content_lang = "en";      
 var user_lang    = "vn";
 
 var lang = Document_Element_GetData(element, "lang");
 if(lang == user_lang) lang = content_lang; else lang = user_lang;
  
 Document_Element_Animate(element, "flip 1s");
 await Client_Wait(0.5);
 element.innerHTML = UI_Language_Object(term["info"], undefined, undefined, lang);
  
 Document_Element_SetData(element, "lang", lang);
}





function Vocabulary_Term_Purge(term)
{
 var splitter = false;
 for(var char of ["_", "-"])
 {
  if(term.includes(char))
  {
   splitter = char;
   break;
  }
 }
 
 if(!splitter) return term;
 
 term = term.split(splitter);
 return term[0];
}



async function Vocabulary_Display(terms, template = "standard")
{
 // SPECIAL CASE: "DYNAMIC" TEMPLATE WILL READ DYNAMIC TEMPLATE FILES FROM THE CONTENT FOLDER
 if(template == "dynamic")
 {
  var html      = await Core_Api("Content_Templates_Read", {files:["vocabulary/display", "vocabulary/term"]});
  var display   = UI_Element_Create(html["vocabulary/display"], {}, {html:true});
 }
 else
 // STANDARD BUILT-IN TEMPLATES
 {
  var display   = UI_Element_Create("vocabulary/display-" + template);
 }
 
 var container = UI_Element_Find(display, "lines") || display;
 
 // IF SOURCE IS NOT AN EXPLICIT LIST OF TERMS, BUT RATHER A PATH TO READ THEM
 if(typeof terms == "string")
 {
  var terms = await Vocabulary_Terms_Read(terms);
 }
 

 for(var id in terms)
 {
  var term = terms[id];
  
  // SPECIAL CASE: "DYNAMIC" TEMPLATE WILL READ DYNAMIC TEMPLATE FILES FROM THE CONTENT FOLDER (ALREADY LOADED ABOVE)
  if(template == "dynamic")
  {
   var row = await Vocabulary_Term_Display(term, html["vocabulary/term"], {html:true});
  }
  else
  {
   var row = await Vocabulary_Term_Display(term, "line");
  }
  
  container.appendChild(row);
 }
 
 return display;
}


