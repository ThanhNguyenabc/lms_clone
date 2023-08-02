// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      H A N D L E R S                                           // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



async function Handler_Speech_Recognition(sentences, content_lang, container, config = {})
{ 
 Document_Element_Disable(container);
	
 // SPEECH SERVICE URL
 var service = Safe_Get(application, ["config", "system", "speech", "service"], "");
 service     = Client_Variables_Apply(service);
 
 
 // CALCULATE LONGEST POSSIBLE SPEECH TIME
 var letter_time = config["letter_time"] || 150;
 var pause_time  = config["pause_time"]  || 250;
 var max         = 0;
 for(var sentence of sentences) 
 {
  var time           = String_Speak_Time(sentence, letter_time, pause_time);
  if(time > max) max = time;
 }
 max = max + 500;
 if(max < 3000) max = 3000;
 
 
 // CREATE GAUGE
 var color  = Document_CSS_GetVariable("color-alert");
 var gauge  = UI_Gauge_ProgressCircle(container, undefined, color);
 UI_Gauge_TimeUpdate(gauge, max);
   
 // FIRE RECOGNITION
 var lang_code = Core_Data_Value("core/languages", "en", "code"); console.log(lang_code);
 var result    = await Media_Speech_RecognizeCustom(sentences, lang_code, max, service,
   
 // ON RECORD START
 function()
 {
  if(config["icon"])
  {
   config["icon"].style.color = "var(--color-alert)";
   Document_Element_Animate(config["icon"], "flash 1.5s ease-in-out infinite");
  }
  
  if(config["onstart"]) config["onstart"]();
 },
   
 // ON RECORD END
 function()
 {
  if(config["icon"])
  {
   config["icon"].style.color = "";
   Document_Element_Animate(config["icon"], false);
  }
  
  gauge.remove();
  
  if(config["onend"]) config["onend"]();
 }); 
 
 Document_Element_Restore(container); 
 
 return result; 
}








async function Handler_Element_Feedback(element, value, options = {})
{  
 var feedback  = Core_Data_Section("core/feedback", value);
  
  
 if(options["outline"]) 
 {
  var outline = "outline-" + options["outline"];
 }
 else
 {
  var outline = "outline-inner";
 }
  
  
 if(options["lock"])
 {
  Document_Element_Disable(options["lock"]);
 }

 
 var removed = Document_CSS_PurgeClasses(element, "style-outlined");
 if(!options["nostyle"]) 
 {
  Document_CSS_SetClass(element, "style-outlined-" + feedback["color"]);
  Document_CSS_SetClass(element, outline);
 }
 
 if(!options["silent"])
 {
  Media_Audio_Play(Resources_URL("sounds/" + feedback["sound"] + ".mp3"));
 }
 
 
 await Document_Element_Animate(element, feedback["animation"]);  
 
 
 if(!options["permanent"])
 {
  Document_CSS_UnsetClass(element, "style-outlined-" + feedback["color"]);
  Document_CSS_UnsetClass(element, outline);
  
  Document_CSS_SetClasses(element, removed);
 }
 

 if(options["lock"])
 {
  Document_Element_Restore(options["lock"]);
 }
}