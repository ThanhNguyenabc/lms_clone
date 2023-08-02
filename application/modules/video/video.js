// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         V I D E O                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Video_Load(source)
{
 var video  = await Core_Api("Video_Read", {source});
 var player = UI_Element_Create("video/player");
 
 Core_State_Set("video", "current", video);
 Document_Element_SetObject(player, "video", video);
 
 // SET UP INTERNAL HTML5 PLAYER
 var controller          = UI_Element_Find(player, "video");
 controller.ontimeupdate = Video_OnUpdate;
 Document_Element_SetObject(player,     "controller", controller);
 Document_Element_SetObject(controller, "player",     player);
 
 controller.onended = Video_OnEnd;
 
 
 // SUBTITLES DISPLAY
 var element = UI_Element_Find(player, "subtitles");
 Document_Element_SetObject(player, "display-subtitles", element);
 

 controller.src = video["source"] + "/video.mp4"; 
 
 return player;
}




function Video_Setup(container, player, config = {pause:true, back:true, stop:"", continue:"play", music:true})
{
 Document_Element_SetObject(player, "config", config);
 var video = Document_Element_GetObject(player, "video");
 
 // REARRANGE SUBTITLES
 var lang_content  = config["lang_content"] || "en";
 var lang_user     = config["lang_user"]    || "vn";
 var subtitles     = Safe_Get(video, ["subtitles", lang_content], []);
 var i = 0;
 for(var line of subtitles)
 {
  line["translation"] = Safe_Get(video, ["subtitles", lang_user, i, "text"], "");
  i++;
 }
 video["subtitles"] = subtitles;
 
 
 
 // PURGE VOCAB TERMS
 video["terms"] = video["terms"] || {}; 
 for(var key in video["terms"])
 {
  var purged = Vocabulary_Term_Purge(key);
  
  // REPLACE ITEM BY PURGED KEY VS ORIGINAL KEY
  var item = video["terms"][key];
  delete video["terms"][key];
  video["terms"][purged] = item;
  
  // PRESERVE ORIGINAL KEY INSIDE ITEM
  item["id"] = key;
 }
 var list = Object.keys(video["terms"]);
 
 
 // LINK TERMS
 for(var line of subtitles)
 {
  var analyzed     = String_Analysis_Categorize(line["text"], list);
  line["analysis"] = analyzed;
  line["terms"]    = list;
  
  // DETERMINE IF LINE CONTAINS IMPORTANT CONTENT
  for(var block of analyzed)
  { 
   if(block["type"] == "term")
   {
	line["important"] = true;
	break;
   }
  }
  
  var displaymode     = config["subtitles"] || "none";
  line["displaymode"] = displaymode;
 }
 
 
 
 
 // CONTROLS
 
 // PLAY
 var button           = UI_Element_Find(player, "control-play");
 //button.style.display = "none";
 button.onclick       = Video_Control_Play;
 Document_Element_SetObject(button, "player", player);
 
 // PAUSE
 var button           = UI_Element_Find(player, "control-pause");
 button.style.display = "none";
 button.onclick       = Video_Control_Pause;
 Document_Element_SetObject(button, "player", player);
 
 // BACK
 var button           = UI_Element_Find(player, "control-back");
 button.style.display = "none";
 button.onclick       = Video_Control_Back;
 Document_Element_SetObject(button, "player", player);
 
 // REDO
 var button           = UI_Element_Find(player, "control-redo");
 button.style.display = "none";
 button.onclick       = Video_Control_Redo;
 Document_Element_SetObject(button, "player", player);
 
 // INPUT
 var input      = UI_Element_Find(player, "control-input");
 input.onchange = Video_Control_Input;
 Document_Handler_EnterKey(input, Video_Control_Input);
 
 // RECORD
 var record     = UI_Element_Find(player, "speak");
 record.onclick = Video_Control_Record;
 Document_Element_SetObject(record, "player", player);
 
 
 // STATE
 var state = [];
 Document_Element_SetObject(player, "state", state);
 
 
 // DISPLAY
 container.innerHTML = "";
 container.appendChild(player);
 
 
 // START MUSIC, MUFFLED (VOLUME 0.1)
 if(config["music"])
 {
  var source = Safe_Get(video, ["info", "soundtrack", "source"]);
  if(source)
  {
   state["soundtrack-volume"] = 0.75;
   source                     = Resources_URL("music/" + source);	  
   state["soundtrack"]        = Media_Audio_Play(source, {volume:0.1, loop:true, container:player});
  }
 }
 
 
 // ATTRACT ATTENTION ON PLAY BUTTON
 Document_Element_Animate(UI_Element_Find(player, "control-play"), "heartBeat 2s 2"); 
}




