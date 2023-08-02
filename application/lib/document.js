// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     D O C U M E N T                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       E V E N T S                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function Document_Event_Trigger(element, type)
{
 var event = new Event(type);
 element.dispatchEvent(event);
}



function Document_Event_RelativeCoords(event)
{
 var element = event.currentTarget;
 
 var rect    = element.getBoundingClientRect();
 var x       = (event.clientX - rect.left); 
 var y       = (event.clientY - rect.top);
 
 return {x,y};
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     E L E M E N T S                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Document_Element_Create(html)
{
 var element       = document.createElement(null); 
 element.innerHTML = html;
 element           = element.firstElementChild;
 
 return element;
}



function Document_Element_Disable(element, css)
{
 var style = {fields:[], css:false};
 
 for(var field of ["pointer-events", "user-select"])
 {
  style["fields"][field] = element.style[field];
  element.style[field]   = "none";  
 }
 
 if(css)
 {
  Document_CSS_SetClass(element, css);
  style["css"] = css;
 }
 
 Document_Element_SetObject(element, "beforedisable", style);
}




function Document_Element_Restore(element, enable)
{
 var style = Document_Element_GetObject(element, "beforedisable") || {};
 
 for(var field in style["fields"])
 {
  element.style[field] = style["fields"][field];
 }
 
 if(style["css"]) Document_CSS_UnsetClass(element, style["css"]);
 
 if(enable)
 {
  element.style.pointerEvents = "";
 }
}







function Document_Element_FindParent(root, fieldname, fieldvalue, options = [])
{
 var element = root;

 do
 {  
  if(element && element.dataset[fieldname] && (!fieldvalue || element.dataset[fieldname] == fieldvalue)) return element;
 
  element = element.parentElement;
 } 
 while(element);
 
 return undefined;
}




function Document_Element_Children(element, recurse)
{
 if(!element || typeof element != "object") return [];
 
 if(recurse) 
 {
  var collection = element.getElementsByTagName("*"); 
 }
 else 
 {
  var collection = element.children;
 }
 
 var elements = [];
 for(var e of collection)
 {
  elements.push(e);
 }
 
 return elements;
}





function Document_Element_FindChildren(element, fieldname, fieldvalue, options = [])
{
 // RECURSE CHIDREN?
 var recurse = options.includes("recurse")
	
 // SEARCH AN EXACT MATCH?
 var match    = (options.includes("match"));
	
	
 var children = Document_Element_Children(element, recurse);
 var list     = [];

 
 for(var child of children)
 {
  // FIELD MUST EXIST	 
  if(child.dataset[fieldname] !== undefined) 
  {	   
   // IF NO SPECIFIC VALUE REQUESTED OR REQUESTED AND MATCHED...
   if((fieldvalue === undefined) || (child.dataset[fieldname] == fieldvalue)) 
   {
	if(match) return child; else list.push(child);
   }
  }
 }
 
 if(match) return undefined; else return list;
}





function Document_Element_FindChild(element, fieldname, fieldvalue, options = [])
{
 // MUST FIND AN EXACT MATCH
 options.push("match");
 
 var child = Document_Element_FindChildren(element, fieldname, fieldvalue, options);
 
 return child;
}




function Document_Element_Index(element)
{
 if(!element.parentElement) return -1;
 
 var index = 0;
 for(var child of element.parentElement.children)
 {
  if(child == element) return index;
  
  index = index + 1;
 }
}




function Document_Element_ShuffleChildren(element, options = {preservenull:true})
{ 
 var elements = [];
 
 while(element.children.length > 0)
 {
  var child = element.children[0];
  
  elements.push(child); 
  child.remove();
 }
 
 elements.sort((a, b) => 0.5 - Math.random());
 

 element.append(...elements);
}





function Document_Element_ListColliding(element)
{
 var list = [];
 
 if(element.parentElement)
 {
  var element_rect = element.getBoundingClientRect();
  var siblings     = Document_Element_Children(element.parentElement);
  
  for(var sibling of siblings)
  {
   if(sibling != element)
   {
	var sibling_rect = sibling.getBoundingClientRect();
	
	var collides     = Geometry_Rect_Intersect(element_rect, sibling_rect);
	if(collides) list.push(sibling);
   }
  }
  
 }
 
 return list;
}





function Document_Element_SetData(element, id, value)
{
 element.dataset[id] = value;
}




function Document_Element_GetData(element, id)
{
 var value = element.dataset[id];
 
 return value;
}




function Document_Element_SetObject(element, id, obj, options = [])
{
 if(options.includes("propagate"))
 {
  var children = Document_Element_Children(element, true);
  
  for(var child of children) 
  {
   Safe_Set(child, ["data-objects", id], obj);
  }
 }
 
 return Safe_Set(element, ["data-objects", id], obj);
}




function Document_Element_GetObject(element, id)
{
 var obj = Safe_Get(element, ["data-objects", id], undefined);
 
 return obj;
}




function Document_Element_Show(element)
{
 if(!element || !element.style) return;
 
 if(element.style.visibility != "visible") element.style.visibility = "visible";
}





function Document_Element_Hide(element)
{
 if(!element || !element.style) return;
 
 if(element.style.visibility != "hidden") element.style.visibility = "hidden";
}





function Document_Element_Position(element)
{
 var position     = {};
 
 var rect         = element.getBoundingClientRect();
 
 position["left"] = rect.left;
 position["top"]  = rect.top;
 
 //position["left"] = element.offsetLeft;
 //position["top"]  = element.offsetTop;
 
 return position;
}




function Document_Element_Size(element)
{
 var size       = {};
 
 var rect       = element.getBoundingClientRect();
 
 size["width"]  = rect.width;
 size["height"] = rect.height;
 
 return size;
}




function Document_Element_Corner(element, corner)
{
 var rect  = element.getBoundingClientRect();
 var point = Geometry_Rect_Corner(rect, corner);

 return point; 
}




function Document_Element_Center(element)
{ 
 var center     = {};
 
 var rect       = element.getBoundingClientRect();
 center["left"] = rect.left + rect.width  / 2;
 center["top"]  = rect.top  + rect.height / 2;
 
 
 //center["left"] = element.offsetLeft + element.offsetWidth  / 2;
 //center["top"]  = element.offsetTop  + element.offsetHeight / 2;
 
 return center;
}






function Document_Element_ScaleStyle(element, field, scale)
{
 if(element.style[field].includes("%")) return;
 
 element.style[field] = (parseInt(element.style[field]) * scale) + "px";
}




function Document_Element_Scale(element, scale_x, scale_y)
{
 
 for(var field of ["left", "width", "font-size", "border-width", "border-radius", "padding"])
 {
  Document_Element_ScaleStyle(element, field, scale_x);
 }
 
 for(var field of ["top", "height"])
 {
  Document_Element_ScaleStyle(element, field, scale_y);
 }
 
}




function Document_Element_IsVisible(element)
{
 var rect = element.getBoundingClientRect();
 
 return  (rect.top >= 0) && (rect.left >= 0) && (rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)) && (rect.right <= (window.innerWidth || document.documentElement.clientWidth))
}




