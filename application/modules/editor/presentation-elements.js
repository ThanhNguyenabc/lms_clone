// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                        E L E M E N T S                                         //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



function Editor_Presentation_ElementsControls()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
  
 
 // ELEMENTS
 var list     = UI_Element_Find(submodule, "elements-list");
 list.onclick = Editor_Presentation_SelectElement; 

 
 
 // CREATE SHAPE SELECTION SUBMENU
 var page  = Core_Data_Page("editor/shapes");
 var items = {};
 for(var id in page)
 {
  var item      = {};
  item["id"]    = id;
  
  item["icon"]  = Resources_URL("images/shapes/" + page[id]["src"]);
  item["text"]  = UI_Language_Object(page[id]);
  item["state"] = "enabled";
  item["func"]  = Editor_Presentation_NewShape;
  
  items[id]     = item;
 }
 var shapemenu = UI_Menu_Create("shapes", items);
 
 
 
 // CREATE STYLE SELECTION SUBMENU THROUGH DATAPAGE
 var page       = Core_Data_Page("presentation/styles");
 var categories = Core_Data_Page("presentation/style-categories");
 var stylesmenu = UI_Menu_FromDatapage("element-style", page, "type", categories, Editor_Presentation_SwitchElementStyle);
 
 
 // CREATE TRANSFORMS SUBMENU THROUGH DATAPAGE
 var transmenu = UI_Menu_Create("element-transform", 
 {
  fullpage:
  {
   icon:   "expand", 
   text:   UI_Language_String("editor", "elements menu fullpage"),
   state:  "enabled",
   func:   Editor_Presentation_FullpageElement,
   tag:    "modify"
  },
  
  bringfront:
  {
   icon:   "window-restore", 
   text:   UI_Language_String("editor", "elements menu bringfront"),
   state:  "enabled",
   func:   Editor_Presentation_BringfrontElement,
   tag:    "modify"
  },
  
  sendback:
  {
   icon:   "window-minimize", 
   text:   UI_Language_String("editor", "elements menu sendback"),
   state:  "enabled",
   func:   Editor_Presentation_SendbackElement,
   tag:    "modify"
  }
 });
 
 
 
 // ELEMENTS LIST MENU 
 var menu = UI_Menu_Create("elements-create", 
 // MENU ITEMS
 {
  image:
  {
   icon:    "image", 
   text:    UI_Language_String("editor", "elements menu newimage"),
   state:  "enabled",
   func:    function(menu){Editor_Presentation_NewElement("image", menu)},
   tag:     "new"
  },

  video:
  {
   icon:    "film", 
   text:    UI_Language_String("editor", "elements menu newvideo"),
   state:  "enabled",
   func:    function(menu){Editor_Presentation_NewElement("video", menu)},
   tag:     "new"
  },

  text:
  {
   icon:    "align-justify", 
   text:    UI_Language_String("editor", "elements menu newtext"),
   state:  "enabled",
   func:    function(menu){Editor_Presentation_NewElement("text", menu)},
   tag:     "new"
  },
  
  shape:
  {
   icon:    "shapes",
   text:    UI_Language_String("editor", "elements menu newshape"),
   state:   "enabled",
   submenu: shapemenu,
   tag:     "new"
  },
  
  input:
  {
   icon:   "grip-lines", 
   text:   UI_Language_String("editor", "elements menu newinput"),
   state:  "enabled",
   func:   function(menu){Editor_Presentation_NewElement("input", menu)},
   tag:    "new"
  },
  
  iframe:
  {
   icon:   "person-through-window", 
   text:   UI_Language_String("editor", "elements menu newiframe"),
   state:  "enabled",
   func:   function(menu){Editor_Presentation_NewElement("iframe", menu, {url:"about:blank", src:"about:blank"})},
   tag:    "new"
  },
  
  paste:
  {
   icon:    "paste",
   text:    UI_Language_String("editor", "elements menu paste"),
   state:   "enabled",
   func:    Editor_Presentation_PasteElement,
   tag:     "new"
  },
  
  
  break0:
  {
   tag: "new"
  },
  
  
  resources:
  {
   icon:    "folder-open",
   text:    UI_Language_String("editor", "elements menu addresources"),
   state:  "enabled",
   func:    Editor_Presentation_AddResources,
   tag:     "new"
  },

  media:
  {
   icon:    "folder-open",
   text:    UI_Language_String("editor", "elements menu media"),
   state:  "enabled",
   func:    Editor_Presentation_SetElementMedia,
   tag:     "modify"
  },
  
  style:
  {
   icon:    "paint-roller",
   text:    UI_Language_String("editor", "elements menu style"),
   state:   "enabled",
   submenu: stylesmenu,
   tag:     "modify"
  },
  
  trans:
  {
   icon:    "wrench",
   text:    UI_Language_String("editor", "elements menu transform"),
   state:   "enabled",
   submenu: transmenu,
   tag:     "modify"
  },
  
  break1:
  {
   tag: "modify"
  },
  
  duplicate:
  {
   icon:    "clone",
   text:    UI_Language_String("editor", "elements menu duplicate"),
   state:   "enabled",
   func:    Editor_Presentation_DuplicateElement,
   tag:     "modify"
  },
  
  copy:
  {
   icon:    "copy",
   text:    UI_Language_String("editor", "elements menu copy"),
   state:   "enabled",
   func:    Editor_Presentation_CopyElement,
   tag:     "modify"
  },
  
  break2:
  {
   tag: "modify"
  },
  
  delete:
  {
   icon:    "trash-can", 
   text:    UI_Language_String("editor", "elements menu delete"),
   state:  "enabled",
   func:    Editor_Presentation_DeleteElement,
   tag:     "modify"
  }
 },
 
 // MENU EVENTS
 {
  onshow: Editor_Presentation_MenuElements
 }); 
 
 
 
 // ASSIGN MENU TO ELEMENTS LIST AND MAIN DISPLAY
 UI_Menu_Assign(list,    menu, {direction:"bottom right"});
 
 var display = UI_Element_Find(submodule, "slides-slide");
 UI_Menu_Assign(display, menu, {direction:"bottom right"});
 
 

 // ELEMENTS PROPERTIES HANDLER
 var container = UI_Element_Find(submodule, "element-properties");
 var elements  = Document_Element_FindChildren(container, "uid", undefined, ["recurse"]);
 for(var element of elements)
 {
  var id = Document_Element_GetData(element, "uid");
  id = id.split("-");
  
  if(id[0] == "element")
  {
   element.onchange = Editor_Presentation_UpdateElement;
  }
 }	

}







