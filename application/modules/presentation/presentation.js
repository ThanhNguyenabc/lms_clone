// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                P R E S E N T A T I O N                                         // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

const PRESENTATION_FIELDS_CUSTOM   = ["name", "moveable", "readonly", "visible", "onclick_animation", "onclick_sound", "onshow_animation", "onshow_sound", "onhide_animation", "onhide_sound", "ondrop_animation", "ondrop_sound"];
const PRESENTATION_FIELDS_STANDARD = ["left", "top", "zIndex", "width", "height", "color", "backgroundColor", "borderWidth", "borderStyle", "borderColor", "borderRadius", "padding", "fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "textDecoration", "textAlign", "filter"];
const PRESENTATION_SCRIPT_LINE     = ["time", "element", "command", "params", "sound"];



async function Presentation_Load(url, options = {})
{
 var width  = 1024;
 var height = 768;
 
 var presentation          = {};
 presentation["width"]     = width;
 presentation["height"]    = height;
 presentation["slides"]    = [];
 presentation["path"]      = url; 
 presentation["grid-size"] = 8;
 presentation["mode"]      = Safe_Get(options, ["mode"], "");
 
 
 var data = await Core_Api("Presentation_Read", {path:url});	
 
 
 // RESOURCES
 presentation["resources"] = data["resources"];
 
 
 // PARSE SLIDES
 for(var section of data["slides"])
 {	
  // NEW SLIDE
  var slide = Presentation_Slide_Create(section["id"], section, presentation);
  
  
  // SLIDE ELEMENTS   
  var elements = Object_Subset(section, "element");
	
  var ids = Object.keys(elements);
  for(var id of ids)
  {
   var item    = section[id];
   var element = Presentation_Element_Create(id, item["type"], item, slide);
  }
  
  
  // SLIDE SCRIPTS
  var scripts = Object_Subset(section, "script");
	
  for(var sid in scripts)
  {
   var script = Presentation_Script_Create(sid, scripts[sid], slide);
   
   // ADD ELEMENT
   slide["scripts"].push(script);
  }
    
 }
  
 return presentation;
}





async function Presentation_UpdateResources(presentation)
{
 var source    = presentation["path"];
 var resources = await Core_Api("Presentation_ListResources", {source});
 
 presentation["resources"] = resources;
 
 return;
}




function Presentation_Adjust_OnclickToScripts(presentation)
{
 var slides = presentation["slides"] || [];
 
 for(var slide of slides)
 {
  var elements = slide["elements"];
  
  for(var element of elements)
  {
   var onclick = Document_Element_GetData(element, "onclick_animation");
   if(onclick)
   {
	var uid         = Document_Element_GetData(element, "uid");
	var name        = Document_Element_GetData(element, "name");
	var script      = Presentation_Script_Create(uid, data = {name}, slide);
    
	var line        = Presentation_Script_CreateLine(script);
    line["element"] = uid;
    line["command"] = Document_Element_GetData(element, "onclick_animation");
    line["sound"]   = Document_Element_GetData(element, "onclick_sound");
	
	script["lines"].push(line);
	slide["scripts"].push(script);
	  
  
	Document_Element_SetData(element, "onclick_animation", "");
	Document_Element_SetData(element, "onclick_sound",     "");
   }	   
  }
  
 }
}



function Presentation_Adapt(presentation)
{
 var display  = presentation["display"];
 if(!display) return;
 
 var rect    = display.getBoundingClientRect();
 var scale_x = rect.width  / presentation["width"];
 var scale_y = rect.height / presentation["height"];
 
 //console.log(scale_x, scale_y);
 presentation["scale"] = {x:scale_x, y:scale_y};
 
 for(var slide of presentation["slides"])
 {
  for(var element of slide["elements"])
  {
   Presentation_Element_Reset(element);
  }
 }
}





function Presentation_Assign(presentation, display, handler)
{
 presentation["display"]       = display;
 presentation["current-slide"] = 0;
 presentation["handler"]       = handler;
 
 Document_Element_SetObject(display, "presentation", presentation);
 
 Presentation_Adapt(presentation);
 
 display.draggable   = true;
 display.onclick     = Presentation_Event_Click;
 display.ondblclick  = Presentation_Event_Dblclick;
 display.ondragstart = Presentation_Event_DragStart;
 display.onmouseup   = Presentation_Event_MouseUp;
 display.onmousemove = Presentation_Event_MouseMove;
}








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                           S L I D E S                                          // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Presentation_Slide_Create(id, data, presentation)
{
 var slide             = {};
 
 // IF NO ID DEFINED, TRY TO CREATE A NEW ONE
 if(!id && presentation) var id = Presentation_Slide_NewId(presentation);
 
 slide["id"]           = id;
 slide["header"]       = {};
 slide["elements"]     = [];
 slide["scripts"]      = [];
 slide["presentation"] = presentation;
  
 if(data && data["header"]) Object.assign(slide["header"], data["header"]);

 if(!slide["header"]["name"]) slide["header"]["name"] = "Slide " + id;


 // ADD SLIDE TO PRESENTATION
 if(presentation)
 {
  presentation["slides"].push(slide);
 }

 return slide;
}




async function Presentation_Slide_Reload(path, id, presentation)
{ 
 // CURRENT SLIDE WITH THAT ID
 var slide = Presentation_Slide_Find(presentation, id);
 if(!slide) return;
 
 var index = Presentation_Slide_Index(presentation, slide);
 
 
 // REPLACE WITH NEW SLIDE
 var section = await Core_Api("Presentation_ReadSlide", {path, slide_id:id}); 
 var slide   = Presentation_Slide_Create(id, section, presentation); 
 presentation["slides"].pop();
 presentation["slides"][index] = slide;
  
 
 // SLIDE ELEMENTS   
 var elements = Object_Subset(section, "element");
	
 var ids = Object.keys(elements);
 for(var id of ids)
 {
  var item    = section[id];
  var element = Presentation_Element_Create(id, item["type"], item, slide);
 }
   
   
 // SLIDE SCRIPTS
 var scripts = Object_Subset(section, "script");
	
 for(var sid in scripts)
 {
  var script = Presentation_Script_Create(sid, scripts[sid], slide);
   
  // ADD ELEMENT
  slide["scripts"].push(script);
 }
 
 
 return slide;
}






function Presentation_Slide_Display(slide)
{
 var presentation = slide["presentation"];
 if(!presentation["display"]) return;
 
 if(!slide) var slide = Safe_Get(presentation, ["current-slide"], false);
 if(!slide) return; 
 
 
 // RENDER
 presentation["display"].innerHTML = "";
 presentation["display"].append(...slide["elements"]);
 presentation["display"].style.backgroundColor = slide["header"]["color"] || "white";
 
 
 // SET DISPLAYED SLIDE AS CURRENT
 Safe_Set(presentation, ["current-slide"], slide);
}





function Presentation_Slide_Render(slide, display)
{  
 var presentation = slide["presentation"];
  
 display.style.position = "relative";
 display.style.overflow = "hidden";
 
 // RENDER
 var rect    = display.getBoundingClientRect();
 var scale_x = rect.width  / presentation["width"];
 var scale_y = rect.height / presentation["height"]; 
 
 display.innerHTML = "";
 for(var element of slide["elements"]) 
 {
  var node = element.cloneNode(true);
  Document_Element_Scale(node, scale_x, scale_y);
  
  display.appendChild(node);
 }
 
 display.style.backgroundColor = slide["header"]["color"] || "white";
}




function Presentation_Slide_Current(presentation)
{
 var slide = presentation["current-slide"];
 
 return slide;
}



function Presentation_Slide_Index(presentation, slide)
{
 if(!slide) var slide = presentation["current-slide"];
 
 var index = presentation["slides"].indexOf(slide);
 
 return index;
}




function Presentation_Slide_Find(presentation, id)
{
 for(var slide of presentation["slides"])
 {
  if(slide["id"] == id) return slide;
 }
}



function Presentation_Slide_Next(presentation, set, reset)
{
 var index = Presentation_Slide_Index(presentation);
 
 index = index + 1;
 if(index > presentation["slides"].length - 1) index = presentation["slides"].length - 1;
 
 var slide = presentation["slides"][index];
 
 if(reset)
 {
  Presentation_Slide_Reset(slide);
 }
 
 if(set)
 {
  Presentation_Slide_Display(slide);
 }
 
 return slide;
}





function Presentation_Slide_Prev(presentation, set, reset)
{
 var index = Presentation_Slide_Index(presentation);
 
 index = index - 1;
 if(index < 0) index = 0;
 
 var slide = presentation["slides"][index];
 
 if(reset)
 {
  Presentation_Slide_Reset(slide);
 }
 
 if(set)
 {
  Presentation_Slide_Display(slide);
 }
 
 return slide;
}





async function Presentation_Slide_NextScript(slide)
{
 var scripts = Safe_Get(slide, ["scripts"], []);
 if(scripts.length == 0) return;
 
 var current = Safe_Get(slide, ["current-script"], 0);
 if(current >= scripts.length) return;
 
 await Presentation_Script_Execute(scripts[current]);
 
 current = current + 1;
 Safe_Set(slide, ["current-script"], current);
}





async function Presentation_Slide_PrevScript(slide)
{
 var scripts = Safe_Get(slide, ["scripts"], []);
 if(scripts.length == 0) return;
 
 var current = Safe_Get(slide, ["current-script"], 0);
 if(current <= scripts.length) return;
 
 await Presentation_Script_Execute(scripts[current]);
 
 current = current - 1;
 Safe_Set(slide, ["current-script"], current);
}




async function Presentation_Slide_PlayScripts(slide, pause = 1)
{
 var scripts = slide["scripts"];

 for(var script of scripts) 
 {
  await Presentation_Script_Execute(script);

  Client_Wait(pause);
 }
}




function Presentation_Slide_GetData(slide)
{
 var data = {};
 
 
 // HEADER
 data["header"] = {};
 Object.assign(data["header"], slide["header"]);
 
 
 // ELEMENTS
 for(var element of slide["elements"])
 {
  var properties = Presentation_Element_GetData(element);
  var id         = properties["id"];
  
  data[id]       = properties;
 }
 
 
 // SCRIPTS
 var s = 0;
 for(var script of slide["scripts"])
 {
  var sid = "Script " + String(s).padStart(2, "0");
  
  var item     = {};
  item["name"] = script["name"];
  
  var n = 0;
  for(var line of script["lines"])
  {
   var lid   = String(n).padStart(2, "0");
   
   item[lid] = Object_To_String(line); 
   n = n + 1;
  }
  
  data[sid] = item;
  s = s + 1;
 }
 

 return data;
}






function Presentation_Slide_NewId(presentation)
{
 var max = -1;
 for(var s of presentation["slides"])
 {
  var i = parseInt(s["id"]);
  if(i > max) max = i;
 }
 max    = max + 1;
 
 var id = String(max).padStart(2, "0");
 
 return id;
}





function Presentation_Slide_Duplicate(slide)
{
 var presentation = slide["presentation"]; 

 var data               = Presentation_Slide_GetData(slide); 
 data["header"]["name"] = String_Copycount_Next(data["header"]["name"]);
 var duplicate          = Presentation_Slide_Create(undefined, data, presentation); 

 // CREATE A DUPLICATE OF EACH ELEMENT
 for(var element of slide["elements"]) 
 {
  Presentation_Element_Duplicate(element, duplicate);
 }  
 
 
 // CRAETE A DUPLICATE OF EACH SCRIPT
 duplicate["scripts"] = [];
 for(var script of slide["scripts"])
 {
  var scriptcopy      = {};
  
  scriptcopy["slide"] = duplicate;
  scriptcopy["id"]    = script["id"];
  scriptcopy["name"]  = script["name"];
  scriptcopy["lines"] = [];
  
  for(var line of script["lines"])
  {
   var linecopy = {};
  
   linecopy["script"]  = scriptcopy;  
   linecopy["command"] = line["command"];
   linecopy["element"] = line["element"];
   linecopy["params"]  = line["params"];
   linecopy["sound"]   = line["sound"];
   linecopy["time"]    = line["time"];
  
   scriptcopy["lines"].push(linecopy);
  }
  
  duplicate["scripts"].push(scriptcopy);
 }
 
 return duplicate;
}







function Presentation_Slide_FindTopZ(slide, valueonly)
{
 if(!slide) return 0;
 
 var top     = 0;
 var element = undefined;
 
 for(e of slide["elements"])
 {
  var z = parseInt(e.style.zIndex);

  if(z > top) 
  {
   top     = z;
   element = e; 
  }
 }
 
 if(valueonly) return top; else return element;
}




function Presentation_Slide_FindBottomZ(slide, valueonly)
{
 if(!slide) return 0;
 
 var bottom  = 2147483638;
 var element = undefined;
 
 for(e of slide["elements"])
 {
  var z = parseInt(e.style.zIndex);

  if(z < bottom) 
  {
   bottom  = z;
   element = e;
  }
 }
 
 if(valueonly) return bottom; else return element;
}





function Presentation_Slide_FindElement(slide, id)
{
 if(!slide) return;
 
 for(var element of slide["elements"])
 {
  if(Document_Element_GetData(element, "uid") == id)
  {
   return element;
  }
 }
}




function Presentation_Slide_FindScript(slide, id)
{
 if(!slide) return;
 
 for(var script of slide["scripts"])
 {
  if(script["id"] == id) return script;
 }
}




function Presentation_Slide_ElementsByName(slide, name)
{
 if(!slide) return;
 
 var elements = [];
 
 for(var element of slide["elements"])
 {
  if(Document_Element_GetData(element, "name") == name)
  {
   elements.push(element);
  }
 }
 
 return elements;
}




function Presentation_Slide_Snapshot(slide)
{
 // SNAPSHOT ALL SLIDE'S ELEMENTS
 for(var element of slide["elements"])
 {
  var data = Presentation_Element_GetData(element);
  
  Document_Element_SetObject(element, "dna", data);
 }
}





function Presentation_Slide_Reset(slide)
{ 
 var scale = Safe_Get(slide, ["presentation", "scale"]);
 
 // RESET ALL SLIDE'S ELEMENTS
 for(var element of slide["elements"] || [])
 {
  Presentation_Element_Reset(element);
  
  /*
  if(scale)
  {
   if(!element["noscale"]) Document_Element_Scale(element, scale["x"], scale["y"]);
  }
  */
 }
 
 // RESET ALL SLIDE'S SCRIPTS
 for(var script of slide["scripts"] || [])
 {
  script["executed"] = false;
 }
 
 slide["current-script"] = 0;
}









// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                        E L E M E N T S                                         // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Presentation_Element_Create(id, type, data = {}, slide) 
{ 
 switch(type)
 {
  case "image":
	var element = document.createElement("img");
	
	// DEFAULTS
	element.style.width  = "64";
    element.style.height = "64";
  break;
  
  
  case "shape":
	var element = document.createElement("img");
	
	// DEFAULTS
	element.style.width  = "64";
    element.style.height = "64";
  break;
  
	
  case "video":
    var element = document.createElement("video");
	
	// DEFAULTS
	element.style.width  = "128";
    element.style.height = "64";
	
	element.addEventListener("mouseover", function(){element.controls = true;},  false);
	element.addEventListener("mouseout",  function(){element.controls = false;}, false);
  break;
	
  case "text":
  case "textarea":
	var element                   = document.createElement("div");
	element.style.resize          = "none";
	element.style.backgroundColor = "transparent";
	element.style.border          = "none";
	element.style.overflow        = "hidden";
	element.innerHTML             = data["text"] || data["value"] || "";
	
	// DEFAULTS
	element.style.width  = "128";
    element.style.height = "128";
  break;
	
  case "input":
	var element              = document.createElement("input");
    element.style.resize     = "none";

	// DEFAULTS
	element.style.width  = "128";
    element.style.height = "32";
  break;
  
  
  case "iframe":
	var element = document.createElement("iframe");
	
	//element["noscale"]   = true;
    element.src          = "about:blank";
	element.style.width  = "256";
    element.style.height = "256";
	
	element.style.borderWidth = "12px";
	element.style.borderColor = "white";
	
	Document_Element_SetData(element,   "url",  "about:blank");
	//element.style.border = "0";
  break;
   
   
  default:
	var element = document.createElement("null");
  break;
 }
 

 // IF UNDEFINED, DERIVE IT FROM THE SLIDE
 if(!id && slide) 
 {
  var id = Presentation_Element_NewId(slide, type);
 }
 

 Document_Element_SetData(element,   "type",  type);
 Document_Element_SetData(element,   "uid",   id);
 Document_Element_SetObject(element, "slide", slide);
 
 // APPLY PASSED DATA
 Presentation_Element_ApplyData(element, data);
 
 
 // AUTONAME IF NEEDED
 var defaultname = String_Capitalize_Initial(type) + " " + String_Filter_AllowDigits(id);
 var elementname = data["name"] || defaultname || "";
 Document_Element_SetData(element, "name", elementname);
 
 
 // STORE ORIGINAL DATA
 Document_Element_SetObject(element, "dna", data);

 
 // LINK TO SLIDE
 if(slide)
 {
  slide["elements"].push(element);
 } 
 
 
 return element;
}






function Presentation_Element_GetData(element) 
{
 var properties = {};
 
 // ID
 properties["id"]        = Document_Element_GetData(element, "uid");
 properties["type"]      = Document_Element_GetData(element, "type");
 
 // CORE PROPERTIES
 properties["value"]     = element.value;
 properties["innerHTML"] = element.innerHTML;
 properties["className"] = element.className;
 
 // SRC
 switch(properties["type"])
 {
  case "iframe":
	properties["url"] = element.src;
  break;
	
  default:
	properties["src"] = Path_Filename(element.src);
  break;
 }
 
 
 // STANDARD PROPERTIES 
 for(var field of PRESENTATION_FIELDS_STANDARD)
 {
  properties[field] = element.style[field] || "";
 }	
  
  
 // CUSTOM PROPERTIES
 for(var field of PRESENTATION_FIELDS_CUSTOM)
 {
  properties[field] = Document_Element_GetData(element, field, "");
 }


 return properties;
}





function Presentation_Element_ApplyData(element, data)
{
 var slide = Document_Element_GetObject(element, "slide");
 var path  = Safe_Get(slide, ["presentation", "path"], "");
 	
	
 // FIXED PROPERTIES
 element.draggable        = true
 element.autocomplete     = "never";
 element.style.position   = "absolute";
 element.style.userSelect = "none";
 element.style.zIndex     = 0;


 // APPLY DATA	 
 if(data)
 {
  // CORE PROPERTIES
  element.value     = data["value"]     || data["text"] || "";
  element.innerHTML = data["innerHTML"] || data["text"] || "";
  element.className = data["className"] || "";
 
  // SRC
  switch(Document_Element_GetData(element, "type"))
  {
   case "iframe":
	element.src = data["url"];
   break;
	
   default:
	element.src = path + "/" + data["src"];
   break;
  }
 
 
  // STANDARD PROPERTIES 
  for(var field of PRESENTATION_FIELDS_STANDARD)
  {
   element.style[field] = data[field] || element.style[field] || "";
  }	
  
 
  // CUSTOM PROPERTIES
  for(var field of PRESENTATION_FIELDS_CUSTOM)
  {
   Document_Element_SetData(element, field, data[field] || "");
  }
 
 }
 
 
 // MANAGE VISIBILITY
 var slide = Document_Element_GetObject(element, "slide");
 var mode  = Safe_Get(slide, ["presentation", "mode"], "");
 if(mode == "edit")
 {
  // IN PRESENTATION EDITING MODE, ALWAYS VISIBLE
  element.style.visibility = "visible";
 }
 else
 {
  // IN REAL MODE, STARTUP VISIBILITY DEPENDS ON THE "VISIBLE" CUSTOM PROPERTY
  var visible = (Document_Element_GetData(element, "visible") != "no"); 
  
  if(visible) element.style.visibility = "visible"; else element.style.visibility = "hidden";
 }
 
 
 // MORE POSTPROCESSING FOR "LIVE" MODE
 if(mode != "edit")
 {
  // IF ELEMENT HAS AN ONCLICK EVENT, SHOW IT AS CLICKABLE
  if(Document_Element_GetData(element, "onclick_animation"))
  {
   element.style.cursor = "pointer"; 
  }
  
  // IF ELEMENT IS A VIDEO, SHOW CONTROLS AND OVERRIDE ONCLICK TO DO AUTOPLAY
  {
   
  }
 }
 

}



function Presentation_Element_Snapshot(element)
{
 var data = Presentation_Element_GetData(element);
  
 Document_Element_SetObject(element, "dna", data);
}





function Presentation_Element_Reset(element)
{
 var slide = Document_Element_GetObject(element, "slide", {});
 var scale = Safe_Get(slide, ["presentation", "scale"], false);
 
 var id   = Document_Element_GetData(element,   "uid");
 var type = Document_Element_GetData(element,   "type");
 var data = Document_Element_GetObject(element, "dna");

 Presentation_Element_ApplyData(element, data);
 
 if(scale && !element["noscale"]) Document_Element_Scale(element, scale["x"], scale["y"]);
}






function Presentation_Element_Duplicate(element, slide)
{
 if(!slide)
 {
  var slide    = Document_Element_GetObject(element, "slide");
 }

 var data      = Presentation_Element_GetData(element);
 var duplicate = Presentation_Element_Create(undefined, data["type"], data, slide);
 
 return duplicate;
}






function Presentation_Element_NewId(slide, type)
{ 
 var max = 0;
 for(e of slide["elements"])
 {
  var id = Document_Element_GetData(e, "uid");
  var n  = parseInt(String_Filter_AllowDigits(id));
  
  if(n > max) max = n;
 }
 var id = "Element " + String(max + 1).padStart(3, "0"); 
 
 return id;
}





function Presentation_Element_Active(element)
{
 var dataset = element["dataset"] || {};
 var events  = Object_Subset(dataset, "onclick_");
   
 for(var id in events)
 { 
  var ev = events[id] || "";
  
  if(ev && ev.trim() != "") 
  {
   return true;
  }   
 }
 
 return false;
}




function Presentation_Element_SendToBack(element)
{
 if(!element) return;
 
 var slide = Document_Element_GetObject(element, "slide");
 if(!slide) return;
 
 var z = parseInt(Presentation_Slide_FindBottomZ(slide, true));
 
 // IF THE BOTTOM ELEMENT HAS ALREADY A Z OF 0, WE NEED TO PUSH ALL ELEMENTS UP, AND SET THIS ONE TO 0
 if(z == 0)
 { 
  var slide = Document_Element_GetObject(element, "slide");
  for(var e of slide["elements"]) e.style.zIndex = parseInt(e.style.zIndex) + 1;
  
  element.style.zIndex = 0;
 }
 else
 { 
  element.style.zIndex = z - 1;
 }	 

}




function Presentation_Element_BringToFront(element)
{
 if(!element) return;
 
 var slide = Document_Element_GetObject(element, "slide");
 if(!slide) return;
 
 var z = Presentation_Slide_FindTopZ(slide, true);
 element.style.zIndex = parseInt(z) + 1;
}





// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                        S C R I P T S                                           // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function Presentation_Script_Create(id, data = {}, slide)
{
 var script        = {};
 
 script["id"]      = id;
 script["name"]    = data["name"] || id;
 script["lines"]   = [];
 script["slide"]   = slide;
 
 if(data)
 {
  for(var lid in data)
  {
   switch(lid)
   {
	case "name":
	 script["name"] = data[lid];
	break;
	
	default:
	 var token = data[lid];
	 var line  = Object_From_String(token);
	 
	 line["script"] = script;
	 
	 script["lines"].push(line);
    break;
   }
   

  }
 }
 
 return script;
}





function Presentation_Script_CreateLine(script)
{
 var line       = {};
 line["script"] = script;
 
 for(var key of PRESENTATION_SCRIPT_LINE) line[key] = "";
 script["lines"].push(line);
 
 return line;
}




function Presentation_Script_LineTarget(line)
{
 var script = line["script"];
 if(!script) return;
 
 var slide  = script["slide"];
 if(!slide) return;
 
 if(!line["element"]) return;
 
 return Presentation_Slide_FindElement(slide, line["element"]);
}




function Presentation_Script_LineParams(line)
{
 var params = line["params"] || "";
 
 params = params.split(",");
 for(var i in params) params[i] = params[i].trim();
 
 return params;
}






async function Presentation_Script_Execute(script, onlinestart, onlineexecuted)
{
 var promise = new Promise((resolve, reject) =>
 {
  // CLEAN UP EXECUTION STATUS FOR ALL LINES
  for(let line of script["lines"]) delete line["executed"];
 
  // FIRE UP EXECUTION "THREADS" FOR ALL LINES
  for(let line of script["lines"])
  {
   var time = Math.floor(parseFloat(line["time"]) * 1000);
   if(time == "" || isNaN(time)) var time = 0;
    
   line["running"] =
   setTimeout(
   async function()
   {
	// IF ON LINE START EVENT SET, CALL BACK
    if(onlinestart) onlinestart(line);
	
	// EXECUTE     
    await Presentation_Script_ExecuteLine(line);
    
	// MARK AS EXECUTED
	clearTimeout(line["running"]);
    line["executed"] = true;
    
	// IF ON LINE EXECUTED EVENT SET, CALL BACK
    if(onlineexecuted) onlineexecuted(line);
	
    // CHECK IF ALL EXECUTED
	var done = true;
	for(let check of script["lines"])
	{
     if(!check["executed"])
     {
	  done = false;
	  break;
	 }
	}
	 
	// IF ALL EXECUTED, ASYNC RETURN FROM MAIN FUNCTION
	if(done) 
	{
     script["executed"] = true;
	 resolve();
	}
   }, 
   time);
  }
 });
 
 return promise;
}






async function Presentation_Script_ExecuteLine(line, slide)
{
 // IF SLIDE NOT EXPLICIT, DERIVE FROM SCRIPT
 if(!slide)
 {
  var script       = line["script"];
  var slide        = script["slide"];
 }
 
 var presentation = slide["presentation"];
 
 
 // DECODE COMMAND
 var command = line["command"];
 var command = Core_Data_Page("presentation/commands")[command];
 if(!command) 
 {
  return;
 }
 
 
 // TARGET ELEMENT
 var element = Presentation_Slide_FindElement(slide, line["element"]);
 
 // COMMAND PARAMETERS
 var params  = Presentation_Script_LineParams(line);
 
 
 // ANIMATION
 if(command["anim"])
 {
  var animation = command["anim"];
 }
 else
 {
  var animation = false;
 }
  
  
 // SOUND
 if(line["sound"])
 {
  var path  = presentation["path"];
  var sound = path + "/" + line["sound"];
 }
 else
 {
  var sound = false;
 }
 
 
 
 
 
 // EXECUTE DIFFERENT COMMAND TYPES
 switch(command["type"])
 {
  case "animate":
	 // PLAY SOUND 
     if(sound) Media_Audio_Play(sound);
	 
	 // PLAY ANIMATION
     if(element && animation) await Document_Element_Animate(element, animation);
  break;
  
  
  case "modify":
	switch(line["command"])
	{
	 case "grow":
        var time   = parseInt(params[0])   || 1;
		var factor = parseFloat(params[1]) || 2;
	
	    // PLAY SOUND 
        if(sound) Media_Audio_Play(sound); 
	
	    // EXPAND ELEMENT
		await Document_Element_Zoom(element, factor, time);
	 break;
	
	
	 case "shrink":
		var time   = parseInt(params[0])   || 1;
		var factor = parseFloat(params[10]) || 0.5;
		 
		// PLAY SOUND 
        if(sound) Media_Audio_Play(sound); 
		
		// SHRINK ELEMENT
		await Document_Element_Zoom(element, factor, time);
	 break;
	 
	 
	 case "move":
	    var params = Presentation_Script_LineParams(line);
        var time   = parseInt(params[0])   || 1;
		
		// IF 2 PARAMS, THEN PARAM 2 IS INTERPRETED AS ANOTHER ELEMENT'S NAME: WE'LL MOVE ON TOP OF THAT (CENTER-TO-CENTER)
		if(params.length == 2)
		{
	     // FIND DESTINATION ELEMENT
		 var elements = Presentation_Slide_ElementsByName(slide, params[1]);
		 if(elements.length > 0)
		 {		  
		  // FIND THIS ELEMENT'S POSITION AND CENTER
		  var position = Document_Element_Position(element); 
		  var center   = Document_Element_Center(element); 
		  
		  // DETERMINE DESTINATION ELEMENT CENTER
		  var dest     = Document_Element_Center(elements[0]);
		    
		  // SET DESTINATION
		  var left = position.left + (dest.left - center.left); 
		  var top  = position.top  + (dest.top  - center.top);
		 }
		}
		else
		{
		 var left = parseFloat(params[1]) || 0;
		 var top  = parseFloat(params[2]) || 0;
		}
		
		// PLAY SOUND 
        if(sound) Media_Audio_Play(sound);
		
		// MOVE ELEMENT
		await Document_Element_Interpolate(element, {left:left, top:top}, time);
	 break;
	 
	 
	 case "bringtofront":
	    // PLAY SOUND 
        if(sound) Media_Audio_Play(sound);
		
		Presentation_Element_BringToFront(element);
	 break;
	 
	 
	 case "sendtoback":
	    // PLAY SOUND 
        if(sound) Media_Audio_Play(sound);
	 
		Presentation_Element_SendToBack(element);
	 break;
	 
	 
	 case "center":
	    var size   = Document_Element_Size(presentation["display"]);
		
		var width  = size["width"];//parseInt(presentation["display"].style.width);
		var height = size["height"];//parseInt(presentation["display"].style.height);
		
		var left   = (width / 2)  - (parseFloat(element.style.width)  / 2);
		var top    = (height / 2) - (parseFloat(element.style.height) / 2);
		
		// PLAY SOUND 
        if(sound) Media_Audio_Play(sound);
		
		// CENTER
		element.style.left = left;
		element.style.top  = top;
	 break;
	 
	 
	 case "clearstyle":
	    // PLAY SOUND 
        if(sound) Media_Audio_Play(sound);
	 
	    // CLEAR STYLE
		element.className = "";
	 break;
	 
	 
	 case "reset":
	    // PLAY SOUND 
        if(sound) Media_Audio_Play(sound);
	 
	    // RESET ELEMENT
		Presentation_Element_Reset(element);
	 break;
    } 
  break;
  
  
  case "show":
    // SHOW ELEMENT. IF PRESENTATION IN EDIT MODE, JUST SET VISIBILITY DATA TO YES
	if(presentation["mode"] == "edit")
	{
     Document_Element_SetData(element, "visible", "yes");
	}
	else
	// OTHERWISE REALLY SHOW
	{
	 element.style.visibility = "visible";	
	}
	
	// PLAY SOUND 
    if(sound) Media_Audio_Play(sound);
	 
	// PLAY ANIMATION
    if(element && animation) await Document_Element_Animate(element, animation);
  break;
   
   
  case "hide":
    // PLAY SOUND 
    if(sound) Media_Audio_Play(sound);
	 
	// PLAY ANIMATION
    if(element && animation) await Document_Element_Animate(element, animation);
  
 
    // HIDE ELEMENT. IF PRESENTATION IN EDIT MODE, JUST SET VISIBILITY DATA TO NO
	if(presentation["mode"] == "edit")
	{
	 Document_Element_SetData(element, "visible", "no");
	}
	else
	// OTHERWISE REALLY HIDE
	{
	 element.style.visibility = "hidden";	
	}
  break;
 }


}













// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         E V E N T S                                            // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Presentation_Event_Click(event)
{
 var display      = event.currentTarget;
 var presentation = Document_Element_GetObject(display, "presentation");
 var element      = event.srcElement;
 var item         = Document_Element_GetObject(element, "item");
 
 
 
 // CLICKED DISPLAY = CLICKED NOTHING
 if(element == display) 
 {
  var element = false;
  var item    = false;
 }
 
 
 // CHECK IF THE CLICK IS ACTUALLY A BYPRODUCT OF A DROP EVENT
 if(element)
 {
  var timefromdrop = Date.now() - parseInt(Document_Element_GetData(element, "droptime"));
  
  // IF IT IS, THEN LET'S CANCEL THIS EVENT. NOT A REAL CLICK
  if(timefromdrop < 100) return;
 }
 
 
 // CLICKED SOME ELEMENT (FIRE ONLY IF NOT IN EDIT MODE)
 if(element && presentation["mode"] !== "edit")
 {  
  // PROCESS ELEMENT CLICK
  var line        = {};
  line["element"] = Document_Element_GetData(element, "uid");
  line["command"] = Document_Element_GetData(element, "onclick_animation");
  line["sound"]   = Document_Element_GetData(element, "onclick_sound");
  
  var slide = Document_Element_GetObject(element, "slide");
  if(slide)
  {
   Presentation_Script_ExecuteLine(line, slide);
  }
 }
  
 
  
 // PROPAGATE TO HANDLER
 if(presentation["handler"])
 {
  var e = {};
  
  e["event"]   = "click";
  e["element"] = element;
  
  presentation["handler"](e);
 }
}






function Presentation_Event_Dblclick(event)
{
 var display      = event.currentTarget;
 var presentation = Document_Element_GetObject(display, "presentation");
 var element      = event.srcElement;
 var item         = Document_Element_GetObject(element, "item");
 
 // CLICKED DISPLAY = CLICKED NOTHING
 if(element == display) 
 {
  var element = false;
  var item    = false;
 }
 
 
 // PROPAGATE TO HANDLER
 if(presentation["handler"])
 {
  var e = {};
  
  e["event"]   = "dblclick";
  e["element"] = element;
  
  presentation["handler"](e);
 }
}





function Presentation_Event_DragStart(event)
{
 event.preventDefault();
 
 
 // IF CLICKED OUTSIDE ELEMENTS, JUST RETURN
 var display = event.currentTarget;
 if(element == display) return;
 

 // GET DATA 
 var element = event.srcElement;
 var id      = Document_Element_GetData(element, "uid");
 var slide   = Document_Element_GetObject(element, "slide");    
 var mode    = Safe_Get(slide, ["presentation", "mode"], "");
 
 
 // IF NOT IN EDIT MODE, CHECK IF THE ELEMENT IS MOVEABLE
 if(mode !== "edit")
 {
  var moveable = (Document_Element_GetData(element, "moveable") == "yes");
  if(!moveable) return;
 }	 


 // START DRAGGING 
 Document_Element_SetObject(display, "dragging", element);
 //Document_CSS_SwitchClass(element, "style-drag-dragging");
}






function Presentation_Event_MouseUp(event)
{
 var display      = event.currentTarget;
 var element      = Document_Element_GetObject(display, "dragging");
 var presentation = Document_Element_GetObject(display, "presentation"); 
 
  
 if(element)
 {
  Document_Element_SetObject(display, "dragging", undefined);
  //Document_CSS_SwitchClass(element, "style-drag-dragging");
 
  Document_Element_SetData(element, "droptime", Date.now()); 
  console.log("dropped", element);
 }
 
 
 // PROPAGATE TO HANDLER
 if(presentation["handler"])
 {
  var e = {};
  
  e["event"]   = "drop";
  e["element"] = element;
  
  presentation["handler"](e);
 }
}
 



function Presentation_Event_MouseMove(event)
{   
 var display      = event.currentTarget;
 var presentation = Document_Element_GetObject(display, "presentation"); 
 var element      = Document_Element_GetObject(display, "dragging");
  
  
 // ACQUIRE AND STORE CURRENT X, Y POSITION RELATIVE TO DISPLAY  
 var rect = event.target.getBoundingClientRect();
 var left = event.clientX - rect.left; 
 var top  = event.clientY - rect.top;
 
 Safe_Set(presentation, ["mouse"], {x:left, y:top});
 
  
  
 var grid_size    = Safe_Get(presentation, ["grid-size"], 8);
   
 if(element)
 {
  //var crect = display.getBoundingClientRect();
  //var erect = element.getBoundingClientRect();
  
  //var left = erect.left - crect.left;
  //var top  = erect.top  - crect.top;   
  
  var mx = event.movementX;
  var my = event.movementY;
  
  // var mx = Math.round(event.movementX / grid_size) * grid_size; 
  // var my = Math.round(event.movementY / grid_size) * grid_size; 
    
  element.style.left = parseInt(element.style.left) + mx;
  element.style.top  = parseInt(element.style.top)  + my;   
 }
 
 
 
 // PROPAGATE TO HANDLER
 if(presentation["handler"])
 {
  var e = {};
  
  e["event"]   = "move";
  e["element"] = element;
  
  presentation["handler"](e);
 }
}