function Document_Element_Overflows(element, direction = "both")
{
 switch(direction)
 {
  case "both":
	return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
  break;
  
  case "vertical":
	return element.scrollHeight > element.clientHeight;
  break;
  
  case "horizontal":	
	element.scrollWidth > element.clientWidth;
  break;
 }
}



function Document_Element_ScrollSync(dest, source, mode = "both")
{
 Document_Element_SetData(dest,   "scrollsync", mode);
 Document_Element_SetObject(dest, "scrollsync", dest);
 
 dest.onscroll =
 function(event)
 {
  var element = event.currentTarget;
  
  var mode    = Document_Element_GetData(element, "scrollsync");
  var source  = Document_Element_GetObject(element, "scrollsync");
  
  switch(mode)
  {
   case "horizontal":
	 element.scrollLeft = source.scrollLeft; 
   break;
  
   case "vertical":
     element.scrollTop = source.scrollTop; 
   break;
  
   case "both":
	 element.scrollLeft = source.scrollLeft; 
     element.scrollTop  = source.scrollTop;
   break;
  }
 }
 
}




function Document_Element_FitText(element, options = {mode:"vertical"})
{
 var control = options["control"] || element;

 
 // STORE OVERFLOW OF CHECK-ELEMENT AND UNDO IT
 var old_overflow = control.style.overflow;
 control.style.overflow = "auto";

 switch(options["mode"])
 {
  case "vertical":
	var timeout = options["timeout"] || screen.height;
	var height  = Document_Element_Size(element).height;
	
	while(Document_Element_Overflows(control) && (timeout > 0)) 
    {
     element.style.height = height + "px";
     height = height + 1;
	 
	 timeout = timeout - 1;
    }
  break;
 }
 
 // RESTORE OVERFLOW OF CONTROL ELEMENT
 control.style.overflow = old_overflow;
}




function Document_Element_FitContent(element, delta = 0.05, options = {})
{  
 var check = options["check"] || element;


 // STORE OVERFLOW OF CHECK-ELEMENT AND UNDO IT
 var old_overflow = check.style.overflow;
 check.style.overflow = "auto";
 
 
 // PREPARE CHILDREN ELEMENTS
 for(var child of element.children)
 {
  // SET/RESET ZOOM
  if(child.style.zoom == "") child.style.zoom = 1;
  
  if(options["advanced"])
  {
   // STORE A SET OF PROPERTIES AND UNDO THEM
   // SUCH PROPERTIES CAN CAUSE AN ELEMENT TO ALWAYS MAKE ITS CONTAINER OVERFLOW  
   var style    = window.getComputedStyle(child);
   var previous = {};
   for(var key of ["outline", "border", "margin"]) 
   {
    previous[key]    = style[key];
    child.style[key] = "none";
   }
   Document_Element_SetObject(child, "prevstyle", previous);
  }
  
 }
 
 
 
 // TRY EXPANDING SIZE OF ELEMENTS
 if(options["expand"])
 {
  var timeout = 1;
 
  while(!Document_Element_Overflows(check) && (timeout > 0))
  {
   for(var child of element.children)
   {
    child.style.zoom = child.style.zoom + delta;
   }
   
   timeout = timeout - delta;
  }
 }
 
 
 // KEEP REDUCING SIZE OF ELEMENTS
 var timeout = 1;
 
 while(Document_Element_Overflows(check) && (timeout > 0))
 {
  for(var child of element.children)
  {
   child.style.zoom = child.style.zoom - delta;
  }
  
  timeout = timeout - delta;
 }
 
 
 
 // RESTORE OVERFLOW OF CHECK-ELEMENT
 check.style.overflow = old_overflow;
 
 
 if(options["advanced"])
 {
  // RESTORE CHILDREN ELEMENTS' PREVIOUS STYLE
  for(var child of element.children)
  {
   var previous = Document_Element_GetObject(child, "prevstyle");
   
   for(var key in previous) child.style[key] = previous[key];
  }
 }
}



