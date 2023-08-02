// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         A Z U R E                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Services_Azure_ListVoices()
{
 var voices = Core_State_Get("services", ["azure", "tts", "voices"]);
 if(!voices)
 {
  var voices = await Core_Service("azure-listvoices", {type:"neural"});
  Core_State_Set("services", ["azure", "tts", "voices"], voices);
 }
 
 return voices;
}



async function Services_Azure_LocaleVoices(locale)
{
 var voices = await Services_Azure_ListVoices();
 
 var list = {};
 for(var voice of voices)
 { 
  if(voice["Locale"].toLowerCase().startsWith(locale))
  {
   var dialect = voice["LocaleName"];
   if(!list[dialect]) list[dialect] = [];
 
   list[dialect].push(voice);
  }
 }
 
 return list;
}



async function Services_Azure_Speak(text, voice, options = {})
{
 // IF VOICE OBJECT PASSED RATHER THAN NAME, EXTRACT NAME FROM IT
 if(typeof voice == "object") var voice = voice["ShortName"] || "";
 
 // ASSEMBLE DATA
 var data = {text, voice};
 Object.assign(data, options);

 // CALL SERVICE
 var audio = await Core_Service("azure-speak", data, {type:"blob"});
 
 // RETURN BLOB
 return audio;
}