function Editor_Presentation_ListElements()
{ 
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 var slide = Core_State_Get("editor", ["selected-slide"]);
 if(!slide) return;
 
 
 // DISPLAY THIS SLIDE'S ITEMS
 var list       = UI_Element_Find(submodule, "elements-list");
 list.innerHTML = "";
 
 var elements = slide["elements"];
 
 for(var element of elements)
 {
  var value  = Document_Element_GetData(element, "uid");
  var text   = Document_Element_GetData(element, "name") || value; 
  var option = Document_Select_AddOption(list, text, value, element);
  
  // LINK
  Document_Element_SetObject(option, "element", element);
 }
}





function Editor_Presentation_UnselectElement()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 // UPON UNSELECTING, SAVE SELECTED ELEMENT FIRST
 var selected_element = Core_State_Get("editor", ["selected-element"]);
 if(selected_element) Editor_Presentation_SaveElement(selected_element);
 
 // UNSELECT IN STATE
 Core_State_Set("editor", ["selected-element"], undefined);
	
 // UNSELECT IN ELEMENTS LIST
 var list = UI_Element_Find(submodule, "elements-list");
 list.selectedIndex = -1;

 // HIDE PANELS THAT ARE NOT SUPPOSED TO BE VISIBLE IF NO ELEMENT IS SELECTED
 UI_Element_Find(submodule, "element-properties").style.visibility = "hidden"; 

 // REFLECT UN-SELECTION ON SLIDE 
 Editor_Presentation_UpdateDisplayHelpers();
}