/*
function Document_Element_FitStretch(element, delta = 1)
{
 var container = element.parentElement;
 element.style.transformOrigin = "top left";
 scalex = 0;
 scaley = 0;
 
 var temp = container.style.overflowX;
 container.style.overflowX = "auto";
 while(!Document_Element_Overflows(container, "horizontal"))
 {
  
 }

}
*/


/*
function Document_Element_Protect(element)
{	
 element.attributes["listener-protect"] =
 function(event)
 {
  event.preventDefault();
  event.stopImmediatePropagation(); 
  return false;
 };

 for(var eventname of ["contextmenu", "selectstart"]) element.addEventListener(eventname, element.attributes["listener-protect"]);  
}




function Document_Element_Unprotect(element)
{  
 for(var eventname of ["contextmenu", "selectstart"]) element.removeEventListener(eventname, element.attributes["listener-protect"]);
}
*/






async function Document_Element_Interpolate(element, position, time, onchange)
{
 var thread = Interpolation_Thread(element["style"], position, time, undefined, 
 {
  onchange:
  function(interpolator)
  {
   if(onchange) onchange(element, interpolator);
  }
 });
 
 return thread;
}






async function Document_Element_Zoom(element, factor, time)
{
 var width   = parseFloat(element.style.width)  * factor;
 var height  = parseFloat(element.style.height) * factor;  console.log(factor, width, height);

 var centerx = parseFloat(element.style.left) + (parseFloat(element.style.width)  / 2);
 var centery = parseFloat(element.style.top)  + (parseFloat(element.style.height) / 2);

 var thread = Document_Element_Interpolate(element, {width:width, height:height}, time,
 function(element, interpolator)
 { 
  element.style.left = centerx - parseFloat(element.style.width) / 2;
  element.style.top  = centery - parseFloat(element.style.height) / 2;
 });
 
 return thread;
}







function Document_Elements_Swap(element_a, element_b)
{
 const parent_a = element_a.parentNode;
 const sibling_a = element_a.nextSibling === element_b ? element_a : element_a.nextSibling;

 // Move `nodeA` to before the `nodeB`
 element_b.parentNode.insertBefore(element_a, element_b);

 // Move `nodeB` to before the sibling of `nodeA`
 parent_a.insertBefore(element_b, sibling_a);
};





