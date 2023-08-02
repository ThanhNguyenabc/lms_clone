// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         S T R E A M                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Course_Class_DisplayStream(content, state)
{
 var data          = Core_State_Get("course", ["class-data"]);
 var state         = state || Core_State_Get("course", ["class-state"]);
 
 Core_State_Set("course", ["content-display"], content);
 
 content.innerHTML = "";
 
 // SPACER
 var element              = UI_Element_Create("core/separator-horizontal-minimal");
 element.style.visibility = "hidden";
 content.appendChild(element);
 
 
 // IF NOT STREAMING YET, CHECK AGAIN ONCE EVERY MINUTE
 if(!await Course_Class_CheckStream())
 {
  var check = setInterval(Course_Class_CheckStream, 60000);
  Core_State_Set("course", "streaming-check", check);
 }
}



async function Course_Class_CheckStream()
{
 var data     = Core_State_Get("course", ["class-data"]);
 var class_id = Safe_Get(data, ["class", "id"]);
 var display  = Core_State_Get("course", ["content-display"]);
 
 var status = await Core_Api("Class_Streaming", {class_id});
	
 var gateway = UI_Element_Create("course/class-stream-gateway");	
 UI_Element_Find(gateway, "title").innerHTML = UI_Language_String("course/stream", status + " " + "title");
 UI_Element_Find(gateway, "text").innerHTML  = UI_Language_String("course/stream", status + " " + "text");	
 
 if(status == "streaming")
 {
  // STOP CHECKING
  var check = Core_State_Get("course", "streaming-check");
  clearInterval(check);


  // SETUP AND SHOW "ENTER" BUTTON
  var button           = UI_Element_Find(gateway, "button");
  button.innerHTML     = UI_Language_String("course/stream", "button enter");
  button.style.display = "flex";
  
  var title      = UI_Element_Find(gateway, "title");
  title.style.color = "var(--color-alert)";
  Document_Element_Animate(title, "flash 1.5s ease-in-out infinite");
  
  button.onclick =
  async function(event)
  {
   var data = Core_State_Get("course", ["class-data"]);
   var url  = Safe_Get(data, ["class", "classrom_url"], "");
   
   window.open(url, "classroom", "popup, fullscreen=yes");
  }
  
  
  // DISPLAY AND ALERT
  gateway.appendChild(button);
  
  display.innerHTML = "";
  display.appendChild(gateway);
 
  Media_Audio_Play(Resources_URL("sounds/alert.mp3"));
  
  return true;
 }
 else
 {
  // HIDE "ENTER" BUTTON
  UI_Element_Find(gateway, "button").style.display = "none";
  
  
  // DISPLAY
  display.innerHTML = "";
  display.appendChild(gateway);
 
  return false;
 }
 
}