function Editor_Presentation_SelectElement(event)
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 var list   = UI_Element_Find(submodule, "elements-list");
 var option = Document_Select_SelectedOption(list);
 if(!option) return;
 
 var element = Document_Element_GetObject(option, "element");
 if(!element) return;
 
 
 // REFLECT SELECTED ELEMENT CHANGE
 Core_State_Set("editor", ["selected-element"], element);
 
 
 // POPULATE ELEMENT PROPERTIES PANEL AND REVEAL IT
 Editor_Presentation_DisplayElement();
 

 Editor_Presentation_UpdateDisplayHelpers();
}






function Editor_Presentation_DisplayElement()
{ 
 // GET SELECTED ELEMENT INFO
 var element = Core_State_Get("editor", ["selected-element"]);
 if(!element) return;

 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 var container = UI_Element_Find(submodule, "element-properties");
 
 
 // FILTER CONTROL VISIBILITY BASED ON ELEMENT TYPE
 var type      = Document_Element_GetData(element, "type");
 var controls  = Document_Element_FindChildren(container, "filter", undefined, ["recurse"]);
 
 for(var control of controls)
 {
  var types = Document_Element_GetData(control, "filter");
  if(types)
  {
   if(types.indexOf(type) == -1) control.style.display = "none"; else control.style.display = "flex";
	   
  }
  else
  {
   control.style.display = "flex";
  }
 }
 
 
 // POPULATE CONTROLS
 var controls  = Document_Element_FindChildren(container, "uid", undefined, ["recurse"]);
 for(var control of controls)
 {
  // GET WHAT ELEMENT PROPERTY THIS CONTROL... CONTROLS
  var id     = Document_Element_GetData(control, "uid");
  var field  = id.split("-");  
  field      = field.slice(1, field.length).join("-");

  
  // STANDARD FIELD?
  if(PRESENTATION_FIELDS_STANDARD.includes(field))
  {   
   var style = element.style[field];
	 
   // TRICK/FIX
   if(field == "fontFamily") style = style.replaceAll('"', '');
	 
   control.value = style;
  }
  else
  // OTHER CASES
  switch(field)
  {
   // DATA
   case "name":
   case "moveable":
   case "visible":
   case "readonly":
   case "onclick_animation":
   case "ondrop_animation":
   case "onshow_animation":
   case "onhide_animation":
   case "onclick_sound":
   case "ondrop_sound":
   case "onshow_sound":
   case "onhide_sound":
	control.value = Document_Element_GetData(element, field);
   break;
      
   
   case "style":
	for(var option of control.options)
	{
     option.selected = option.value && (element.classList.contains(option.value));
	}
   break;
   
   
   case "innerHTML":
   case "value":
	control.value = element[field] || "";
   break;
   
  
   case "src":
	control.value = URL_Decode(Path_Filename(element.src || ""));
   break;
   
   
   case "url":
	control.value = URL_Decode(element.src);
   break;
   
   // STANDARD
   default:
	control.value = element[field] || "";
   break;
      
  }
  
  Editor_Control_UpdateQuirks(control);
 }	 
 
 
 UI_Element_Find(submodule, "element-properties").style.visibility = "visible";
}