function Document_Element_Toggle(element, what)
{
 if(!element || !element.style) return;
 
 switch(what)
 {
  case "visibility":
  
	if(element.style.visibility == "visible")  
	{
     element.style.visibility = "hidden"; 
	 return false;
	}
	else 
	{
     element.style.visibility = "visible";
	 return true;
	}
  break;
 }
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         I M A G E S                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Document_Image_Load(img, sources, options = {})
{
 var promise = new Promise((resolve, reject) =>
 {
  // IF THERE ARE SOURCES AVAILABLE...
  if(sources && sources.length > 0)
  { 
   // GET FIRST SOURCE AND REMOVE IT FROM THE LIST
   var source = sources[0];
   sources.splice(0, 1);
    
   // TRY 
   img.onerror =
   async function(event)
   {
    var element = event.currentTarget;
    await Document_Image_Load(element, sources, options);
   }
  
   // SPECIAL SOURCES OR JUST ASSIGN
   switch(source)
   {
    case "hide":
 	  img.style.visibility = "hidden";
	  
	  resolve("hide");
    break;
    
    default:
       if(options["nocache"]) source = source + "?c=" + Date.now();
       img.src = encodeURI(source);
	   
	   if(options["waitloaded"])
	   {
  		img.onload =
  		function()
  		{
  	     resolve(true);
  		}
      img.onerror =
      function()
      {
       resolve(true);
      }
	   }
	   else
	   {
	    resolve(true);
	   }
    break;
   }
   
  }
 });
 
 return promise;
}




async function Document_Image_Resize(data, options = {})
{	
 var promise = new Promise((resolve, reject) =>
 {
  var image = new Image();
 
  // PROCESS THAT WILL BE INITIATED ONCE IMAGE IS ASSIGNED DATA
  image.onload =
  function()
  {
   // CALCULATE SCALE
   var scale = options["scale"] || 1;

   if(options["constraints"])
   { 
    if(image.width  > options["constraints"]["width"])  var wscale = options["constraints"]["width"]  / image.width;  else wscale = 1;
    if(image.height > options["constraints"]["height"]) var hscale = options["constraints"]["height"] / image.height; else hscale = 1;
    
    if(wscale < hscale) scale = wscale; else scale = hscale;
   }
  
   // SCALE THROUGH CANVAS
   var canvas    = document.createElement("canvas");    
   canvas.width  = image.width  * scale;
   canvas.height = image.height * scale;
  
   var context                   = canvas.getContext("2d");
   context.imageSmoothingEnabled = true;
   context.imageSmoothingQuality = options["resample"] || "high";
     
   context.drawImage(image, 0, 0, canvas.width, canvas.height);
  
   // DETERMINE FORMAT
   var format  = options["format"] || "image/png";
   if(!format.includes("image/")) format  = "image/" + format;
   
   // DETERMINE QUALITY
   var quality = options["quality"] || 1;
   
   // ENCODE AND RETURN
   canvas.toBlob(
   function(blob)
   {
	// RETURN RESAMPLED IMAGE
	blob["type"] = format;
	
	resolve(blob);
   }, 
   
   format, quality);
  }
 
  // INITIATE PROCESS
  image.src = data;
 });
 
 return promise;
}




function Document_Image_HasTransparency(image)
{
 var canvas    = document.createElement("canvas");    
 canvas.width  = image.width;
 canvas.height = image.height;
  
 var context   = canvas.getContext("2d");
 context.drawImage(image, 0, 0);
  
 var pixels = context.getImageData(0, 0, image.width, image.height).data;
 var length = Math.floor(pixels.length / 4);
 for(var i = 0; i < length -1; i++)
 {
  alphaindex = (i * 4) + 3;
  if(pixels[alphaindex] != 255)
  {
   return true;
  }
 }
  
 return false; 
}




async function Document_Image_FromFile(file)
{
 var promise = new Promise(async(resolve, reject) =>
 {
  var data = await Storage_File_Read(file, {whole:true});
 
  var image = new Image();
 
  image.onload =
  async function()
  {
   resolve(image);
  }
 
  image.src = data;
 });
 
 return promise;
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     A N I M A T I O N                                          //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Document_Element_Animate(element, animation) 
{
 if(!element) return;
 
 var promise = new Promise((resolve, reject) =>
 {
  element.addEventListener('animationend', 
  function() 
  {
   if(element.style.animationFillMode != "forwards") element.style.animation = "";
   resolve();
  }, 
  {once:true, capture:false});
  
  // FIRE UP ANIMATION
  element.style.animation = animation;
 });
 
 return promise;
}




async function Document_Element_Transition(element, style, mode) 
{
 var promise = new Promise((resolve, reject) =>
 {
  element.addEventListener('transitionend', 
  function() 
  {
   element.style.transition = "";
   resolve();
  }, 
  {once:true, capture:false});
  
  // SET UP TRANSITION
  element.style.transition = "all " + mode;
  
  // FIRE UP THE TRANSITION BY ALTERING THE ELEMENT:
  // IF STYLE IS A STRING, THEN WE ALTER THE ELEMENT BY SWITCHING A CLASS ON/OFF
  if(typeof style == "string") 
  {
   Document_CSS_SwitchClass(element, style);
  }
  else 
  // OTHERWISE WE TREAT STYLE AS AN OBJECT CONTAINING UPDATES TO THE ELEMENT'S STYLE
  {
   Object.assign(element.style, style); 
  }
 });
 
 return promise;
}




async function Document_Element_AnimateChildren(element, animation, config = {interval:0, delay:0, onstart:false, onend:false}) 
{
 var promise = new Promise((resolve, reject) =>
 {
  var n        = 0;
  var delay    = config["delay"]    || 0;
  var interval = config["interval"] || 0;
 
  var done     = 0;
 
  for(let child of element.children)
  {
   if(config["appear"])    element.style.visibility = "hidden";
	   
   setTimeout(
   async function()
   {
    if(config["onstart"]) config["onstart"](child);
    
    await Document_Element_Animate(child, animation);
    
	if(config["appear"])    element.style.visibility = "visible";
	
    if(config["onend"]) await config["onend"](child);
	
	if(config["disappear"]) element.style.visibility = "hidden";
	
    done++;
    if(done == element.children.length -1)
    {
 	 resolve();
    }
   }, 
   delay + (interval * n));
  
   n++; 
  }
 });
 
 return promise;
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         I N P U T                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function Document_Input_Set(element, value)
{
 switch(element.type)
 {
  case "text":
  case "textarea":
	element.value = value;
  break;
  
  case "select-one":
	element.value = value;
  break;
  
  
  case "select-multiple":
    for(var option of element.options) 
    {
     option.selected = value.includes(option.value);
    }
  break;
  
  
  case "date":
	element.value = Date_To_Input(value);
  break;
  
  
  default:
	element.value = value;
  break;
 }
}




function Document_Input_Get(element)
{
 switch(element.type)
 {
  case "text":
  case "textarea":
	var value = element.value;
  break;
  
  
  case "select-one":
	var value = element.value;
  break;
  
  
  case "select-multiple":
	var value = [];
 
    for(var option of element.options) 
    {
     if(option.selected) value.push(option.value);
    }
  break;
  
  
  case "date":
	var value = Date_From_Input(element.value);
  break;
  
  
  default:
	var value = element.value;
  break;
 }
 
 return value;
}





// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       S E L E C T                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Document_Select_Clear(select)
{
 select.innerHTML = "";
}



function Document_Select_SelectedOption(select)
{
 var index = select.selectedIndex;
 if(index == -1) return undefined;
 
 var option = select.options[index];
 
 return option;
}



function Document_Select_SelectedValues(select, format = "array")
{
 var options = select.selectedOptions;
 
 switch(format)
 {
  case "array":
	var values  = [];
 
    for(var option of options) 
    {
     values.push(option.value);
    }
  break;
  
  case "object":
	var values = {};
	
	for(var option of options) 
    {
     values[option.value] = true;
    }
  break;
 }
 
 return values;
}



function Document_Select_AddOption(select, text, value, obj)
{
 var option   = new Option();
 option.text  = text;
 option.value = value;
 
 select.appendChild(option);
 
 if(obj)
 {
  Document_Element_SetObject(option, "object", obj);
 }
 
 return option;
}




function Document_Select_OptionsFromObjects(select, objects, textfield = false, valuefield = false)
{
 for(var i in objects)
 {
  var item = objects[i];
  
  var option   = new Option();
  
  if(!textfield)  option.text  = i;  else option.text  = item[textfield];
  if(!valuefield) option.value = i; else option.value = item[valuefield];
  
  select.appendChild(option);
 }
}


function Document_Select_OptionsFromValues(select, texts = [], values = [])
{
 for(var i in values)
 {
  var option   = new Option();
  
  option.text  = texts[i] || "";
  option.value = values[i];
  
  select.appendChild(option);
 }
}




function Document_Select_InsertOption(select, text, value, obj)
{
 if(!select.firstChild) 
 {
  Document_Select_AddOption(select, text, value, obj);
  return;
 }
 
 
 var option   = new Option();
 option.text  = text;
 option.value = value;
 
 select.insertBefore(option, select.firstChild);
 
 if(obj)
 {
  Document_Element_SetObject(option, "object", obj);
 }
 
 return option;
}





function Document_Select_OptionByObject(select, obj)
{
 for(var option of select.options)
 {
  if(Document_Element_GetObject(option, "object") == obj) return option;
 }
}




function Document_Select_OptionByValue(select, value)
{
 for(var option of select.options)
 {
  if(option.value == value) return option;
 }
}




function Document_Select_ClearSelection(select)
{
 for(var option of select.options) option.selected = false;
}





function Document_Select_SelectByValue(select, value)
{
 if(typeof value == "array")
 {
  for(var option of select.options) option.selected = (value.includes(option.value));
 }
 else
 {
  for(var option of select.options) option.selected = (option.value == value);
 }
}




function Document_Select_SetMulti(select)
{
 // FUNCTION TO SETUP OPTIONS TO PREVENT DEFAULT BEHAVIOR
 var setupoptions = 
 function()
 {
  for(var option of select.options)
  {
   option.onmousedown =  
   function(event)
   {
    event.preventDefault();
	var position = select.scrollTop;
	
	event.target.selected = !event.target.selected;
	setTimeout(function(){select.scrollTop = position}, 0);

    select.focus();
	
	return false;
   }
   
   option.onmousemove =
   function(event)
   {
	event.preventDefault();  
   }
  }
 }

 
 // OBSERVER TO CONTROL IF ANY OPTIONS ARE ADDED IN THE FUTURE
 var observer = new MutationObserver(
 function(mutations)
 {  
  for(var mutation of mutations)
  {   
   if(mutation.type == "childList")
   {
    // REFRESH OPTIONS SETUP
    setupoptions();
	
	break;
   }
  }
 });
 
 
 // SETUP CURRENT OPTIONS AND OBSERVE FOR FUTURE CHANGES
 setupoptions();
 //observer.observe(select, {childList:true});
}




function Document_Select_Sort(select, options = {field:"text", mode:"ascending"})
{
 var items = [];
 for(var option of select.options) items.push(option);
 
 var field = options["field"];
 var mode  = options["mode"];
 
 items.sort(
 function(a,b)
 {
  switch(mode)
  {
   case "ascending":
	  if (a[field] > b[field]) return 1;
	  else if (a[field] < b[field]) return -1;
	  else return 0;
   break;
   
   case "descending":
	  if (a[field] < b[field]) return 1;
	  else if (a[field] > b[field]) return -1;
	  else return 0;
   break;
  }
 }); 
  
 
 select.innerHTML = "";
 select.append(...items);
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                           C S S                                                //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Document_CSS_GetClasses(element)
{
 var classes = [];
 
 for(var cssclass of element.classList)
 {
  classes.push(cssclass);
 }
 
 return classes; 
}





function Document_CSS_SetClasses(element, classes)
{
 element.className = "";
 
 for(var cssclass of classes)
 {
  Document_CSS_SetClass(element, cssclass);
 }
 
}





function Document_CSS_SwitchClass(element, cssclass)
{
 if(element.classList.contains(cssclass)) element.classList.remove(cssclass); else element.classList.add(cssclass); 
}




function Document_CSS_SetClass(element, cssclass)
{
 if(!element.classList.contains(cssclass)) element.classList.add(cssclass); 
}



function Document_CSS_UnsetClass(element, cssclass)
{
 while(element.classList.contains(cssclass)) element.classList.remove(cssclass); 
}




function Document_CSS_SetClasses(element, classes)
{
 for(var cssclass of classes) Document_CSS_SetClass(element, cssclass);
}




function Document_CSS_PurgeClasses(element, tag)
{
 var purge = [];
 
 for(var cssclass of element.classList)
 {
  if(cssclass.startsWith(tag)) purge.push(cssclass);
 }
 
 for(var cssclass of purge) element.classList.remove(cssclass);
 
 return purge;
}




function Document_CSS_GetValue(selector, style, sheet) 
{
 selector = "." + selector;	
	
 var sheets = typeof sheet !== 'undefined' ? [sheet] : document.styleSheets;
 
 for(var i = 0, l = sheets.length; i < l; i++) 
 {
  var sheet = sheets[i];
 
  if(!sheet.cssRules) continue; 
  
  for(var j = 0, k = sheet.cssRules.length; j < k; j++) 
  {
   var rule = sheet.cssRules[j];
   if(rule.selectorText && rule.selectorText.split(',').indexOf(selector) !== -1) 
   {
    return rule.style[style];
   }
  }
 }
 
 return null;
}





function Document_CSS_GetVariable(name)
{
 var style = getComputedStyle(document.documentElement);
 var value = style.getPropertyValue("--" + name);
 
 return value;
}




function Document_CSS_SetVariable(name, value)
{
 document.documentElement.style.setProperty("--" + name, value);
}




function Document_CSS_Percentage(a, b)
{
 var p = ((parseFloat(a) / parseFloat(b)) * 100) + "%";

 return p;
}








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                        F O N T S                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Document_Fonts_List()
{
 var list = [];
 
 var fonts = document.fonts.entries();
 do
 {
  var item = fonts.next();
   
  if(!item.done)
  {
   list.push(item.value[0]["family"]);
  }
 }
 while(!item.done)
 
 return list;
}









// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                  P R O C E S S I N G                                           //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



function Document_Conditional_Class(container, cssclass, condition_data, condition_value)
{
 if(typeof cssclass == "string")
 {
  var cssclass = [cssclass];
 }
 
 
 if(!container.children) var elements = container;
 else
 {
  var elements = Document_Element_Children(container);
 }
 
 
 for(var element of elements)
 {
  var select = undefined;
  
  // DETERMINE WHETHER TO SELECT OR NOT
  switch(typeof condition_data)
  {
   case "function":
	select = condition_data(element);
   break;
   
   case "object":
	select = (element == condition_data)
   break;

   case "string":
	select = (Document_Element_GetData(element, condition_data) == condition_value);
   break;
  }
  
  // APPLY SELECTION
  switch(select)
  {
   case true:
     for(var css of cssclass) Document_CSS_SetClass(element, css);
   break;
  
   case false:  
	 for(var css of cssclass) Document_CSS_UnsetClass(element, css);
   break;
  }
  
 }
 
}



function Document_Conditional_Style(container, style_selected, style_unselected, condition_data, condition_value)
{
 if(!container.children) var elements = container;
 else
 {
  var elements = Document_Element_Children(container);
 }
 
 
 for(var element of elements)
 {
  var select = undefined;
  
  // DETERMINE WHETHER TO SELECT OR NOT
  switch(typeof condition_data)
  {
   case "function":
	select = condition_data(element);
   break;
   
   case "object":
	select = (element == condition_data)
   break;

   case "string":
	select = (Document_Element_GetData(element, condition_data) == condition_value);
   break;
  }
  
  // APPLY SELECTION
  switch(select)
  {
   case true:
     Object.assign(element.style, style_selected);
   break;
  
   case false:  
	 Object.assign(element.style, style_unselected);
   break;
  }
  
 }
 
 
}





// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      H A N D L E R S                                           //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Document_Handler_FileDrop(element, options, ondrop)
{
 element.ondragover = 
 function(event)
 {
  event.preventDefault();
 }
 
 element.ondrop = 
 function(event)
 {
  event.preventDefault();
  
  var files = [];
  for(var item of event.dataTransfer.items)
  {
   var file = item.getAsFile();
   files.push(file);
  }
  
  ondrop(files);
 }
}






function Document_Handler_Paste(events = {}, target = document)
{ console.log(target);
 target.onpaste = 
 function(event)
 { 
  // SCAN CLIPBOARD ITEMS
  for(var item of event.clipboardData.items)
  {
   // IF THERE IS AN EVENT ASSOCIATED WITH THE CLIPBOARD ITEM TYPE, CALL IT
   for(var key in events)
   {
    if(item.type.indexOf(key) === 0)
    {		 
     events[key](item, event);
    }  
   }
   
  }
 }
 
}





function Document_Handler_EnterKey(element, onenter)
{
	
 element.addEventListener("keyup", 
 function(event) 
 {
  event.preventDefault();
  if(event.keyCode == 13) onenter();
 });
 
}



function Document_Handler_SelectionRectangle(container, style, onselecting, onselected)
{
 container.style.position  = "relative";
 container.style.draggable = false;
 container.ondragstart     = function(){return false};
 
 container.addEventListener("mousedown",
 function(event)
 {
  var rectangle = Document_Element_GetObject(container, "selectionrectangle");
  if(rectangle) rectangle.remove();
  
  var rectangle = document.createElement("div");
  Document_CSS_SetClass(rectangle, style);
  rectangle.style.position      = "absolute";
  rectangle.style.zIndex        = 10000;
  rectangle.style.pointerEvents = "none"; 
  
  var rect = container.getBoundingClientRect();
  rectangle.style.left = (event.clientX - rect.left); 
  rectangle.style.top  = (event.clientY - rect.top);
  
  Document_Element_SetObject(container, "selectionrectangle", rectangle);
  
  container.appendChild(rectangle);
 });
 
 
 
 container.addEventListener("mousemove",
 function(event)
 {
  var rectangle = Document_Element_GetObject(container, "selectionrectangle");
  if(!rectangle) return;
  
  var rect = container.getBoundingClientRect();
  rectangle.style.width  = (event.clientX - rect.left) - parseInt(rectangle.style.left);
  rectangle.style.height = (event.clientY - rect.top)  - parseInt(rectangle.style.top);
  
  var list = Document_Element_ListColliding(rectangle);
  
  if(onselecting) onselecting(rectangle, list);
 });
 
 
 
 container.addEventListener("mouseup",
 function(event)
 {
  var rectangle = Document_Element_GetObject(container, "selectionrectangle");
  if(!rectangle) return;
  
  rectangle.remove();
  
  Document_Element_SetObject(container, "selectionrectangle", false);
  
  if(onselected) onselected(rectangle);
 });
 
}





function Document_Handler_DragSwap(elements, highlight, onswap)
{
 for(var element of elements)
 {
  element.draggable = true;	 
	 
  // START DRAGGING
  element.ondrag =
  function(event)
  {
   var element = event.currentTarget;
    
   utils["dragging"]        = element;
   element.style.visibility = "hidden";
   
   event.preventDefault();
  }
 
 
 
  // DRAGGING OVER
  element.ondragover =
  function(event)
  {
   var element = event.currentTarget;
   
   if(highlight) Document_CSS_SetClass(element, highlight);
   
   event.preventDefault();
  }
  
  
  
  // DRAG LEAVE
  element.ondragleave =
  function(event)
  {
   var element = event.currentTarget;
   
   if(highlight) Document_CSS_UnsetClass(element, highlight);
   
   event.preventDefault();
  }

 
  // DROPPING
  element.ondrop =
  function(event)
  {
   var dragged = utils["dragging"]; 
   var dropped = event.currentTarget;
   
   //dragged.parentNode.insertBefore(dragged, dropped);
   Document_Elements_Swap(dragged, dropped);
   
   if(onswap) onswap(
   {
    success: true,   
	dragged: dragged,
    dropped: dropped    
   });
   
   if(highlight) Document_CSS_UnsetClass(dropped, highlight);
   
   utils["lastdrag"] = true;
   delete utils["dragging"];
   
   event.preventDefault();
  }
  
  
  // END OF DRAGGING
  element.ondragend =
  function(event)
  {
   var element = event.currentTarget;
   
   element.style.visibility = "visible";
   
   if(!utils["lastdrag"] && onswap) onswap(
   {
	success: false,
	dragged: element
   });
   
   delete utils["lastdrag"];
   delete utils["dragging"];
   
   event.preventDefault();
  }
  
 
 }
}






function Document_Handler_DragSwapParent(containers, highlight, onswap)
{
 for(let container of containers)
 {
  var elements = Document_Element_Children(container);
  
  for(var element of elements)
  {
   element.draggable = true;
   
   // BEGIN ELEMENT DRAGGING
   element.ondrag =
   function(event)
   {
    var element = event.currentTarget;
    
    utils["dragging"]        = element;
    element.style.visibility = "hidden";

    event.preventDefault();
   }
   
   // CANCELLED ELEMENT DRAGGING
   element.ondragend =
   function(event)
   {
    var element = event.currentTarget;
   
    element.style.visibility = "visible";
   
    if(!utils["lastdrag"] && onswap) onswap(
    {
 	 success: false,
	 dragged: element
    });
   
    delete utils["lastdrag"];
    delete utils["dragging"];
   
    event.preventDefault();
   }
  } 
 
 
  // DRAGGING OVER CONTAINER
  container.ondragover =
  function(event)
  {
   var dropon = event.currentTarget;
   
   if(highlight) Document_CSS_SetClass(dropon, highlight);
   
   event.preventDefault();
  }
  
  
  
  // DRAGGIN AWAY FROM CONTAINER
  container.ondragleave =
  function(event)
  {
   var dropon = event.currentTarget;
   
   if(highlight) Document_CSS_UnsetClass(dropon, highlight);
   
   event.preventDefault();
  }

 
  // DROPPING OVER CONTAINER
  container.ondrop =
  function(event)
  {
   var element = utils["dragging"]; 
   var dropon  = event.currentTarget;
   var from    = element.parentElement;
   
   from.removeChild(element);
   dropon.appendChild(element);
   
   if(onswap) onswap(
   {
    success:   true,   
	dragged:   element,
	from:      from,
    container: dropon,    
   });
   
   if(highlight) Document_CSS_UnsetClass(dropon, highlight);
   
   utils["lastdrag"] = true;
   delete utils["dragging"];
   
   event.preventDefault();
  }
  
 
 }
}




function Document_Handler_DragVirtual(sources, destinations, highlight, ondragstart, ondragdrop)
{
 // SET ALL SOURCES TO BE DRAGGABLE
 for(var source of sources)
 {
  source.draggable = true;   
   
  source.ondragstart = 
  function(event)
  {
   if(ondragstart) ondragstart(event);
  }
 }
 
 
 // SET ALL DESTINATION ELEMENTS TO ACCEPT RECEIVING
 for(var destination of destinations)
 {
  destination.ondragover =
  function(event)
  {
   var element = event.currentTarget;
   if(highlight) Document_CSS_SetClass(element, highlight);
	
   event.preventDefault();
  }
  
  destination.ondragleave = 
  function(event)
  {
   var element = event.currentTarget;
   if(highlight) Document_CSS_UnsetClass(element, highlight);
  }
  
  destination.ondrop = 
  function(event)
  {
   var element = event.currentTarget;
   if(highlight) Document_CSS_UnsetClass(element, highlight);
   
   if(ondragdrop) ondragdrop(event);
  }
 }
 
}





function Document_Handler_Dragging(container, ondragstart, onmouseup, onmousemove)
{
 container.style.position = "relative";
 var crect    = container.getBoundingClientRect();

 var elements = Document_Element_Children(container); 
 for(var element of elements) 
 {
  var rect = element.getBoundingClientRect();
  
  element.style.position = "absolute";
  element.style.left     = rect.left - crect.left;
  element.style.top      = rect.top  - crect.top;  
  
  console.log(element.style.left, element.style.top);
 }
	
	
 container.ondragstart = 
 function(event)
 {
  event.preventDefault();
 
  var container = event.currentTarget;
  var element   = event.srcElement;
  
  if(element == container) return;
  
  Document_Element_SetObject(container, "dragging", element);
  Document_CSS_SwitchClass(element, "style-drag-dragging");
 }
 
 
 container.onmouseup = 
 function(event)
 {
  var container = event.currentTarget;
  var element = Document_Element_GetObject(container, "dragging");
  
  if(element)
  {
   Document_Element_SetObject(container, "dragging", undefined);
   Document_CSS_SwitchClass(element, "style-drag-dragging");
  }
 }
 
 
 container.onmousemove = 
 function(event)
 { 
  var container = event.currentTarget;
  var element = Document_Element_GetObject(container, "dragging");
  
  if(element)
  {
   var crect = container.getBoundingClientRect();
   var erect = element.getBoundingClientRect();
  
   var left = erect.left - crect.left;
   var top  = erect.top  - crect.top;   
   
   element.style.left = parseFloat(left) + event.movementX;
   element.style.top  = parseFloat(top)  + event.movementY;   
  }
 }
 
}




function Document_Handler_ScrollReduce(scroller, target, config = {direction:"vertical", size:"0px", threshold:0.2, time:1})
{
 // WHEN *SCROLLER* SCROLLS BEYOND *THRESHOLD*, IN *DIRECTION*
 // TAKE *TARGET* AND SHRINK IT TO *SIZE* IN *TIME* SECONDS
 target.style.transition = "all " + config["time"] + "s";
 
 scroller.addEventListener("scroll",
 function(event)
 {
  if(config["direction"] == "vertical") 
  {
   var field    = "height";
   var position = "scrollTop";
  }
  else
  {
   var field    = "width"; 
   var position = "scrollLeft";
  }
  
  var amount  = scroller[position] / scroller.getBoundingClientRect()[field];   console.log(amount);
  var reduced = Document_Element_GetData(target, "scrollreduced");
  
  if(!reduced && amount >= config["threshold"])
  {
   Document_Element_SetData(target, "beforescrollreduce", target.style[field]);
   
   target.style[field] = config["size"];   
   Document_Element_SetData(target, "scrollreduced", true);
  }
  else
  if(reduced && amount < config["threshold"])  
  {
   target.style[field] = Document_Element_GetData(target, "beforescrollreduce");
   Document_Element_SetData(target, "scrollreduced", false);
  }
  
 }, true);
 
 //temp2.scrollTop / temp2.getBoundingClientRect().height
}





function Document_Handler_KeyFilter(element, keys)
{
 // PREVENT TYPING
 element.onkeydown = 
 function(event)
 { 
  if(keys.includes(event.key)) return false;
 }

 // PREVENT PASTING
 /*
 element.onpaste =
 function(event)
 {  
  var text = (event.clipboardData || window.clipboardData).getData("text");
  for(var key of keys) text = text.replaceAll(key, "");

  const selection = window.getSelection();
  if (!selection.rangeCount) return false;
  
  selection.deleteFromDocument();
  selection.getRangeAt(0).insertNode(document.createTextNode(text));
 
  event.preventDefault();
 }
 */
}