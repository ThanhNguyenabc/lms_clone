// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      P R E S E N T                                             //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Classroom_Present()
{
 var presentation = Core_State_Get("classroom", ["presentation"]);
 
 
 // FLATTEN
 var body = UI_Element_Find("module-body");
 Document_CSS_PurgeClasses(body, "padding");
 
 
 // DISPLAY INITIAL SLIDE
 var display = UI_Element_Find("presentation-display");
 Presentation_Assign(presentation, display, Classroom_Present_DisplayEventHandler);
 
 var slide_id = Client_Location_Parameter("slide");
 var slide    = false;
 
 if(slide_id) 
 {
  // FIND ID
  slide = Presentation_Slide_Find(presentation, slide_id);
  
  // NO ID FOUND? TRY A DIRECT INDEX
  if(!slide) var slide = presentation["slides"][slide_id];  
 }
 
 
 // NO INITIAL SLIDE YET? DEFAULT TO SLIDE 0
 if(!slide) var slide = presentation["slides"][0];
 
 Classroom_Present_SetSlide(slide);
 
 
 // SET SWITCHES
 UI_Element_Find("switch-fullscreen").onclick = Classroom_Present_GoFullscreen;
 UI_Element_Find("switch-whiteboard").onclick = Classroom_Present_ToggleWhiteboard;
 UI_Element_Find("switch-eraser").onclick     = Classroom_Present_EraseWhiteboard;
 UI_Element_Find("switch-timer").onclick      = Classroom_Present_Timer;
 
 // POINTER 
 var container = UI_Element_Find(body, "presentation-desktop");
 container.addEventListener("mousemove", Classroom_Present_Pointer); 
 
 
 // WHITEBOARD
 var layer      = Classroom_Present_GetLayer("whiteboard");
 var whiteboard = Whiteboard_Create(layer);
 Core_State_Set("classroom", "whiteboard", whiteboard);


 // KEYBOARD HANDLER
 Input_Keyboard_Assign(document.body, Classroom_Present_KeyboardHandler);
}










// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                        L A Y E R S                                             //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//




function Classroom_Present_GetLayer(layer)
{
 var element = UI_Element_Find("layer-" + layer);   
 
 return element;
}




function Classroom_Present_ShowLayer(layer)
{
 if(typeof layer == "string") var layer = Classroom_Present_GetLayer(layer);
 
 layer.style.display = "flex";
 layer.onclick       = Classroom_Present_HideLayer;
}