async function Editor_Presentation_UpdateElement(event)
{	 
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 // GET CURRENT PRESENTATION 
 var presentation = Core_State_Get("editor", ["presentation"], {});

 // GET CONTROL INFO AND PROPERTY THAT IT AFFECTS
 var control = event.currentTarget;
 var id      = Document_Element_GetData(control, "uid");
 
 
 // GET SELECTED SLIDE INFO
 var slide = Core_State_Get("editor", ["selected-slide"]);
 if(!slide) return;
 
 
 // GET SELECTED ELEMENT INFO
 var element = Core_State_Get("editor", ["selected-element"]);
 if(!element) return;
 
 var field  = id.split("-");  
 field      = field.slice(1, field.length).join("-");
 
 
 // STANDARD?
 if(PRESENTATION_FIELDS_STANDARD.includes(field))
 {   
  element.style[field] = control.value;
 }
 
 
 // OTHER CASES
 switch(field)
 {
  case "name":
	Document_Element_SetData(element, field, control.value);
	
	var option = Document_Select_OptionByObject(UI_Element_Find(submodule, "elements-list"), element);
	if(option) option.text = control.value || Document_Element_GetData(element, "uid");
  break;
    
  case "moveable":
  case "visible":
  case "readonly":
	Document_Element_SetData(element, field, control.value);
	
	Editor_Presentation_UpdateDisplayHelpers();
  break;
   
  case "onclick_animation":
  case "ondrop_animation":
  case "onshow_animation":
  case "onhide_animation":
	Document_Element_SetData(element, field, control.value);
	
	var animation = Core_Data_Value("presentation/commands", control.value, "anim");
	if(animation) Document_Element_Animate(element, animation);
  break;
  
  
  case "onclick_sound":
  case "ondrop_sound":
  case "onshow_sound":
  case "onhide_sound":
	Document_Element_SetData(element, field, control.value);
  break;
  
  case "style":	
    var classes = [];
	for(var option of control.options)
	{
     if(option.selected) classes.push(option.value); //Document_CSS_SetClass(element, option.value); else Document_CSS_UnsetClass(element, option.value);
	}
	element.className = classes.join(" ");
  break;
  
  
  case "innerHTML":
  case "value":
	element[field] = control.value;
  break;
  
  
  case "src":
	element[field] = presentation["path"] + "/" + control.value;	
  break;
  
  
  case "url":
	element.src = control.value;
  break;
 }
  
   
   
 Editor_Control_UpdateQuirks(control); 
 
 
 // SAVE ELEMENT
 Editor_Presentation_ElementChanged(element);
}



async function Editor_Presentation_NewShape(item)
{
 var shape  = Document_Element_GetData(item, "uid");
 var data   = Core_Data_Section("editor/shapes", shape);
 var source = Resources_URL("images/shapes/" + data["src"]);
 
 var dest   = Core_State_Get("editor", ["presentation", "path"]);
 
 var src    = await Core_Api("Editor_Import_Resource", {dest, source});
 
 var element = Editor_Presentation_NewElement("shape");
 element.src = src;
}




function Editor_Presentation_NewElement(type, source, data = {})
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 // GET CURRENT PRESENTATION 
 var presentation = Core_State_Get("editor", ["presentation"], {});
 
 
 // GET CURRENT SLIDE
 var slide = Core_State_Get("editor", ["selected-slide"]);
 if(!slide) return;

 
 // DETERMINE INITIAL POSITION
 var x = Safe_Get(presentation, ["mouse", "x"], 0);
 var y = Safe_Get(presentation, ["mouse", "y"], 0);
 var z = Presentation_Slide_FindTopZ(slide, true) + 1;
 
 
 
 // CREATE ELEMENT
 var element = Presentation_Element_Create(undefined, type, data, slide);
 
 element.style.position = "absolute";
 element.draggable      = true;
 
 element.style.left     = x || "10px";
 element.style.top      = y || "10px";
 element.style.zIndex   = z || 0;
 

 // UPDATE SLIDE DISPLAY WITH NEW ELEMENT
 presentation["display"].appendChild(element);

 
 // REFRESH ELEMENT LIST
 Editor_Presentation_ListElements();

 
 // SELECT THE NEWLY CREATED ELEMENT
 Editor_Presentation_SetSelectedElement(element);
 
 
 // SWITCH TO ELEMENTS PANEL
 var header = UI_Element_Find(submodule, "presentation-selector");
 UI_Header_Set(header, "elements", true);
 
 
 // SAVE
 Editor_Presentation_ElementChanged(element);
 
 
 // RETURN THE NEWLY CREATED ELEMENT
 return element;
}



function Editor_Presentation_CopyElement()
{
 // GET CURRENT ELEMENT
 var element = Core_State_Get("editor", ["selected-element"]);
 if(!element) return;
 
 Core_State_Set("editor", ["copied-element"], element);
}




function Editor_Presentation_PasteElement(item)
{
 // GET CURRENT PRESENTATION 
 var presentation = Core_State_Get("editor", ["presentation"], {});
 
 
 // GET COPIED ELEMENT
 var element = Core_State_Get("editor", ["copied-element"]);
 if(!element) return;
 
 
 // DUPLICATE
 var duplicate = Editor_Presentation_DuplicateElement(item, element); 
 
 
 // UPDATE POSITION
 duplicate.style.left = Safe_Get(presentation, ["mouse", "x"], duplicate.style.left);
 duplicate.style.top  = Safe_Get(presentation, ["mouse", "y"], duplicate.style.top);
}



