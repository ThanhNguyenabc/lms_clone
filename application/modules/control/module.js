// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       C O N T R O L                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Control_OnLoad(module, data)
{
 Core_State_Set("control", "persist", true);
 Core_State_Set("control", "data", data);
 
 var container = UI_Element_Find(module, "control-list"); 
 var tools     = Object_Subset(Core_Data_Page("control/tools"), "tool");
 
 for(var id in tools)
 {
  var tool = tools[id];
  
  var f    = tool["f"];
  var icon = tool["icon"];
  var text = UI_Language_Object(tool);
  
  var box  = UI_Element_Create("control/tool", {icon, text});
  
  box.onclick = Safe_Function(f, function(){});
  
  container.appendChild(box);
 }
}



async function Control_OnShow(module, data)
{
}




async function Control_OnUnload()
{
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                           T O O L S                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Control_Tool_LessonAsClassroom()
{
 var picture  = Resources_URL("images/cover-control.png");
 var title    = UI_Language_String("control/tools", "test classroom title");
 var subtitle = UI_Language_String("control/tools", "test classroom subtitle");
 
 var last     = User_Settings_Get("control", "last lesson");
 var lessons  = Core_State_Get("control", ["data", "lessons"]);
 var options  = [];
 options.push({text:"", value:false});
 for(var lesson of lessons)
 {
  var value  = lesson;
  var text   = lesson;
  var option = {value, text};
  
  options.push(option);
 }
 
 var lesson   = await UI_Popup_Select(title, subtitle, picture, options, last);
 if(!lesson) return;
 
 User_Settings_Set("control", "last lesson", lesson);
 Control_Lesson_AsClassroom(lesson);
}





async function Control_Tool_LessonAsStudentCourse()
{
 var picture  = Resources_URL("images/cover-control.png");
 var title    = UI_Language_String("control/tools", "test courselesson title");
 var subtitle = UI_Language_String("control/tools", "test courselesson subtitle");
 
 var last     = User_Settings_Get("control", "last lesson");
 var lessons  = Core_State_Get("control", ["data", "lessons"]);
 var options  = [];
 options.push({text:"", value:false});
 for(var lesson of lessons)
 {
  var value  = lesson;
  var text   = lesson;
  var option = {value, text};
  
  options.push(option);
 }
 
 var lesson   = await UI_Popup_Select(title, subtitle, picture, options, last);
 if(!lesson) return;

 User_Settings_Set("control", "last lesson", lesson);
 Control_Lesson_AsCourseSeat(lesson);
}




async function Control_Tool_ChangeRole()
{
 var roles    = Core_Config(["roles"]);
 var options  = [];
 for(var role in roles)
 {
  var text  = UI_Language_Object(roles[role]);
  var value = role;
  
  options.push({value, text});
 }
 
 var picture  = Resources_URL("images/cover-control.png");
 var title    = UI_Language_String("control/tools", "role change title");
 var subtitle = UI_Language_String("control/tools", "role change subtitle");
 
 var newrole  = await UI_Popup_Select(title, subtitle, picture, options, User_Role());
 if(!newrole) return;
 
 application["user"]["role"] = newrole;
}








async function Control_Tool_TestSpeechSynthesis()
{ 	 
 var picture = Resources_URL("images/cover-control.png");
 var content = UI_Element_Create("control/tool-speech-synthesis");
 var voices  = Media_Speech_ListVoices();
 var bylang  = [];
 for(var voice of voices)
 {
  if(!bylang[voice.lang]) bylang[voice.lang] = [];
  bylang[voice.lang].push(voice);
 }
 
 var select_language  = UI_Element_Find(content, "language");
 var select_voice     = UI_Element_Find(content, "voice");
 var input_text       = UI_Element_Find(content, "text");
 
 
 // SELECT LANGUAGE 
 var langs            = Object.keys(bylang);
 Document_Select_AddOption(select_language, "", "");
 for(var lang of langs)
 {
  Document_Select_AddOption(select_language, lang, lang);
 }

 select_language.onchange =
 function()
 {
  User_Settings_Set("control", "last speech synth language", select_language.value);
  
  Document_Select_Clear(select_voice);
  Document_Select_AddOption(select_voice, "", "");
  
  var lang = select_language.value;
  var list = bylang[lang] || [];
  for(var voice of list)
  {
   Document_Select_AddOption(select_voice, voice.name, voice.name, voice);	  
  }
 }
 
 select_voice.onchange = 
 function()
 {
  User_Settings_Set("control", "last speech synth voice", select_voice.value);
 }
 
 select_language.value = User_Settings_Get("control", "last speech synth language");
 select_language.onchange();
 select_voice.value = User_Settings_Get("control", "last speech synth voice");
  
 
 
 // SPEAK
 var speak = 
 function()
 {
  Media_Speech_Speak(input_text.value, select_voice.value);
  
  User_Settings_Set("control", "last speech synth text", input_text.value);
 }
 
 input_text.value = User_Settings_Get("control", "last speech synth text");
 
 Document_Handler_EnterKey(input_text, speak);
 
 var button = 
 { 
  text   : UI_Language_String("control/tool-speech-synthesis", "button speak"), 
  onclick: speak
 }
	
	

 // POPUP
 var title = UI_Language_String("control/tool-speech-synthesis", "popup title");  
 var popup = await UI_Popup_Create({picture, title, content}, [button]);
}




async function Control_Tool_AzureSpeechSynthesis()
{ 	 
 var picture = Resources_URL("images/cover-control.png");
 var content = UI_Element_Create("control/tool-azure-tts");

 
 var select_language = UI_Element_Find(content, "language");
 var select_voice    = UI_Element_Find(content, "voice");
 var select_style    = UI_Element_Find(content, "style");
 var input_text      = UI_Element_Find(content, "text");
 var select_pitch    = UI_Element_Find(content, "pitch");
 var select_rate     = UI_Element_Find(content, "rate");
 
 
 // PITCH
 var page = Core_Data_Page("control/tool-azure-tts");
 var list = Core_Data_Value("control/tool-azure-tts", "voice parameters", "pitch").split(",");
 for(var item of list)
 {
  var value = item;
  var text  = UI_Language_Object(page[item]);
  
  Document_Select_AddOption(select_pitch, text, value);
 }
 
 
 select_pitch.value    = User_Settings_Get("control", "last speech synth pitch", "default");
 select_pitch.onchange = 
 function()
 {
  // STORE LAST PITCH
  User_Settings_Set("control", "last speech synth pitch", select_pitch.value);
 }
 
 
 // RATE
 var page = Core_Data_Page("control/tool-azure-tts");
 var list = Core_Data_Value("control/tool-azure-tts", "voice parameters", "rate").split(",");
 for(var item of list)
 {
  var value = item;
  var text  = UI_Language_Object(page[item]);
  
  Document_Select_AddOption(select_rate, text, value);
 }
 
 select_rate.value    = User_Settings_Get("control", "last speech synth rate", "default");
 select_rate.onchange = 
 function()
 {
  // STORE LAST RATE
  User_Settings_Set("control", "last speech synth rate", select_rate.value);
 }
 
 
 // ON CHANGE TEXT
 input_text.onchange = 
 function()
 {
  // STORE LAST WRITTEN TEXT
  User_Settings_Set("control", "last speech synth text", input_text.value);
 }
 
 
 // LANGUAGE
 var languages = Core_Config(["partner", "localization", "languages"]).split(",");
 for(var language of languages)
 {
  var text  = UI_Language_String("core/languages", language, {}, language);
  var value = language;
  Document_Select_AddOption(select_language, text, value);
 }
 
 
 // ON CHANGE LANGUAGE
 select_language.onchange = 
 async function()
 { 
  select_voice.innerHTML = "";
  
  // STORE LAST USED LANGUAGE
  User_Settings_Set("control", "last speech synth language", select_language.value);
  
  var voices   = await Services_Azure_LocaleVoices(select_language.value);
  var dialects = Object.keys(voices);
  for(var dialect of dialects)
  {
   Document_Select_AddOption(select_voice, dialect.toUpperCase(), "").disabled = true;
   Document_Select_AddOption(select_voice, "", "").disabled = true;
   
   for(var voice of voices[dialect])
   {
	if(voice["StyleList"]) var style = " *"; else var style = "";
		
	var text   = voice["LocalName"] + style;
	var value  = voice["ShortName"];
	var option = Document_Select_AddOption(select_voice, text, value);
	
	Document_Element_SetObject(option, "voice", voice);
   }
   
   Document_Select_AddOption(select_voice, "", "").disabled = true;
  }
 }
 
 
 // ON CHANGE VOICE
 select_voice.onchange = 
 async function()
 { 
  select_style.innerHTML = "";
  
  var option = Document_Select_SelectedOption(select_voice);  
  var voice  = Document_Element_GetObject(option, "voice");
  if(!voice) return;
  
  // STORE LAST USED VOICE
  User_Settings_Set("control", "last speech synth voice", select_voice.value);
  
  for(var style of voice["StyleList"] || [])
  {
   var text   = style;
   var value  = style; 
   Document_Select_AddOption(select_style, text, value);
  }
  
  select_style.onchange = 
  function()
  {
   // STORE LAST USED STYLE
   User_Settings_Set("control", "last speech synth style", select_style.value);
  }
  
  select_style.value = User_Settings_Get("control", "last speech synth style");
 }
 
 
 
 // INIT
 select_language.value = UI_Language_Current();
 await select_language.onchange();
 select_voice.value = User_Settings_Get("control", "last speech synth voice");
 await select_voice.onchange();
 select_style.value = User_Settings_Get("control", "last speech synth style");
 
 
 // SAVE =
 var save = 
 async function()
 {
  var options = {};  
  options["lang"]  = select_language.value;
  options["style"] = select_style.value;
  options["pitch"] = select_pitch.value;
  options["rate"]  = select_rate.value;
  
  var audio = await Services_Azure_Speak(input_text.value, select_voice.value, options);
  
  var filename = Document_Select_SelectedOption(select_voice).text + " " + Date_Now() + ".mp3"; 
  await Storage_Blob_Download(audio, filename);
 }
 
 var button_save = 
 { 
  text   : UI_Language_String("control/tool-azure-tts", "button save"), 
  onclick: save
 }
	


 // SPEAK
 var speak = 
 async function()
 {
  var options = {};
  options["lang"]  = select_language.value;
  options["style"] = select_style.value;
  options["pitch"] = select_pitch.value;
  options["rate"]  = select_rate.value;
  
  var audio = await Services_Azure_Speak(input_text.value, select_voice.value, options);
  
  Media_Audio_Play(audio);
 }
 
 input_text.value = User_Settings_Get("control", "last speech synth text") || "";
 
 Document_Handler_EnterKey(input_text, speak);
 
 var button_speak = 
 { 
  text   : UI_Language_String("control/tool-azure-tts", "button speak"), 
  onclick: speak
 }
 
 
 // CLOSE
 var close = 
 async function()
 {
  UI_Popup_Close(popup);
 }
  
 var button_close = 
 { 
  text   : UI_Language_String("control/tool-azure-tts", "button close"), 
  onclick: close
 }
	
	

 // POPUP
 var title = UI_Language_String("control/tool-azure-tts", "popup title");  
 var popup = await UI_Popup_Create({picture, title, content}, [button_speak, button_save, button_close], "flexi", {open:true, escape:false});
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          M O R E                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



async function Control_Lesson_AsCourseSeat(lesson_id)
{
 var virtual = await Core_Api("Control_Virtual_Seat", {lesson_id});
 
 var display = UI_Element_Find("main-module");
 await Course_Class(display, virtual["seat_id"]); 

 await Core_Api("Control_Virtual_Cleanup", {virtual});
}




async function Control_Lesson_AsClassroom(lesson_id)
{
 var virtual = await Core_Api("Control_Virtual_Seat", {lesson_id});

 Core_State_Set("global", ["view-class"], virtual["class_id"]);
 await Module_Load("classroom");
 
 await Core_Api("Control_Virtual_Cleanup", {virtual});
}