function Classroom_Present_HideLayer(event, name)
{
 if(event)
 {
  // PROCESS THE EVENT ONLY IF THE LAYER ITSELF IS CLICKED
  if(event.srcElement != event.currentTarget) return;
  var layer = event.currentTarget;
 }
 else
 { 
  var layer = Classroom_Present_GetLayer(name);
  if(!layer) return;
 }
	 
 
 // IF SET TO AUTOHIDE, HIDE
 if(layer.getAttribute("erase")) layer.style.display = "none";
 
 // IF SET TO AUTOCLEAN, CLEAN
 if(layer.getAttribute("erase")) layer.innerHTML = "";
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         T I M E R                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Classroom_Present_StartTimer(duration)
{
 if(Classroom_Present_TimerRunning()) Classroom_Present_StopTimer();
 
 var layer       = Classroom_Present_GetLayer("timer");
 var timer       = UI_Element_Create("classroom/timer");
 layer.appendChild(timer);

 Core_State_Set("classroom", ["timer", "display"],  timer); 
 Core_State_Set("classroom", ["timer", "start"],    Time_Now()); 
 Core_State_Set("classroom", ["timer", "duration"], duration * 1000);
	
 var thread = setInterval(Classroom_Present_ProcessTimer, 1000);
 Core_State_Set("classroom", ["timer", "thread"],   thread); 
 
 Classroom_Present_ProcessTimer();
 Classroom_Present_ShowLayer("timer");
 
 Media_Audio_Play(Resources_URL("sounds/pop.mp3"));
 Document_Element_Animate(timer, "rubberBand 1.5s linear 1");
}



async function Classroom_Present_ProcessTimer()
{  
 // MODULE CHANGED? STOP TIMER
 if(Core_State_Get("core", "module") != "classroom")
 { 
  Classroom_Present_StopTimer();
  return;
 }
 
 
 var start         = Core_State_Get("classroom", ["timer", "start"]);
 var duration      = Core_State_Get("classroom", ["timer", "duration"]);
 var display       = Core_State_Get("classroom", ["timer", "display"]);
 
 var elapsed       = Time_Now() - start;
 var time          = Math.floor((duration - elapsed) / 1000);
 
 if(elapsed >= duration)
 {
  Classroom_Present_StopTimer(3);
 }
 else
 {
  display.innerHTML = Time_Seconds_ToTimecode(time);
 }
 
}


async function Classroom_Present_StopTimer(attention)
{
 var thread = Core_State_Get("classroom", ["timer", "thread"]);
 if(thread) clearInterval(thread);
 Core_State_Set("classroom", ["timer", "thread"], false);  
 

 var layer = Classroom_Present_GetLayer("timer");
 if(attention && layer && layer.style.display != "none")
 {
  var display  = Core_State_Get("classroom", ["timer", "display"]);
  
  for(var i = 0; i < attention; i++)
  {
   Media_Audio_Play(Resources_URL("sounds/bell.mp3"));
   await Document_Element_Animate(display, "tada 1.5s linear 1");
   await Client_Wait(0.250);
  }
 }
 
 Classroom_Present_HideLayer(false, "timer");
}




async function Classroom_Present_TimerRunning()
{
 var thread = Core_State_Get("classroom", ["timer", "thread"]);
 
 return thread;
}




async function Classroom_Present_TimerPopup()
{
 var picture  = Resources_URL("images/cover-stopwatch.jpg");
 var title    = UI_Language_String("classroom", "popup timer title");
 var subtitle = UI_Language_String("classroom", "popup timer subtitle");
 
 var options  = UI_Language_Options("classroom/timer");
 options      = [{text:"", value:false}, ...options];

 var duration = await UI_Popup_Select(title, subtitle, picture, options);
 return duration;
}



async function Classroom_Present_Timer(event)
{
 var duration = await Classroom_Present_TimerPopup();

 Classroom_Present_TriggerEvent("timer", duration);
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      S L I D E S                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



function Classroom_Present_SelectSlide(event)
{
 var presentation = Core_State_Get("classroom", ["presentation"]);
 
 var element      = event.currentTarget;
 var slide        = Document_Element_GetObject(element, "slide");
 var index        = presentation["slides"].indexOf(slide); 

 Classroom_Present_EventHandler({c:"slide", d:index});
}





function Classroom_Present_ResetSlide(item)
{
 var presentation = Core_State_Get("classroom", ["presentation"]);
 var slide        = Document_Element_GetObject(item, "tag");
 var index        = presentation["slides"].indexOf(slide); 
 
 Classroom_Present_EventHandler({c:"reset", d:index});
}









// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                            M I S C                                             //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Classroom_Present_TriggerEvent(command, data)
{
 Classroom_Present_EventHandler({c:command, d:data});
}



async function Classroom_Present_GoFullscreen()
{
 document.onfullscreenchange = 
 function(event)
 {
  var presentation = Core_State_Get("classroom", ["presentation"]);
  var display      = UI_Element_Find("presentation-display");
  
  setTimeout(
  function()
  {
   Presentation_Assign(presentation, display, Classroom_Present_DisplayEventHandler)
  }, 
  125);
 
  //document.onfullscreenchange = false;
 }
 
 UI_Element_Find("presentation-desktop").requestFullscreen();
}



function Classroom_Present_Clear()
{
 // WINDOW CURRENTLY SWITCHED TO LINK? THEN RETURN TO SLIDE
 var link = Core_State_Get("classroom", "current-link");
 if(link)
 {
  var url = Classroom_Link();
  window.open(url, "projector", "popup, width="+ screen.width + ", height=" + screen.height + ", fullscreen=yes");
  
  Core_State_Set("classroom", "current-link", false);
 }
 
 else
	 
 // IF NOT SWITCHED TO LINK, THEN JUST REMOVE LAYERS AND MENUS LYING AROUND
 {
  UI_Menu_CloseAll();
 
  Classroom_Present_HideLayer(false, "aux");
  Classroom_Present_HideLayer(false, "timer");
  Classroom_Present_HideLayer(false, "whiteboard");
 }
}




async function Classroom_Present_SetSlide(slide, exit_anim, enter_anim, time)
{ 
 var presentation = Core_State_Get("classroom", ["presentation"]);
 if(!presentation) return;
 
 var current      = Presentation_Slide_Current(presentation);

 if(slide != current && presentation["display"])
 {
  Core_State_Set("classroom", ["changing-slide"], true);
	  
  // EXIT CURRENT SLIDE	  
  if(exit_anim) await Document_Element_Animate(presentation["display"], exit_anim + " " + time + "s ease-in");
  presentation["display"].style.visible = "hidden";
	  
  Presentation_Slide_Display(slide);
  
  
  // WHITEBOARD: STORE CURRENT (IF ANY), ERASE, AND RESTORE NEW
  var whiteboard = Core_State_Get("classroom", "whiteboard");
  if(current)
  {
   Whiteboard_Canvas_Store(whiteboard, current["id"]);
   Whiteboard_Canvas_Erase(whiteboard);
  }
  Whiteboard_Canvas_Recall(whiteboard, slide["id"]);
	 
	 
  // ENTER NEW SLIDE
  if(enter_anim) await Document_Element_Animate(presentation["display"], enter_anim + " " + time + "s ease-out");
  presentation["display"].style.visible = "visible";
	   
  Core_State_Set("classroom", ["changing-slide"], false);
  
  
  // GET SLIDE MENU AND ASSIGN IT TO THE THUMBNAIL
  var menu = slide["menu"];
  UI_Menu_Assign(UI_Element_Find("presentation-desktop"), menu);
  
  
  // DISPLAY SCRIPTS
  Classroom_Present_ShowScripts();
 }
}



function Classroom_Present_Pointer(event)
{  
 var layer   = Classroom_Present_GetLayer("pointer");
 var pointer = UI_Element_Find(layer, "pointer");
 var size    = Document_Element_Size(pointer);
 
 var target  = event.currentTarget;
 var rect    = target.getBoundingClientRect();
 
 var left    = (event.clientX - rect.left - (size["width"] / 2))  + "px";
 var top     = (event.clientY - rect.top  - (size["height"] / 2)) + "px";
 
 pointer.style.left = left;
 pointer.style.top  = top;
}



function Classroom_Present_ToggleWhiteboard(event)
{  
 // CLICK ANIMATION
 var element = event.currentTarget;
 Media_Audio_Play(Resources_URL("sounds/click.mp3"));
 Document_Element_Animate(element, "rubberBand 0.5s");
 
 
 var layer   = Classroom_Present_GetLayer("whiteboard");
 var visible = Document_Element_Toggle(layer, "visibility");
 
 // SHOWING THE WHITEBOARD HIDES POINTER
 /*
 if(visible)
 { 
  layer                  = Classroom_Present_GetLayer("pointer"); 
  layer.style.visibility = "hidden";
 }
 else
 // HIDING THE WHITEBOARD SHOWS POINTER
 {
  layer                  = Classroom_Present_GetLayer("pointer"); 
  layer.style.visibility = "visible";
 }
 */
 
 return visible;
}


function Classroom_Present_EraseWhiteboard(event)
{ 
 // CLICK ANIMATION
 var element = event.currentTarget;
 Media_Audio_Play(Resources_URL("sounds/click.mp3"));
 Document_Element_Animate(element, "rubberBand 0.5s");
 
 // ERASE WHITEBOARD
 var whiteboard = Core_State_Get("classroom", "whiteboard");
 Whiteboard_Canvas_Erase(whiteboard);
 
 // ALSO ERASE DOCUMENTS OR OTHER THINGS THAT MAY BE OPEN
 Classroom_Present_Clear();
}





function Classroom_Present_FixScripts(visibility)
{ 
 var container = UI_Element_Find("presentation-scripts");
 
 if(visibility)
 {
  container.style.opacity = 0.33;
  Document_CSS_UnsetClass(container, "style-evanescent-total");
 }
 else
 {
  container.style.opacity = "";
  Document_CSS_SetClass(container, "style-evanescent-total");
 }
}


function Classroom_Present_ShowScripts()
{
 var presentation = Core_State_Get("classroom", "presentation");
 var slide        = Presentation_Slide_Current(presentation);
 var scripts      = slide["scripts"] || "";
 
 
 var current      = slide["current-script"];
 var list         = UI_List_Items(scripts, "none", 
 // ON ITEM CLICK
 async function(element)
 {
  var item  = Document_Element_GetObject(element, "itemlist-item");

  // EXECUTE SCRIPT
  await Presentation_Script_Execute(item);
  
  // REFRESH
  Classroom_Present_ShowScripts();
 }, 
 
 undefined,
 
 // ITEM CREATION
 function(item)
 {
  caption  = item["name"];
  if(item["executed"]) var icon = "circle-check"; else var icon = "circle";
	  
  var element = UI_Element_Create("classroom/slide-script-item", {caption, icon});
  
  var index = scripts.indexOf(item); console.log(index); console.log(current);
  if(index == current) element.style.backgroundColor = "var(--color-accented)";
     
  
  return element;
 }); 
 
 var container       = UI_Element_Find("presentation-scripts");
 container.innerHTML = "";
 container.appendChild(list);
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      H A N D L E R S                                           //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Classroom_Present_DisplayEventHandler()
{
}



async function Classroom_Present_KeyboardHandler(event)
{
 var presentation = Core_State_Get("classroom", ["presentation"]);
 
 
 // PREVENT KEYBOARD EVENT OVERLAPS
 if(Core_State_Get("classroom", ["changing-slide"])) return;
 if(Core_State_Get("classroom", ["playing-script"])) return;
 
 
 // NEXT SLIDE
 if(Input_Keyboard_Pressed(false, [KEY_RIGHT]))
 {
  Classroom_Present_TriggerEvent("next-slide");
 }
 
 
 // PREV SLIDE
 if(Input_Keyboard_Pressed(false, [KEY_LEFT]))
 {
  Classroom_Present_TriggerEvent("prev-slide");
 }
 
 
 // NEXT SCRIPT FOR CURRENT SLIDE
 if(Input_Keyboard_Pressed(false, [KEY_DOWN]))
 {
  Classroom_Present_TriggerEvent("next-script");
 }
 
 
 // PREV SCRIPT FOR CURRENT SLIDE
 if(Input_Keyboard_Pressed(false, [KEY_UP]))
 { 
  Classroom_Present_TriggerEvent("prev-script");
 }
 
 
 // RESET SLIDE
 if(Input_Keyboard_Pressed(false, [KEY_RCTRL]))
 { 
  var slide = Presentation_Slide_Current(presentation);
  var index = Presentation_Slide_Index(presentation, slide);
  Classroom_Present_TriggerEvent("reset", index);
 }
}



async function Classroom_Present_EventHandler(event)
{   
 var presentation = Core_State_Get("classroom", ["presentation"]);
 console.log(event);
 
 switch(event["c"])
 {
  // SET PRESENTED SLIDE
  case "slide":
	
	Classroom_Present_Clear();	
	
	// INTERPRET EVENT DATA
	var index = event["d"];
    
	// FIND TARGET SLIDE
	var set = Safe_Get(presentation, ["slides", index], false);
    if(!set) return;
	
    // SET NEW SLIDE
	Media_Audio_Play(Resources_URL("sounds/slide.mp3"))
    await  Classroom_Present_SetSlide(set, "bounceOutDown", "bounceInUp", "0.5");	
	
  break;
  
  
  
  
  case "next-slide":
    
	Classroom_Present_Clear();

	var set = Presentation_Slide_Next(presentation);
	
	Media_Audio_Play(Resources_URL("sounds/slide.mp3"))
    await  Classroom_Present_SetSlide(set, "bounceOutLeft", "bounceInRight", "0.5");
	
  break;
  
  
  
  
  
  case "prev-slide":
    
	Classroom_Present_Clear();
	
	var set = Presentation_Slide_Prev(presentation);
	
	Media_Audio_Play(Resources_URL("sounds/slide.mp3"))
    await  Classroom_Present_SetSlide(set, "bounceOutRight", "bounceInLeft", "0.5");

  break;
  
  
  
  
  case "next-script":
  
	var slide = Presentation_Slide_Current(presentation);
    if(!slide) return;
     
    Core_State_Set("classroom", ["playing-script"], true);	

	await Presentation_Slide_NextScript(slide);
	
	// REFRESH SCRIPTS DISPLAY TO REFLECT CURRENT SCRIPT
	Classroom_Present_ShowScripts();
	
	Core_State_Set("classroom", ["playing-script"], false);
		
  
  break;
  
  
  
  
  case "prev-script":
  
	var slide = Presentation_Slide_Current(presentation);
    if(!slide) return;
  
  
    Core_State_Set("classroom", ["playing-script"], true);
		
	await Presentation_Slide_PrevScript(slide);
	
	// REFRESH SCRIPTS DISPLAY TO REFLECT CURRENT SCRIPT
	Classroom_Present_ShowScripts();
	
	Core_State_Set("classroom", ["playing-script"], false);
  
  break;
  
  
  
  // RESET SLIDE
  case "reset":
	
	// INTERPRET EVENT DATA
	var index = event["d"];
    
	// FIND TARGET SLIDE
	
	Media_Audio_Play(Resources_URL("sounds/reset.mp3"))
	var slide = Safe_Get(presentation, ["slides", index], false);
    if(!slide) return;
	
	// RESET
	Classroom_Present_Clear();
	Presentation_Slide_Reset(slide);
  break;
  
  
  
  
  
  // RUN SCRIPT
  case "script":
	
	var data  = event["d"];
	
	// FIND SLIDE
	var slide = Presentation_Slide_Find(presentation, data["slide_id"]);
	if(!slide) return;
	
	// FIND SCRIPT IN SLIDE
	var script = Presentation_Slide_FindScript(slide, data["script_id"]);
	if(!script) return;
	
	Presentation_Script_Execute(script);
	
  break;
  
  
  
  
  
  // TRIGGER ELEMENT CLICK
  case "click":
	
	var data  = event["d"];
	
	// FIND SLIDE
	var slide = Presentation_Slide_Find(presentation, data["slide_id"]);
	if(!slide) return;
	
	// FIND ELEMENT IN SLIDE
	var element = Presentation_Slide_FindElement(slide, data["element_id"]);
	if(!element) return;
	
	element.click();
	
  break;
  
  
  
  
  case "attract":
	
	var data    = event["d"];
	var layer   = UI_Element_Find("layer-attract");    

    
	// RECORD BADGE
	console.log(data);
	Core_Api("Class_Seat_AddBadge", {seat_id:data["seat_id"], badge:data["attract_id"]});
	

	// STUDENT
	var student = Classroom_Find_Student(data["student_id"]);	
	var student_picture = Resources_URL("propic.jpg", "user", student["id"]);
	
	var element = UI_Element_Create("classroom/attract-student", student);
    Document_Image_Load(UI_Element_Find(element, "picture"), [student_picture, "hide"]);
	
	layer.appendChild(element);
	
    Document_Element_Animate(element, "zoomInUp 0.5s");
	await Client_Wait(1);
	await Document_Element_Animate(element, "fadeOutUp 0.5s");
    element.remove();
   
  
	// MESSAGE
	var attract = Core_Data_Section("classroom/attract", data["attract_id"]);  
	var message = UI_Language_Object(attract);
	var sound   = attract["sound"];
	var emoji   = attract["icon"];
	switch(attract["category"])
	{
     case "evaluation":
		var animation = "rubberBand";
	 break;
	 
	 case "request":
		var animation = "tada";
	 break;
	 
	 case "reward":
		var animation = "heartBeat";
	 break;
	 
	 default:
		var animation = "";
	 break;
	}
	var element = UI_Element_Create("classroom/attract-message", {message, emoji});
		
	layer.appendChild(element);
	
    await Document_Element_Animate(element, "zoomInUp 0.5s");
	if(sound) Media_Audio_Play(Resources_URL("sounds/" + sound + ".mp3", "application"));
	await Document_Element_Animate(UI_Element_Find(element, "emoji"), animation + " 1s");
	await Client_Wait(1);
	
	await Document_Element_Animate(element, "fadeOutUp 0.5s");
    element.remove();
	
    layer.innerHTML = "";	
	
  break;
  
  
  
  
  case "vocab":
	
	var data  = event["d"];
	
	// DISPLAY AUX LAYER
	Classroom_Present_Clear();
	var layer   = Classroom_Present_GetLayer("aux");   
	
	var term    = Classroom_Find_Term(data);
	var sticker = await Vocabulary_Term_Display(term, "big");
	layer.appendChild(sticker);
	
	Classroom_Present_ShowLayer(layer);
	
  break;
  
  
  
  case "doc":
  
	var file = event["d"];
	if(Path_Extension(file.toLowerCase()) != "pdf") file = file + ".pdf";
	
	var lesson_id = Core_State_Get("classroom", ["lesson", "source"], ""); 
    var source    = "content/lessons/" + lesson_id + "/documents/" + file;  console.log(source);
	
    // DISPLAY AUX LAYER
	Classroom_Present_Clear();
	var layer     = Classroom_Present_GetLayer("aux");
	
	
	var container = UI_Element_Create("classroom/document-container", {source});
	layer.appendChild(container);
	
	Classroom_Present_ShowLayer(layer);
	
  break;
  
  
  case "timer":
   
	var duration    = event["d"];
	
	if(!duration || isNaN(duration)) 
	{
     Classroom_Present_StopTimer();
	}
	else
	{
	 Classroom_Present_StartTimer(duration);
	}
	
  break;
  
  
  // SHOWS/HIDES A "LASER POINTER" OVER THE PRESENTATION
  case "pointer":
  
    var layer   = Classroom_Present_GetLayer("pointer");
	var visible = Document_Element_Toggle(layer, "visibility");
	
    if(visible)
	{
     Media_Audio_Play(Resources_URL("sounds/switch.mp3"));
	}
	
  break;
  
  
  
  // SHOWS/HIDES A TRANSPARENT WHITEBOARD OVER THE PRESENTATION
  case "wb-toggle":
  
	Classroom_Present_ToggleWhiteboard();

  break;
  
  
  case "wb-erase":
  
	Classroom_Present_EraseWhiteboard();
  
  break;

  
  
  case "clean":
  
	Classroom_Present_Clear();
  
  break;
  
  
  
  case "full":
  
	UI_Element_Find("presentation-desktop").requestFullscreen();
	
  break;
  
  
  case "exit":	
  
	document.exitFullscreen();
	
  break;
  
  
  case "close":
  
	window.close();
 
  break;
  
 }
 
}