function Editor_Presentation_DuplicateElement(item, element)
{
 // GET CURRENT PRESENTATION 
 var presentation = Core_State_Get("editor", ["presentation"], {});
 
 
 // GET CURRENT SLIDE 
 var slide = Core_State_Get("editor", ["selected-slide"], {});
 
 
 // IF NO EXPLICIT ELEMENT IS PASSED, GET CURRENT ELEMENT
 if(!element) var element = Core_State_Get("editor", ["selected-element"]);
 if(!element) return;
 
 
 // DUPLICATE
 var duplicate          = Presentation_Element_Duplicate(element, slide);
 duplicate.style.left   = parseInt(element.style.left)             + 16; 
 duplicate.style.top    = parseInt(element.style.top)              + 16; 
 duplicate.style.zIndex = Presentation_Slide_FindTopZ(slide, true) + 1;
 
 
 // UPDATE NAME (DUPLICATE ELEMENTS HAVE THE SAME NAME AND WE CAN'T ALLOW IT)
 var name = Document_Element_GetData(duplicate, "name");
 name     = String_Copycount_Next(name);
 Document_Element_SetData(duplicate, "name", name);
 
 
 presentation["display"].appendChild(duplicate);
 
 
 // SELECT THE NEWLY CREATED ELEMENT
 Editor_Presentation_ListElements();
 Editor_Presentation_SetSelectedElement(duplicate);
 
 
 // SAVE ELEMENT RIGHT AWAY
 Editor_Presentation_SaveElement(duplicate, true);
 
 
 return duplicate;
}





async function Editor_Presentation_SetElementMedia()
{ 
 // GET CURRENT PRESENTATION 
 var presentation = Core_State_Get("editor", ["presentation"], {});
 
 // GET CURRENTLY SELECTED ELEMENT
 var selected_element = Core_State_Get("editor", ["selected-element"]);
 if(!selected_element) return;
 
 // SELECT A FILE AND UPLOAD IT TO THE PRESENTATION'S RESOURCES
 var current = Core_State_Get("editor", ["presentation", "resources"], []);
 var files   = await Storage_File_Select();
 if(files && files.length > 0)
 {
  var sources = await Editor_Resources_Upload(files, current);
 
  // ASSIGN NEW RESOURCE TO ELEMENT MEDIA
  selected_element.src = sources[0];
 }
}





function Editor_Presentation_SwitchElementStyle(item)
{
 var selected_element = Core_State_Get("editor", ["selected-element"]);
 if(!selected_element) return;
 
 
 // SWITCH STYLE
 var classid = Document_Element_GetData(item, "uid");
 Document_CSS_SwitchClass(selected_element, classid);
 
 
 // UPDATE ELEMENT DISPLAY (STYLE LISTBOX MUST MATCH THE NEWLY SET STYLE)
 Editor_Presentation_DisplayElement();
 
 
 // MARK ELEMENT FOR SAVE
 Editor_Presentation_ElementChanged(selected_element);
}






function Editor_Presentation_DeleteElement(menu)
{
 // GET CURRENT PRESENTATION 
 var presentation = Core_State_Get("editor", ["presentation"], {});
 
 // GET SELECTED SLIDE INFO
 var slide = Core_State_Get("editor", ["selected-slide"]);
 if(!slide) return;
 
 // SELECTED ELEMENT
 var selected_element = Core_State_Get("editor", ["selected-element"]);
 if(!selected_element) return;
 
 Editor_Presentation_UnselectElement();
 
 // DELETE ELEMENT
 var index = slide["elements"].indexOf(selected_element);
 if(index !== -1)
 {
  slide["elements"].splice(index, 1);
  presentation["display"].removeChild(selected_element);
 }
 
 Editor_Presentation_ListElements();
 
 
 // MARK CURRENT SLIDE AS CHANGED
 Editor_Presentation_SlideChanged();
}