function Video_OnUpdate(event)
{
 var controller = event.srcElement;
 
 var player     = Document_Element_GetObject(controller, "player");
 var video      = Document_Element_GetObject(player, "video");
 var config     = Document_Element_GetObject(player, "config");
 var state      = Document_Element_GetObject(player, "state");
 
 var subtitles  = video["subtitles"];
 var display    = Document_Element_GetObject(player, "display-subtitles");
 
 
 // STOP IMMEDIATELY IF FOR ANY REASON THE UPDATE MESSAGE HAPPENS WHILE THE VIDEO IS ACTUALLY PAUSED
 if(controller.paused) return;
 
 
 
 // GET CURRENT SUBTITLES LINE
 var current_line      = Video_Line_Current(subtitles, controller.currentTime * 1000);
 state["current-line"] = current_line;  
   
 // IF WITHIN A SCRIPT LINE
 if(current_line)
 {  
  if(!state["last-line"] || state["last-line"] != current_line)
  {
   // IF CONFIGURED TO STOP BEFORE EACH LINE, THEN STOP
   if(config["stop"] == "before")
   {
    Video_Pause(player);
	
	Video_Line_Display(current_line, display);
   
    state["last-line"] = current_line;
    return;
   }
   
  }
 }
 else
 // IF BETWEEN LINES
 {
  // IF THERE WAS A LAST LINE, IT MEANS WE A LINE HAS JUST ENDED
  if(state["last-line"])
  {
   
   // IF CONFIGURED TO STOP AFTER EACH LINE, THEN STOP
   if(config["stop"] == "after")
   {
    Video_Pause(player);
       
    state["last-line"] = false;
    return;
   }
   
  }
  else
  // IF NO PRIOR LAST LINE, THEN WE ARE STILL BEFORE THE VERY FIRST. NOTHING TO DO 
  {
  }
 }


 // IF NO CURRENT LINE, CLEAR THE DISPLAY
 if(!current_line)
 {
  display.innerHTML = "";
 }
 
 
 // IF LINE HAS CHANGED, SET LAST LINE TO THIS ONE
 if(current_line && state["last-line"] != current_line) 
 {  
  // IF NEW CURRENT LINE IS IMPORTANT AND CONFIG SAYS TO STOP ON IMPORTANT LINES, STOP
  if(current_line["important"] && config["stop"] == "important")
  {
   Video_Pause(player);	  
  }

  Video_Line_Display(current_line, display);
  
  state["last-line"] = current_line; 
 }
}




