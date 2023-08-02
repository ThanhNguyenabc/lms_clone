// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                    W H I T E B O A R D                                         //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Whiteboard_Create(container, events = {}, options = {fps:24, model:"whiteboard"})
{
 var whiteboard = UI_Element_Create("whiteboard/" + options["model"] || "whiteboard");
 container.appendChild(whiteboard);
  
 var canvas           = UI_Element_Find(whiteboard, "canvas");
 var handle           = canvas.getContext("2d");
 var size             = Document_Element_Size(canvas);
 handle.canvas.width  = size["width"];
 handle.canvas.height = size["height"];
 
 Document_Element_SetObject(whiteboard, "canvas", canvas);
 Document_Element_SetObject(whiteboard, "handle", handle);
 Document_Element_SetObject(whiteboard, "events", events);
 
 Whiteboard_SetPen(whiteboard);

 
 whiteboard.onmousedown = Whiteboard_Draw_Start;
 whiteboard.onmouseup   = Whiteboard_Draw_End;
 whiteboard.onmousemove = Whiteboard_Draw_Draw;
 
 //var fps                = options["fps"] || 24;
 //whiteboard.onmousemove = Function_ThrottleEvent(Whiteboard_Draw_Draw, 1000 / fps);
 
 var container = UI_Element_Find(whiteboard, "tools");
 var pens      = Core_Data_Page("whiteboard/pens");
 for(var id in pens)
 {
  var pen                   = pens[id];
  
  var tip                   = UI_Element_Create("whiteboard/tip-" + pen["type"]);
  tip.style.position        = "relative";
  tip.style.width           = "16px";
  tip.style.backgroundColor = pen["color"];
  tip.style.outline         = "solid 2px";
  tip.style.outlineColor    = "var(--color-dark)";
  tip.title                 = UI_Language_Object(pen);
  
  Document_CSS_SetClass(tip, "style-clickable");
  Document_CSS_SetClass(tip, "style-selectable");

  Document_Element_SetData(tip, "name", id);
  Document_Element_SetObject(tip, "whiteboard", whiteboard);
  
  tip.onclick = 
  function(event)
  {
   var element    = event.currentTarget;
   var name       = Document_Element_GetData(element, "name");
   var whiteboard = Document_Element_GetObject(element, "whiteboard");
   
   Media_Audio_Play(Resources_URL("sounds/click.mp3"));
   Document_Element_Animate(element, "rubberBand 0.5s");
   Whiteboard_SetPen(whiteboard, name);
  }
  
  container.appendChild(tip);
 }
 
 return whiteboard;
}



function Whiteboard_Canvas_Store(whiteboard, name)
{
 var canvas = Document_Element_GetObject(whiteboard, "canvas");
 var image  = canvas.toDataURL("image/png");
 
 Document_Element_SetObject(whiteboard, name, image);
 
 return image;
}



function Whiteboard_Canvas_Recall(whiteboard, name)
{
 var data = Document_Element_GetObject(whiteboard, name);
 if(!data) return;
  
 var handle   = Document_Element_GetObject(whiteboard, "handle");
 var image    = new Image();
 image.onload =
 function()
 {  
  handle.clearRect(0, 0, handle.canvas.width, handle.canvas.height);
  handle.drawImage(image, 0, 0);
 }
 
 image.src  = data; 
}



function Whiteboard_Canvas_Erase(whiteboard)
{
 var handle = Document_Element_GetObject(whiteboard, "handle");
 handle.clearRect(0, 0, handle.canvas.width, handle.canvas.height);
 
 
 // ONERASE
 var events = Document_Element_GetObject(whiteboard, "events");
 var f      = Safe_Get(events, "onerase", false);
 if(f) f(whiteboard);
}




function Whiteboard_SetPen(whiteboard, set = {type:"round", size:8, color:"black", mode:"source-over"})
{
 if(typeof set == "string")
 {
  var pens = Core_Data_Page("whiteboard/pens");
  var set  = pens[set] || {};
 }
	
 var pen = Document_Element_GetObject(whiteboard, "pen") || {};
 Object.assign(pen, set);
 
 Document_Element_SetObject(whiteboard, "pen", pen);
 
 var tip = UI_Element_Create("whiteboard/tip-" + pen["type"]);
 Document_Element_SetObject(whiteboard, "tip", tip);
 tip.style.width           = pen["size"] + "px";
 tip.style.backgroundColor = pen["color"];
 
 var overlay       = UI_Element_Find(whiteboard, "overlay");
 overlay.innerHTML = "";
 overlay.appendChild(tip);
 
 var handle     = Document_Element_GetObject(whiteboard, "handle");
 handle.lineCap = pen["type"];
 
 handle.globalCompositeOperation = pen["mode"];
}


 
 
function Whiteboard_Draw_Start(event)
{
 var whiteboard = event.currentTarget;
 
 Document_Element_SetData(whiteboard, "status", "draw");

 var rect     = whiteboard.getBoundingClientRect();
 var pointer  = {};
 pointer["x"] = event.clientX - rect.left;
 pointer["y"] = event.clientY - rect.top;
 
 Document_Element_SetObject(whiteboard, "pointer", pointer);
 
 
 // ONDRAWSTART
 var events = Document_Element_GetObject(whiteboard, "events");
 var f      = Safe_Get(events, "ondrawstart", false);
 if(f) f(whiteboard);
}

 
 
 
function Whiteboard_Draw_End(event)
{
 var whiteboard = event.currentTarget;
 
 Document_Element_SetData(whiteboard, "status", "");
 
 
 // ONDRAWEND
 var events = Document_Element_GetObject(whiteboard, "events");
 var f      = Safe_Get(events, "ondrawend", false);
 if(f) f(whiteboard);
}

 
 
 
 
function Whiteboard_Draw_Draw(event)
{  
 var whiteboard = event.currentTarget || event.srcElement;
 if(!whiteboard)
 {
  //event.preventDefault();
  return;
 }
 

 
 var tip  = Document_Element_GetObject(whiteboard, "tip");
 var size = Document_Element_Size(tip);
 var rect = whiteboard.getBoundingClientRect();
 
 var left = (event.clientX - rect.left - (size["width"] / 2))  + "px";
 var top  = (event.clientY - rect.top  - (size["height"] / 2)) + "px";
 
 tip.style.left = left;
 tip.style.top  = top;
 
 
 var status = Document_Element_GetData(whiteboard, "status");
 
 switch(status)
 {
  case "draw":
	var handle  = Document_Element_GetObject(whiteboard, "handle");
	var pointer = Document_Element_GetObject(whiteboard, "pointer");
    var pen     = Document_Element_GetObject(whiteboard, "pen");
     
	handle.beginPath();
	handle.strokeStyle = pen["color"];
	handle.lineWidth   = pen["size"];
	handle.moveTo(pointer["x"], pointer["y"]);
 
	pointer["x"] = event.clientX - rect.left;
	pointer["y"] = event.clientY - rect.top;
 
	handle.lineTo(pointer["x"], pointer["y"]);
	handle.stroke();
  break;
 }
 
 
 // ONDRAW
 var events = Document_Element_GetObject(whiteboard, "events");
 var f      = Safe_Get(events, "ondraw", false);
 if(f) f(whiteboard);
}