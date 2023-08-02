// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         M E D I A                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

var media        = {};
media["devices"] = {};




async function Media_Init()
{
 // AWAKE USER MEDIA AND REQUEST PERMISSIONS
 await navigator.mediaDevices.getUserMedia({audio:true, video:true});
 
 await Media_Devices_List(); 
   
 navigator.mediaDevices.ondevicechange = Media_Devices_OnChange;
}







function Media_Info_Type(filename)
{
 var ext = Path_Extension(filename).toLowerCase();
 
 if(["jpg", "jpeg", "gif", "png", "svg"].includes(ext))
 {
  return "image";
 }	  
     
	 
 if(["mov", "avi", "mpg", "mpeg", "mp4"].includes(ext))
 {
  return "video";
 }
  
  
 if(["mp3", "wav", "ogg"].includes(ext))
 {
  return "audio";
 }
 
 
 
 if(["pdf"].includes(ext))
 {
  return "pdf";
 }
 
 
 
 return "unknown";
}








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                        D E V I C E S                                           //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Media_Devices_List()
{
 // ENUMERATE AVAILABLE DEVICES
 var devices = await navigator.mediaDevices.enumerateDevices();
  
 // ASSEMBLE DEVICES LIST
 var list = {};
 for(var device of devices) 
 {  console.log(device);
  // NEW DEVICE TYPE?
  if(!list[device.kind]) list[device.kind] = {};
   
  list[device.kind][device.deviceId] = device;
 }
  
 media["devices"] = list;
}





function Media_Devices_Select(type, id)
{ 	
 // DOES CHOSEN DEVICE EXIST?
 var device = Safe_Get(media, ["devices", type, id], false);

 // IF IT DOESN'T EXIST, TRY DEFAULT DEVICE (FIRST ONE IN LIST) FOR THAT DEVICE TYPE
 if(!device)
 {
  var devices = Object.keys(Safe_Get(media, ["devices", type], {}));
  if(devices.length == 0) return false;
  
  var id = devices[0];
  var device = Safe_Get(media, ["devices", type, id], false);
 }
  
 return device;
}




function Media_Devices_OnChange(event)
{
 Media_Devices_List();
}








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          A U D I O                                             //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



function Media_Audio_Duration(src, callback)
{
 var promise = new Promise((resolve, reject) =>
 { 
  var sample = new Audio();	
 	
  sample.oncanplaythrough = 
  function()
  {
   delete sample;
   resolve(sample.duration);
  }
 
  sample.onerror =
  function()
  {
   delete sample;	  
   resolve(-1);
  }
 
  sample.src = src;
  sample.load();
 });
 
 return promise;
}




async function Media_Audio_Record(time, onstart)
{
 var format = "audio/wav";
 
 var promise = new Promise(async(resolve, reject) =>
 {
  try
  {
   var stream   = await navigator.mediaDevices.getUserMedia({audio:true});
  }
  catch(e)
  {
   resolve(false);
   return;
  }
  
  var recorder = new MediaRecorder(stream);			
  var chunks   = [];
				
  // COLLECT AUDIO CHUNKS			
  recorder.addEventListener("dataavailable", 
  function(e)
  {
   chunks.push(e.data);
  });
 
  // WHEN DONE, PUT CHUNKS TOGETHER
  recorder.addEventListener("stop",
  function()
  {
   var output = new Blob(chunks, {"type" : format});
  
   resolve(output);
  });
  
  // START RECORDER
  recorder.start();
  if(onstart) onstart(recorder);
  
  // IF TIMED, AUTOSTOP
  if(time)
  {
   setTimeout(function()
   {
    recorder.stop(); 
   }, time);								   			
  }
  
 });
 
 return promise;
}





function Media_Audio_Play(source, options = {volume:1, loop:false})
{ 
 var audio;
 
 var promise = new Promise((resolve, reject) =>
 {   
  // ASSUME BLOB
  if(typeof source == "object") 
  {
   source = URL.createObjectURL(source);
  }
  
  var player = new Audio();
  audio      = player;
 	
  // AS SOON AS PLAYABLE, PLAY
  player.oncanplaythrough = 
  function()
  {
   player.volume = options["volume"] || 1;
   player.play();
   
   //console.log(player, player.src, player.volume);
  } 
 
  // ON ERROR, CONSIDER IT PLAYED
  player.onerror =
  function(error)
  { 
   resolve();
  }
 
  player.onended =
  function()
  {
   resolve();
   
   if(options["loop"]) 
   {
    if(typeof options["loop"] == "function") options["loop"](player);
	player.play(); 
   }
   else 
   {
	// END
   }
  }	 
  
  // IF THIS AUDIO'S EXISTENCE IS BASED ON THE EXISTENCE OF A SPECIFIC CONTAINER, SET UP AN EVENT TO MANAGE THIS
  if(options["container"])
  {
   player.addEventListener("timeupdate",
   function(event)
   {
	if(!options["container"].isConnected) 
	{
     player.pause(); 
	 player.remove();
	}
   }, true);
  }
  
  
 
  // ASSIGN SOURCE AND LOAD
  player.src = source;
  player.load();
 });


 promise["audio"] = audio;
 return promise;
}








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      S P E E C H                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


// TRIGGER VOICES LISTING
speechSynthesis.onvoiceschanged =
function(event)
{
}