function Video_OnEnd(event)
{
 var controller = event.srcElement;
 
 var player     = Document_Element_GetObject(controller, "player");
 var video      = Document_Element_GetObject(player, "video");
 var config     = Document_Element_GetObject(player, "config");
 var state      = Document_Element_GetObject(player, "state");
 
 if(config["onend"]) config["onend"](player);
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         L I N E S                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function Video_Line_DisplayNone(line)
{
 return [];
}



// TEXT AS SINGLE BLOCK
function Video_Line_DisplayPlain(line)
{
 var elements = [];
 
 var text    = line["text"];
 var element = UI_Element_Create("video/block-text", {text});
 elements.push(element);
 
 
 return elements;
}


// TEXT AS SINGLE BLOCK, WITH TRANSLATION
function Video_Line_DisplayBoth(line)
{
 var elements = []; console.log(line);
 
 var text        = line["text"];
 var translation = line["translation"]; 
 var element     = UI_Element_Create("video/block-both", {text, translation});
 elements.push(element);
 
 
 return elements;
}



// TEXT AS A SINGLE BLOCK, WITH VISUAL/AUDIO FEEDBACK
function Video_Line_DisplayFeedback(line)
{
 var elements = [];
 
 var text    = line["text"];
 var element = UI_Element_Create("video/block-text", {text});
 elements.push(element);
 
 if(line["match"]) 
 {
  Handler_Element_Feedback(element, "good", {permanent:true});
 }
 else
 {
  Handler_Element_Feedback(element, "bad", {permanent:true});
 }
 
 return elements;
}




// TEXT AS DISTINCT BLOCKS
function Video_Line_DisplayBlocks(line)
{
 var elements = [];
 
 for(var block of line["analysis"])
 {  
  var text = block["text"];
   
  if(text.trim())
  {
   var element = UI_Element_Create("video/block-text", {text});
   elements.push(element);
  }  
 }
 
 return elements;
}




// TEXT AS DISTINCT BLOCKS, WITH VISUAL/AUDIO FEEDBACK
function Video_Line_DisplayMatches(line)
{
 var elements = [];
 
 for(var block of line["analysis"])
 {  
  var text = block["text"];
   
  if(text.trim())
  {
   var element = UI_Element_Create("video/block-text", {text});
   elements.push(element);
   
   if(block["match"]) 
   {
	Handler_Element_Feedback(element, "good", {permanent:true, silent:true});
   }
   else
   {
	Handler_Element_Feedback(element, "bad", {permanent:true, silent:true});
   }
  }  
 }
 
 return elements;
}




// TEXT AS DISTINCT BLOCKS, WITH INTERACTIVE VOCABULARY
function Video_Line_DisplayAnalysis(line)
{
 var elements = [];
 
 for(var block of line["analysis"])
 {
  var type = block["type"];
  var text = block["text"];
  
  if(text.trim())
  {
   var element = UI_Element_Create("video/block-" + type, {text});
   Document_Element_SetObject(element, "block", block);
   
   if(type == "term") 
   {
	element.onclick = Video_Line_DisplayTerm;
   }
   
   elements.push(element);
  }
 
 }
 
 return elements;
}




function Video_Line_Display(line, display, mode)
{
 if(!mode) var mode = line["displaymode"];
 
 var displayer = Safe_Function("Video_Line_Display" + String_Capitalize_Initial(mode)); 
 var elements  = displayer(line);
  
 display.innerHTML = "";
 display.append(...elements);
}




async function Video_Line_DisplayTerm(event)
{
 var element = event.currentTarget;
 var block   = Document_Element_GetObject(element, "block");
 
 var sticker = Document_Element_GetObject(element, "sticker");
 if(sticker) 
 {
  sticker.remove();
  Document_Element_SetObject(element, "sticker", false);
 }
 else
 {
  // CLEAN ALL OTHER STICKERS FIRST 
  UI_Stickers_Clean();
  
  // ADD VOCAB STICKER
  
  // FIND WHAT VOCAB ITEM THIS TEXT CORRESPONDS TO
  var video    = Core_State_Get("video", "current");
  var terms    = video["terms"];
  var vocab_id = terms[block["text"].trim().toLowerCase()];
  
  var sticker = await Vocabulary_Term_Sticker(vocab_id, element, "top", "standard", 
  {
   side_short: 10, 
   side_long:  20, 
   color:      "var(--color-accented)", 
   z:          10000,
   translate:  true,
   listen:     true
  }); 
  
  
  Document_Element_SetObject(element, "sticker", sticker);
 }
}





function Video_Line_Current(lines, time)
{
 for(var line of lines)
 {
  if(time > line["start"] && time < line["end"])
  {
   return line;
   break;
  }	  
 }
 
 return false;
}




function Video_Line_Previous(lines, time)
{
 var previous = false;

 for(var line of lines)
 {
  if(line["end"] < time && (!previous || previous["end"] < line["end"]))
  {
   previous = line; 
  }	  
 }
 
 return previous;
}









// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       C O M M A N D S                                          //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function Video_Play(player)
{
 var config = Document_Element_GetObject(player, "config");
 
 UI_Element_Find(player, "curtain").style.visibility = "hidden";
 UI_Element_Find(player, "video").play();
 Video_SetVolume(player, 1);
 
 // HIDE PLAY BUTTON
 UI_Element_Find(player, "control-play").style.display  = "none";
 
 // IF ALLOWED TO PAUSE FREELY, ACTIVATE PAUSE BUTTON UPON PLAY
 if(config["pause"])
 {
  UI_Element_Find(player, "control-pause").style.display = "flex";
 }
 
 // HIDE BACK BUTTON
 UI_Element_Find(player, "control-back").style.display = "none";
 
 // HIDE REDO BUTTON
 UI_Element_Find(player, "control-redo").style.display = "none";
 
 // HIDE SPEAK BUTTON
 UI_Element_Find(player, "speak").style.display = "none";
}





async function Video_Pause(player)
{
 var config = Document_Element_GetObject(player, "config");
 var state  = Document_Element_GetObject(player, "state");
 
 UI_Element_Find(player, "video").pause();
 UI_Element_Find(player, "curtain").style.visibility = "visible";
 Video_SetVolume(player, 0.1);
 
 // CONTINUE OPTIONS
 switch(config["continue"])
 {  
  case "play":
	// JUST HIDE PAUSE AND SHOW PLAY BUTTON
	UI_Element_Find(player, "control-play").style.display  = "flex";
	UI_Element_Find(player, "control-pause").style.display = "none";
  break;
  
  
  case "type":
  	// HIDE SUBTITLES
	UI_Element_Find(player, "subtitles").style.display = "none";
	
	
    // SHOW INPUT FIELD TO ALLOW TYPING
	UI_Element_Find(player, "type").style.display = "flex";
	
	var input = UI_Element_Find(player, "control-input");
	
	Document_Element_SetObject(input, "player", player);
	Document_Element_SetObject(input, "line",   state["last-line"]);
	input.focus();
  break;
  
  
  case "speak":
	//HIDE SUBTITLES
	if(config["subtitles"] == "none") UI_Element_Find(player, "subtitles").style.display = "none";
	
	// SHOW SPEAK FIELD TO ALLOW RECORDING
	var speak = UI_Element_Find(player, "speak");
	speak.style.display     = "flex";
	
	if(config["stop"] == "before") var line = state["current-line"]; else var line = state["last-line"]; 
	
	Document_Element_SetObject(speak, "line", line);
  break;
 }
 
 
 
 // WHEN PAUSED, ALSO ENABLE THE BACK BUTTON, IF ALLOWED
 if(config["back"])
 {
  UI_Element_Find(player, "control-back").style.display = "flex";
 }
}




function Video_Back(player)
{
 var state      = Document_Element_GetObject(player, "state");
 var video      = Document_Element_GetObject(player, "video");
 var config     = Document_Element_GetObject(player, "config");
 var controller = Document_Element_GetObject(player, "controller");
 var display    = Document_Element_GetObject(player, "display-subtitles");
 
 if(!controller.paused) Video_Pause(player);
 display.innerHTML = "";
 
 
 // FIND PREVIOUS LINE
 var line           = Video_Line_Current(video["subtitles"],  controller.currentTime * 1000);
 if(!line) var line = Video_Line_Previous(video["subtitles"], controller.currentTime  * 1000);
 
 
 // INVALIDATE LAST LINE
 state["last-line"] = false;
 
 
 // GO BACK
 if(line)
 {
  controller.currentTime = ((line["start"] - 250) / 1000);
 }
 else
 {
  controller.currentTime = 0;
 }
 
}



function Video_Redo(player)
{
 var state      = Document_Element_GetObject(player, "state");
 var video      = Document_Element_GetObject(player, "video");
 var config     = Document_Element_GetObject(player, "config");
 var controller = Document_Element_GetObject(player, "controller");
 var display    = Document_Element_GetObject(player, "display-subtitles");
 
 display.innerHTML = "";
 
 
 // FIND PREVIOUS LINE
 var line = state["redo"];
 controller.currentTime = ((line["start"] - 250) / 1000);
 
 // IF BY CONFIG WE NEED TO STOP BEFORE EACH LINE, UPON REDOING A LINE WE MUST INVALIDATE LAST-LINE
 if(config["stop"] == "before") state["last-line"] = false;
 
 // HIDE SPEAK BUTTON
 UI_Element_Find(player, "speak").style.display = "none";
 
 UI_Element_Find(player, "control-redo").style.display = "none";
 Video_Play(player);
}




function Video_SetVolume(player, volume)
{
 var state = Document_Element_GetObject(player, "state");
 var audio = Safe_Get(state, ["soundtrack", "audio"]);
 
 if(!audio) return;

 if(!volume) var volume = Safe_Get(state, ["soundtrack-volume"], 0);
 audio["volume"] = volume;
}








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     C O N T R O L S                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function Video_Control_Play(event)
{
 var button = event.currentTarget;
 var player = Document_Element_GetObject(button, "player");
 
 // A MANUAL PLAY CAUSES SOME ELEMENTS TO RESET
 UI_Element_Find(player, "control-input").value = "";
 
 Video_Play(player);
}




function Video_Control_Pause(event)
{
 var button = event.currentTarget;
 var player = Document_Element_GetObject(button, "player");

 Video_Pause(player);
}



function Video_Control_Back(event)
{
 var button = event.currentTarget;
 var player = Document_Element_GetObject(button, "player");

 Video_Back(player);
}



function Video_Control_Redo(event)
{
 var button = event.currentTarget;
 var player = Document_Element_GetObject(button, "player");

 Video_Redo(player);
}




async function Video_Control_Record(event)
{
 var button  = event.currentTarget;
 var icon    = UI_Element_Find(button, "control-record");
 var player  = Document_Element_GetObject(button, "player");
 var state   = Document_Element_GetObject(player, "state");
 var line    = Document_Element_GetObject(button, "line");
 var display = Document_Element_GetObject(player, "display-subtitles");
 
 state["redo"] = line;
 
 
 // FIRE UP SPEECH RECOGNITION
 var result = await Handler_Speech_Recognition([line["text"]], "en", button, {icon, onend:
 function(result)
 {
 }});
 
 line["match"] = (result["confidence"] >= Module_Config("video", "speech-good", 0.67));
 
 
 // HIDE INPUT
 UI_Element_Find(player, "speak").style.display = "none";
 
 // SHOW FEEDBACK
 UI_Element_Find(player, "subtitles").style.display = "flex";
 Video_Line_Display(line, display, "feedback");
 
 // SHOW PLAY AND REDO BUTTONS
 UI_Element_Find(player, "control-play").style.display = "flex";
 UI_Element_Find(player, "control-redo").style.display = "flex";
}




function Video_Control_Input(event)
{
 var input   = event.currentTarget;
 var player  = Document_Element_GetObject(input,  "player");
 var state   = Document_Element_GetObject(player, "state");
 var line    = Document_Element_GetObject(input,  "line");
 var display = Document_Element_GetObject(player, "display-subtitles");
 
 
 var target_text = line["analysis"];
 var guess_text  = String_Analysis_Categorize(input.value, line["terms"]);
 String_Analysis_StructuredMatch(target_text, guess_text);
 
 UI_Element_Find(player, "type").style.display      = "none";
 UI_Element_Find(player, "subtitles").style.display = "flex";
 
 Video_Line_Display(line, display, "matches");
 state["redo"] = line;
 
 // SHOW PLAY AND REDO BUTTONS
 UI_Element_Find(player, "control-play").style.display = "flex";
 UI_Element_Find(player, "control-redo").style.display = "flex";
 
 //Video_Play(player);
}