function Editor_Presentation_FullpageElement(menu)
{
 // GET CURRENT PRESENTATION 
 var presentation = Core_State_Get("editor", ["presentation"], {});
 
 // GET SELECTED SLIDE INFO
 var slide = Core_State_Get("editor", ["selected-slide"]);
 if(!slide) return;
 
 // SELECTED ELEMENT
 var selected_element = Core_State_Get("editor", ["selected-element"]);
 if(!selected_element) return;
 
 
 // ENLARGE
 selected_element.style.left   = 0;
 selected_element.style.top    = 0;
 selected_element.style.width  = presentation["width"];
 selected_element.style.height = presentation["height"];
 
 
 // UPDATE ELEMENT DISPLAY
 Editor_Presentation_DisplayElement();
 
 // MARK ELEMENT FOR SAVE
 Editor_Presentation_ElementChanged(selected_element);
 
 // MARK CURRENT SLIDE AS CHANGED
 Editor_Presentation_SlideChanged();
 
 
 // UNSELECT ELEMENT (GOING SUDDENLY FULL PAGE CAN CAUSE PROBLEMS WITH SELECTION / DRAGGING)
 Editor_Presentation_UnselectElement();
}




function Editor_Presentation_SendbackElement(menu)
{
 // SELECTED ELEMENT
 var selected_element = Core_State_Get("editor", ["selected-element"]);
 if(!selected_element) return;

 Presentation_Element_SendToBack(selected_element);

 // UPDATE ELEMENT DISPLAY
 Editor_Presentation_DisplayElement();
 
 // MARK ELEMENT FOR SAVE
 Editor_Presentation_ElementChanged(selected_element);
 
 // MARK CURRENT SLIDE AS CHANGED
 Editor_Presentation_SlideChanged(); 
}




function Editor_Presentation_BringfrontElement(menu)
{
 // SELECTED ELEMENT
 var selected_element = Core_State_Get("editor", ["selected-element"]);
 if(!selected_element) return;
  
 Presentation_Element_BringToFront(selected_element);

 // UPDATE ELEMENT DISPLAY
 Editor_Presentation_DisplayElement();
 
 // MARK ELEMENT FOR SAVE
 Editor_Presentation_ElementChanged(selected_element);
 
 // MARK CURRENT SLIDE AS CHANGED
 Editor_Presentation_SlideChanged(); 
}





function Editor_Presentation_SetSelectedElement(element)
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 var list = UI_Element_Find(submodule, "elements-list"); 
 for(var option of list.options) if(Document_Element_GetObject(option, "element") == element)
 {
  // SELECT ELEMENT
  option.selected = true;
  Editor_Presentation_SelectElement();
	      
  return option;
 }
}




function Editor_Presentation_ElementChanged(element)
{
 if(!element) var element = Core_State_Get("editor", ["selected-element"]);
 if(!element) return;
 
 Document_Element_SetData(element, "changed", "yes");
 Presentation_Element_Snapshot(element);
 
 // IF ELEMENT CHANGED, SLIDE CHANGED AS WELL
 var slide = Document_Element_GetObject(element, "slide");
 if(slide) Editor_Presentation_SlideChanged(slide);
 
 element["changed"] = true;
}





// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                           M E N U S                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//




function Editor_Presentation_MenuElements(menu)
{
 var selected_element = Core_State_Get("editor", ["selected-element"]);
  
 var items = UI_Menu_ListItems(menu);
 for(var id in items)
 {
  var item = items[id];
  
  if(item["tag"] == "new"    && !selected_element) item["state"] = "enabled";
  else
  if(item["tag"] == "modify" && selected_element)  item["state"] = "enabled";
  else
  item["state"] = "hidden";
 }  
}





function Editor_Presentation_MenuStyles(menu)
{
 var selected_element = Core_State_Get("editor", ["selected-element"]);
 
 var items = UI_Menu_ListItems(menu);
 for(var key in items)
 {
  var item = items[key];
  
  if(selected_element && selected_element.className.indexOf(key) != -1) 
  {
   item["icon"] = "check";
  }
  else
  {
   item["icon"] = "";
  }	  
 }
}