async function Media_Speech_GetVoices()
{
 var promise = new Promise((resolve, reject) =>
 {
  speechSynthesis.onvoiceschanged =
  function()
  {
   var available = speechSynthesis.getVoices();
  
   resolve(available);
  }
  
  var available = speechSynthesis.getVoices();
  if(available.length > 0) resolve(available);
 });
 
 return promise;
}



async function Media_Speech_GetVoice(name)
{
 var name      = name.toLowerCase();
 
 var available = await Media_Speech_GetVoices();
 for(var voice of available)
 {
  if(voice.name.toLowerCase() == name)
  {
   return voice;
  }
 }
}




async function Media_Speech_ListVoices(lang = "")
{
 var voices = [];
 var lang   = lang.toLowerCase();
 
 var available = await Media_Speech_GetVoices();
 for(var voice of available)
 {
  if(!lang || voice.lang.toLowerCase() == lang)
  {
   voices.push(voice);
  }
 }
 
 // PREFER LOCAL TO REMOTE
 voices.sort(
 function(a, b)
 {
  if(a.localService && !b.localService) return -1;
  else
  if(!a.localService && b.localService) return 1;
  else 
  return 0;
 });
 
 return voices;
}




async function Media_Speech_Speak(text, voice, options = {rate:1, pitch:1}, onword)
{
 var promise = new Promise(async(resolve, reject) =>
 {
  // INIT SPEECH
  var speech   = new SpeechSynthesisUtterance();
  speech.text  = text;
  speech.rate  = options["rate"]  || 1;
  speech.pitch = options["pitch"] || 1;


  // ARE WE USING A SPECIFIC VOICE?
  if(typeof voice == "string") 
  {
   // 5 CHARACTERS = LANGUAGE CODE
   if(voice.length == 5)
   {
    speech.lang = voice;
   }
   else
   // MORE THAN 4 CHARACTERS = SPECIFIC VOICE NAME
   {
    speech.voice = await Media_Speech_GetVoice(voice);
	
	// NOT AVAILABLE, RETURN IMMEDIATELY
	if(!speech.voice) resolve();
   }
  }
  else
  {
   speech.voice = voice
  }
  
  
  // ON SPEECH END, RETURN FROM ASYNC FUNCTION
  speech.onend = 
  function()
  {
   resolve();
  }


  // ON WORD SPOKEN
  if(onword)
  {
   speech.onboundary = 
   function(event)
   {
    var segment = text.substr(event.charIndex, event.charLength);
	var time    = event.elapsedTime;
	
    onword(segment, time);
   }
  }
  
  
  // SPEAK
  speechSynthesis.speak(speech)
 });

 return promise;
}







async function Media_Speech_RecognizeCustom(sentences, lang, sample, service, onstartrecord, onendrecord)
{ 
 // IF SAMPLE IS A NUMBER RATHER THAN A BLOB, THEN IT REPRESENTS THE LENGTH OF A SAMPLE TO BE RECORDED
 if(typeof sample == "number")
 {
  var sample = await Media_Audio_Record(sample, onstartrecord);
  if(onendrecord) onendrecord();
 }

 // READ SAMPLE AS FILE
 var data  = await Storage_File_Read(sample);
 
 // PACKAGE QUERY FOR THE RECOGNIZER 
 var query = 
 {
  "binaryData"   : data,
  "fileExtension": "wav",
  "culture"      : lang,
  "sentences"    : sentences
 }
			 
			 
 console.log("recognizing...", query); 
			 
 // CALL SERVICE AND RETURN RESULT
 var response = await Request_Post(service, query, "json");
 
 console.log("response", response);
 
 var index = Safe_Get(response, "indexRecognized", -1);
 if(index == -1) var sentence = false; else var sentence = sentences[index];
 
 var result           = {};
 result["sample"]     = sample;
 result["sentence"]   = sentence;
 result["confidence"] = Safe_Get(response, "confidence", 0);
 
 return result;
} 





async function Media_Speech_Recognize(text, lang, time, controller, onstart)
{
 var promise = new Promise((resolve, reject) =>
 {	
  var recognition = new webkitSpeechRecognition();
  controller = recognition;

  recognition.continuous     = false;
  recognition.interimResults = false;

  recognition.onstart = 
  function()
  {
   if(onstart) onstart();	   
   
   if(time) setTimeout(function(){recognition.stop()}, time);	  
  }
  
  recognition.onerror =
  function(error)
  { 
   resolve(error);	
  }
  
  recognition.onresult = 
  function(event)
  {
   var result = event.results;	  
    
   // *TODO* PROCESS THE RESULT AND MAKE IT MATCH THE STRUCTURE OF OUR CUSTOM RECOGNIZER 
	   
   resolve(result);	
  }
  
  recognition.start();
 });

 return promise;
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                            D S P                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Audio_DSP_CreateMeter(context, stream)
{
 var meter = {};
 
 var source   = context.createMediaStreamSource(stream);
 var analyser = context.createAnalyser();
 var node     = context.createScriptProcessor(2048, 1, 1);
 
 meter["source"]   = source;
 meter["analyser"] = analyser;
 meter["node"]     = node;
 
 analyser.smoothingTimeConstant = 0.8;
 analyser.fftSize               = 1024;

 source.connect(analyser);
 meter.analyser.connect(node);
 node.connect(context.destination);
 
 node.onaudioprocess = function() 
 {
  var array = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(array);
  var values = 0;

  var length = array.length;
  for(var i = 0; i < length; i++) 
  {
   values += (array[i]);
  }

  meter.average = (values / length) / 100;
 }

 return meter;
}

