// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                             U I                                                // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



function UI_Element_Component(source)
{
 // DETERMINE PLATFORM IN USE, DEFAULT TO DESKTOP
 var platform = Safe_Get(application, ["state", "core", "platform"], "desktop");  
 
 // GET COMPONENT HTML. IF NOT AVAILABLE FOR THE SPECIFIED PLATFORM, GET IT IN ITS DEFAULT (DESKTOP) VERSION
 var html                = Safe_Get(application, ["html", source, platform], "");
 if(html == "") var html = Safe_Get(application, ["html", source, "desktop"], "");
 if(html == "") var html = "<null></null>";
 
 return html;
}




function UI_Element_Create(source, variables, options = {})
{		
 // GET COMPONENT HTML
 if(options["html"]) 
 {
  var html = source;
 }
 else
 {
  var html = UI_Element_Component(source);
 }
 
 // SEARCH FOR REFERENCE TO CORE COMPONENTS
 var tokens = String_Extract_TagContent(html, "<element", "/>");
 for(var token of tokens)
 {
  // GET COMPONENT NAME (LAST ATTRIBUTE OF THE TAG)	 
  var parts     = token.trim().split(" ");
  var name      = parts[parts.length - 1];
  
  // GET COMPONENT HTML AND BLEND IT WITH CUSTOM TAG ADDITIONAL ATTRIBUTES
  var component  = UI_Element_Component("core/" + name);
  var parts      = String_HTML_SegmentTag(component);
  component      = [parts["head"], parts["content"], token, parts["tail"]].join(" ");
 
 
  // APPLY TEMPLATE VARIABLES
  var sets = String_Extract_TagContent(component, "{", "}");
  for(var set of sets)
  { 
   var obj   = Object_From_String(set);
   component = String_Variables_Set(component, obj);  
  }
 
  
  // REPLACE ORIGINAL CUSTOM TAG WITH BLENDED COMPONENT 
  var tag       = "<element" + token + "/>";
  html          = html.replace(tag, component);
 }
 

 // APPLY ELEMENT'S PARENT MODULE LANGUAGE
 var path = Path_Folder(source);
 html = UI_Language_Apply(html, path + "/module");
 
 // APPLY CORE LANGUAGE
 html = UI_Language_Apply(html, "core/module");
 
 // APPLY OPTIONAL EXTRA LANGUAGE
 if(options["language"])
 {
  html = UI_Language_Apply(html, options["language"]);
 }
 
 // APPLY VARIABLES
 if(variables) html = String_Variables_Set(html, variables);
 
 
 if(options["structure"])
 // SPECIFIC DOM ELEMENT STRUCTURE
 {
  var element       = document.createElement(options["structure"]); 
  element.innerHTML = html;  
 }
 else
 // GENERIC ELEMENT
 {
  var element       = document.createElement(null); 
  element.innerHTML = html;
  element           = element.firstElementChild;
 }
 
 
 // *** ELEMENT HAS NOW BEEN CREATED
 // *** MOVE TO PREPROCESS IT
 
 // COLLECT ALL ELEMENT CHILDREN AND PROCESS THEM FOR AUTODATA FROM SPECIAL TAGS
 var children = Document_Element_Children(element, true);
 for(var child of children)
 { 
  // HAS AN OPTIONS SOURCE?
  var source = Document_Element_GetData(child, "optsource");
  if(source)
  { 
   Document_Select_AddOption(child, "", "");
  
   var page = Core_Data_Page(source);
   var keys = Object.keys(page);
   for(var key of keys)
   {
    var text  = UI_Language_Object(page[key]);
   
    Document_Select_AddOption(child, text, key);
   } 
  }
 }
 
 
 // *** RETURN ASSEMBLED ELEMENT
 return element;
}





function UI_Element_Find(root, uid, options = ["recurse"])
{
 // SPECIAL CASE: IF CALLED WITH ONLY ONE ARGUMENT, WILL TREAT THAT AS UID AND SCAN THE WHOLE DOCUMENT ACCORDINGLY
 if(arguments.length == 1) 
 {
  var uid     = root;
  var root    = document.body;
 }
 
 var element = Document_Element_FindChild(root, "uid", uid, options);


 return element;
}








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          D A T A                                               // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function UI_Element_HasData(element, name)
{
 return element["applicationdata"] && (element["applicationdata"][name] !== undefined);
}





function UI_Element_GetData(element, name)
{
 if(!UI_Element_HasData) return undefined;
 
 return element["applicationdata"][name];
}





// TRACES BACK FROM AN EVENT, LOOKING FOR THE
function UI_Element_TraceData(event, dataname, datavalue)
{
 var root = Document_Event_Source(event);
 if(!root) return undefined;
}





function UI_Element_SearchData(root, dataname, datavalue)
{
}



function UI_Value_FromDatapage(element, page, value)
{
 if(typeof page == "string") var page = Core_Data_Page(page);
 var item = page[value] || {};
 
 element.value = UI_Language_Object(item);
}



function UI_Select_FromConfig(select, config)
{
 var data = Core_Config(config);
 
 for(var key in data)
 {
  var option   = new Option();
  option.text  = UI_Language_Object(data[key]);
  option.value = key;
  
  select.appendChild(option);
 }
}



function UI_Select_FromDatapage(select, page, category_field, categories = {}, category_style = "", filter)
{
 if(typeof page == "string") var page = Core_Data_Page(page);
 
 var catalog = {};
 
 // IF NO CATEGORY SPECIFIED, JUST GROUP ALL THE DATAPAGE TOGETHER
 if(!category_field)
 {
  catalog["*"] = page;
 }
 else
 // OTHERWISE ORGANIZE BY CATEGORY
 {
  for(var id in page)
  {
   var item     = page[id];
  
   var category = item[category_field];
   if(!catalog[category]) catalog[category] = {};
  
   catalog[category][id] = item;
  }
 }
 
 
 // CREATE OPTIONS
 for(var category in catalog)
 {
  // IF NO CATEGORY, DON'T ADD AN HEADER AND NO NEED FOR A SPACE BETWEEN CATEGORIES 
  if(category == "*")
  {
   var addspace = false;
  }
  else
  // OTHERWISE CREATE A HEADER FOR THIS CATEGORY, AND ADD A SPACE AFTER ALL ITS ITEMS
  {
   var text        = UI_Language_Object(categories[category]) || category;
   var value       = category;
   var option      = Document_Select_AddOption(select, text, value); 
   option.disabled = true;
   Document_CSS_SetClass(option, category_style);
   
   var addspace = true;
  }

  
  // CATEGORY OPTIONS
  for(var id in catalog[category])
  {  
   var item = catalog[category][id];
   
   if(!filter || filter(item))
   {
    var text   = UI_Language_Object(item);
    var value  = id;
    var option = Document_Select_AddOption(select, text, value); 
   }
  }
  
  
  // BLANK SPACE NEEDED?
  if(addspace)
  {
   var option      = Document_Select_AddOption(select, "", "");
   option.disabled = true;
  }
  
 }
}








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                        P O P U P S                                             // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



async function UI_Popup_Create(data = {}, buttons = [], template = "core/popup-standard", config = {open:true, escape:true})
{	
 // LAYER: DARK BACKGROUND    WHITESPACE: ON TOP OF THE BACKGROUND    WINDOW: INSIDE WHITESPACE
 var popup      = UI_Element_Create("core/layer-glass-thin");
 Document_Element_SetObject(popup, "data",   data);
 Document_Element_SetObject(popup, "config", config);
 
 // THE POPUP ITSELF
 if(!template.includes("/"))
 {
  template = "core/popup-" + template;
 }
 
 var whitespace = UI_Element_Find(popup, "layer-front");
 var win        = UI_Element_Create(template, data); 
 Document_Element_SetData(win, "uid", "popup-window");
 
 
 // COLLAPSE UNSET ELEMENTS
 for(var id of ["title", "subtitle", "picture"])
 {
  if(!data[id]) 
  {
   var element = UI_Element_Find(win, id);
   if(element) 
   {
	//element.style.display = "none";
    element.remove();
   }
  }
 }
 
 
 // CONTENT
 var content   = Safe_Get(data, ["content"], "");
 var container = UI_Element_Find(win, "content");
 
 // NO CONTENT
 if(!content)
 {
  //container.style.display = "none";
 }
 else
 // EXPLICIT ELEMENT TO APPEND INSIDE
 if(typeof content == "object")
 {
  if(container) container.appendChild(content); else win.appendChild(content);
 }
 else
 // INTERPRET CONTENT TEXT
 {
  switch(content)
  {
   case "input":
		//data["placeholder"];
		var input = UI_Element_Create("core/control-edit-popup");
		Document_Element_SetData(input, "uid", "input");
		
		if(data["placeholder"]) input.placeholder = data["placeholder"];
		
		container.appendChild(input);
   break;
   
   case "select":
		//data["options"]
		var select = UI_Element_Create("core/control-dropdown-popup");
		Document_Element_SetData(select, "uid", "select");
		
		container.appendChild(select);
   break;
   
   // CONTENT = PURE TEXT
   default:
		container.innerHTML = content;
   break;
  }
 }
 
 
 // WHITESPACE IS THE TOPMOST EVELEMENT SO APPEND AND ATTACH POPUP DATA TO IT
 whitespace.appendChild(win);
 Document_Element_SetObject(whitespace, "popup", popup);
 
 
 // ESCAPE: AUTOMATICALLY CLOSE THE POPUP IF CLICKED OUTSIDE CONTENT AREA
 if(config["escape"])
 {
  whitespace.onclick =
  async function(event)
  {
   // PROCESS ONLY IF DIRECT CLICK ON WHITESPACE	    
   if(event.srcElement != event.currentTarget) return;
   
   var popup = Document_Element_GetObject(event.currentTarget, "popup");
	
   // IF ESCAPE IS A FUNCTION, USE IT TO CHECK WHETHER TO ACTUALLY ESCAPE OR NOT (USEFUL FOR CONFIRMATION EXITS)	 
   if(typeof config["escape"] == "function") var proceed = await config["escape"](); else var proceed = true; 	 
   
   if(proceed)
   {	   
    UI_Popup_Close(popup);
	
    var data     = Document_Element_GetObject(popup, "data");
    var onescape = data["onescape"];
    if(onescape) onescape(popup);
   }
   
  }
 }
 
 
 // IF BUTTONS DEFINED, ADD BUTTONS
 var container = UI_Element_Find(win, "buttons");
 if(container)
 {
  if(buttons && buttons.length > 0)
  {
   for(let button of buttons)
   {   
    // LINK BUTTON TO POPUP
	var button_template = button["template"] || "button-popup-plain";
	
    var element = UI_Element_Create("core/" + button_template, {text:button["text"]});
    Document_Element_SetObject(element, "popup", popup);
    
	
    // DETERMINE BUTTON ACTION (STANDARD ACTIONS OR CUSTOM EVENT)
    switch(button["onclick"])
    {
	 case "close": 
		  element.onclick = 
		  function(event)
		  {
		   var popup = Document_Element_GetObject(event.currentTarget, "popup");
           UI_Popup_Close(popup);
		  }
	 break;
	   
     default:
		 element.onclick = 
		 function(event)
		 {
	      var popup = Document_Element_GetObject(event.currentTarget, "popup"); 
	      button["onclick"](popup);
 	 	 }
 	 break;
    }
   
    // ADD BUTTON
    container.appendChild(element);
   }
  }
  else
  {
   container.style.display = "none";
  }
 }
 
 
 // IMMEDIATELY OPEN ON CREATION, IF SO CONFIGURED
 if(config["open"]) 
 { 
  console.log("opening... ");
  await UI_Popup_Show(popup, config);
  console.log("opened");
 }	 
 
 
 return popup;
}






async function UI_Popup_Show(popup, config)
{
 var config = config || Document_Element_GetObject(popup, "config");
 
 // BLUR THE BACKGROUND
 var body = UI_Element_Find(document.body, "main-body");
 Document_CSS_SetClass(body, "style-blurred-medium");


 // SHOW POPUP
 document.body.appendChild(popup);
 
 
 if(!config["instant"]) 
 {
  var win       = UI_Element_Find(popup, "popup-window");
  var animation = config["animation"] || "zoomIn 0.125s linear 1";
  
  await Document_Element_Animate(win, animation);
 }
}




async function UI_Popup_Close(popup)
{
 var config  = Document_Element_GetObject(popup, "config");
  
 // UNBLUR THE BACKGROUND
 var body = UI_Element_Find(document.body, "main-body");
 Document_CSS_UnsetClass(body, "style-blurred-medium");

 
 // REMOVE POPUP
 popup.remove();

 
 // CALL ONCLOSE EVENT IF PRESENT
 var onclose = config["onclose"];
 
 if(onclose) onclose(popup);
}





async function UI_Popup_Input(title, subtitle, picture, placeholder)
{
 var promise = new Promise(async(resolve, reject) =>
 {
  var button = 
  { 
   text   : UI_Language_String("core/popups", "button ok"), 
   onclick: 
   async function(popup)
   {
	var input = UI_Element_Find(popup, "input");
    var value = input.value;
	
    await UI_Popup_Close(popup);
	
	resolve(value);
   }
  };
	
  await UI_Popup_Create(
  {
   title:    title, 
   subtitle: subtitle, 
   picture:  picture,
   content:  "input",
   placeholder,
   onescape: 
   function(popup)
   {
	resolve(false);
   }
  },

  [
   button 
  ]);
  
 });
 
 return promise;
}



async function UI_Popup_Select(title, subtitle, picture, options, selected)
{
 var promise = new Promise(async(resolve, reject) =>
 {
  var button = 
  { 
   text   : UI_Language_String("core/popups", "button ok"), 
   onclick: 
   async function(popup)
   {
	var select = UI_Element_Find(popup, "select");
	var option = Document_Select_SelectedOption(select);
    var value  = option.value;
	
    await UI_Popup_Close(popup);
	
	resolve(value);
   }
  };
	
  var popup = await UI_Popup_Create(
  {
   title:    title, 
   subtitle: subtitle, 
   picture:  picture,
   content:  "select",
   onescape: 
   function(popup)
   {
	resolve(false);
   }
  },

  [
   button 
  ]);
  
  var select = UI_Element_Find(popup, "select");
  for(var option of options)
  {
   var text  = option["text"];
   var value = option["value"];

   Document_Select_AddOption(select, text, value);
  }
  
  if(selected) select.value = selected;
 });
 
 return promise;
}



async function UI_Popup_Confirm(title, content, picture)
{
 var promise = new Promise((resolve, reject) =>
 {
  var button_yes = 
  { 
   text   : UI_Language_String("core/popups", "button yes"), 
   onclick: 
   function(popup)
   {
    UI_Popup_Close(popup);
	
	resolve(true);
   }
  };
  
  var button_no = 
  { 
   text   : UI_Language_String("core/popups", "button no"), 
   onclick: 
   function(popup)
   {
    UI_Popup_Close(popup);
	
	resolve(false);
   }
  };

  UI_Popup_Create(
  {
   title, 
   content, 
   subtitle: "",
   picture,
   onescape: 
   function(popup)
   {
	resolve(false);
   }
  },

  [
   button_yes,
   button_no   
  ]);
  
 });
 
 return promise;
}





async function UI_Popup_Code(title, content, picture, code)
{
 var promise = new Promise((resolve, reject) =>
 {
  var button_confirm = 
  { 
   text   : UI_Language_String("core/popups", "button confirm"), 
   onclick: 
   async function(popup)
   {
    var input = UI_Element_Find(popup, "code");
	if(input.value == code)
	{
	 UI_Popup_Close(popup);
     resolve(true);
	}
	else
    {  
     await Document_Element_Animate(input, "headShake 0.75s linear 1");
     input.value = "";
	}
   }
  };
  
  UI_Popup_Create(
  {
   title, 
   content, 
   subtitle: "",
   picture,
   onescape: 
   function(popup)
   {
	resolve(false);
   }
  },

  [
   button_confirm,
  ],
  
  "core/popup-standard-code");
  
 });
 
 return promise;
}





async function UI_Popup_Intermission(title, content, picture, timer)
{
 var promise = new Promise(async (resolve, reject) =>
 {
  var button_ok = 
  { 
   text     : UI_Language_String("core/popups", "button ok"), 
   
   template : "button-large-plain",
   
   onclick  : 
   function(popup)
   {
    UI_Popup_Close(popup);
	
	resolve(true);
   }
  };
 

  if(!picture && typeof content == "object") var template = "content"; else var template = "standard";
  
  var popup   = await UI_Popup_Create({title, content, picture}, [button_ok], "core/popup-intermission-" + template, {open:false, escape:false});
  
  
  var buttons = UI_Element_Find(popup, "buttons");
  if(timer)
  {  
   buttons.style.visibility = "hidden";
   
   setTimeout(
   function()
   {
	buttons.style.visibility = "visible";
	
	Document_Element_Animate(buttons, "bounceIn 1s 1");
	
	
   }, Math.round(timer * 1000));
  }
  
  await UI_Popup_Show(popup);
 });
 
 return promise;
}




async function UI_Popup_Alert(title, content, picture)
{
 var promise = new Promise((resolve, reject) =>
 {
  var button_ok = 
  { 
   text   : UI_Language_String("core/popups", "button ok"), 
   onclick: 
   function(popup)
   {
    UI_Popup_Close(popup);
	
	resolve(true);
   }
  };
  
 
  UI_Popup_Create(
  {
   title, 
   content, 
   subtitle: "",
   picture,
   onescape: 
   function(popup)
   {
	resolve(false);
   }
  },

  [
   button_ok,
  ]);
  
 });
 
 return promise;
}



async function UI_Popup_SelectData(title, data = [], fields = {}, language)
{
 var promise = new Promise((resolve, reject) =>
 { 
  var content = UI_Element_Create("core/popup-select-box");
  var table   = UI_Table_Data(data, fields, language)
  content.appendChild(table);
 
  var onclick = 
  function(popup)
  {
   UI_Popup_Close(popup);
   
   var row = Document_Element_GetObject(table, "selected-row");
   if(row)
   {
	var item = Document_Element_GetObject(row, "item");
   }
   else
   {
	var item = false;
   }
   
   resolve(item);
  }

  var onescape =
  function()
  {
   resolve(false);
  }
 
  var button_caption = UI_Language_String("core/popups", "button select");
  
  UI_Popup_Create({title, content}, [{text:button_caption, onclick}], "flexi", {escape:true, open:true, onescape});  
 });
 
 return promise;
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         M E N U S                                              // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function UI_Menu_Create(uid, items = {}, events = {}, options = {})
{
 var menu = UI_Element_Create("core/menu-plain", {uid:uid});

 Document_Element_SetObject(menu, "items",  items);
 Document_Element_SetObject(menu, "events", events);
 
 return menu;
}





function UI_Menu_Build(menu)
{
 menu.innerHTML = "";
 
 var items = Document_Element_GetObject(menu, "items");
 
 var uids = Object.keys(items);
 for(var uid of uids)
 {
  var item = items[uid];
 
  UI_Menu_AddItem(menu, uid, item["icon"], item["text"], item["state"], item["func"], item["submenu"], item["tag"]);
 }
}




function UI_Menu_GetItems(menu)
{
 return Document_Element_GetObject(menu, "items");
}




function UI_Menu_Assign(element, menu, options)
{  
 Document_Element_SetObject(element, "menu", menu);
 
 element.oncontextmenu =
 function(event)
 { 
  event.preventDefault();
  
  var x = event.pageX;
  var y = event.pageY;
  
  menu["source-parent"] = event.currentTarget;
  menu["source-target"] = event.target;
  
  UI_Menu_Show(menu, x, y, options, event);
 }
}




function UI_Menu_GetItem(menu, id)
{
 var items = Document_Element_GetObject(menu, "items");
 
 return items[id];
}





function UI_Menu_ListItems(menu, id)
{
 var items = Document_Element_GetObject(menu, "items");
 
 return items;
}





function UI_Menu_AddItem(menu, uid, icon, text, state, func, submenu, tag)
{
 
 switch(state)
 {
  case "enabled": 
   var template = "enabled";
   var visible  = true;   
   var enabled  = true;
  break;
  
  case "disabled":
   var template = "disabled";
   var visible  = true;   
   var enabled  = false;
  break;
  
  case "hidden":
	var template = "enabled";
	var visible  = false;   
	var enabled  = false;
  break;
  
  default:
	var visible = true;
  break;
 }
 
 
 // NO TEXT = SPACER
 if(!text) 
 {
  var template = "spacer";
  var enabled  = false;
 }
 
 
 
 // CREATE ITEM
 var element = UI_Element_Create("core/menu-item-" + template, {uid:uid, icon:icon, text:text}); 
 if(!visible) element.style.display = "none";

 // ICON TRICK: IF ICON LENGTH = 1 THEN IT'S AN EXPLICIT ICON, NOT A FONTAWESOME CODE. ADJUST ACCORDINGLY
 if(icon && String_Unicode_Length(icon) == 1)
 {
  var component = UI_Element_Find(element, "icon");
  Document_CSS_PurgeClasses(component, "fa-");
  component.innerHTML = icon;
 }
 
 // ICON TRICK: IF ICON NAME CONTAINS ".svg" THEN IT'S A SVG GLYPH
 if(icon && icon.includes(".svg"))
 {
  var component = UI_Element_Find(element, "icon");
  Document_CSS_PurgeClasses(component, "fa-");
  component.innerHTML = "<img src = '" + icon + "' style = 'width:100%; height:100%'></img>";
 }
 
 
 // LINK MENU
 Document_Element_SetObject(element, "menu", menu);


 // ATTACH TAG
 Document_Element_SetObject(element, "tag", tag);


 // ATTACH FUNCTION
 if(func)
 {
  Document_Element_SetObject(element, "func", func);
 }
 
 

 // IF ENABLED AND VISIBLE, MANAGE ITEM'S ONCLICK
 if(enabled && visible)
 {
  // ATTACH SUBMENU IF PRESENT
  if(submenu)
  {
   // SHOW SUBMENU SELECTOR
   UI_Element_Find(element, "submenu").style.visibility = "visible";
   
   // ATTACH SUBMENU TO ELEMENT
   Document_Element_SetObject(element, "submenu", submenu);
  }
   
  // ON CLICK
  element.onclick = UI_Menu_OnClick;
 }
 
 
 // ATTACH TO MENU
 menu.appendChild(element);
}




function UI_Menu_Show(menu, x, y, options = {}, event)
{
 // IF THIS IS A TOP LEVEL MENU, CLOSE ALL OTHERS FIRST
 if(!Document_Element_GetObject(menu, "parent-menu")) UI_Menu_CloseAll();
 
 
 // AN EMPTY MENU DOESN'T EVEN GET SHOWN
 var items = Document_Element_GetObject(menu, "items");
 if(Object.keys(items).length < 1) return;
 	
	
 // ON SHOW
 var events  = Document_Element_GetObject(menu, "events");
 if(events["onshow"]) events["onshow"](menu, event);
	
	
 // RENDER AND DISPLAY
 UI_Menu_Build(menu);
 
 
 // INITIALLY INVISIBLE
 menu.style.visibility = "hidden";
 document.body.appendChild(menu);
 
 
 // CALCULATE POSITION AND SIZE
 var style  = window.getComputedStyle(menu); 
 var width  = Math.floor(parseFloat(style.width));
 var height = Math.floor(parseFloat(style.height)); 
 

 // TRY DIFFERENT OPENING DIRECTIONS, ATTEMPTING TO AVOID CLIPPING
 var forcedirection = options["direction"];

 if(forcedirection) var directions = [forcedirection]; else var directions = ["top right", "bottom right", "top left", "bottom left"];
 
 for(var direction of directions)
 {
  Document_Element_SetData(menu, "showdirection", direction);
 
  switch(direction)
  {
   case "top":
	 menu.style.left = x;
	 menu.style.top  = y - height / 2;
   break;
   
   case "top right":
	 menu.style.left = x;
	 menu.style.top  = y - height;
   break;
  
   case "bottom right":
	menu.style.left = x;
	menu.style.top  = y;
   break;
   
   case "bottom":
	menu.style.left = x - width / 2;
	menu.style.top  = y;
   break;
  
   case "bottom left":
	 menu.style.left = x - width;
 	 menu.style.top  = y;
   break;
  
   case "top left":
	 menu.style.left = x - width;
	 menu.style.top  = y - height;
   break;
  }
  
  if(forcedirection || Document_Element_IsVisible(menu)) break;
 }

 
 // ACTUALLY SHOW
 menu.style.visibility = "visible";
 Document_Element_Animate(menu,  "fadeIn 0.125s linear 1");
 
 menu["status"] = "open";
 
 UI_Menu_GlobalCloser();
}




function UI_Menu_Close(menu, options = [])
{
 // REMOVE MENU FROM SCREEN
 if(menu.parentElement) menu.parentElement.removeChild(menu);
 menu["status"] = "closed";
    
 
 // IF MENU WAS OPENED BY ANOTHER MENU, MUST CLOSE THAT MENU AS WELL UNLESS OPTIONS DICTATE DIFFERENTLYY
 var parent = Document_Element_GetObject(menu, "parent-menu");
 if(parent && !options.includes("noparent")) 
 {
  Document_Element_SetObject(menu, "parent-menu", undefined);
  
  UI_Menu_Close(parent); 
 }
 
 
 // IF MENU HAS A SUBMENU OPENED, CLOSE IT UNLESS OPTIONS DICTATE DIFFERENTLY
 var submenu = Document_Element_GetObject(menu, "submenu");
 if(submenu && !options.includes("nosub"))
 {
  Document_Element_SetObject(menu, "submenu", undefined);
  
  UI_Menu_Close(submenu);
 }
}




function UI_Menu_CloseAll()
{
 var menus = Document_Element_FindChildren(document.body, "uielement", "menu");
 
 for(var menu of menus) if(menu && menu.parentElement) menu.parentElement.removeChild(menu);
}




function UI_Menu_OnClick(event)
{
 event.stopPropagation();
 var item = event.currentTarget;
 
 var menu    = Document_Element_FindParent(item, "uielement", "menu");
 var submenu = Document_Element_GetObject(item, "submenu");
 
 // IF THE ITEM HAS A SUBMENU, DISPLAY IT
 if(submenu)
 {
  // SEE IF THE CLICKED MENU ALREADY HAS AN OPENED SUBMENU
  var current = Document_Element_GetObject(menu, "submenu");
  if(current)
  {  
   UI_Menu_Close(current, ["noparent"]);
  }
  
	 
  // DETERMINE ORIGIN BASED ON ITEM POSITION	 
  var rect = UI_Element_Find(item, "submenu").getBoundingClientRect();  //console.log(rect);
  var x    = rect.right;
  var y    = rect.top;
  
  // LINK PARENT TO CHILD
  Document_Element_SetObject(menu,    "submenu",     submenu);
  Document_Element_SetObject(submenu, "parent-menu", menu);
  
  // DETERMINE SUBMENU DIRECTION. TOP OR BOTTOM MUST BE PRESERVED, BUT IT SHOULD ALWAYS SHOW TO THE RIGHT
  var direction = Document_Element_GetData(menu, "showdirection");
  direction = direction.replace("left",   "right");
  direction = direction.replace("middle", "right");
  
  UI_Menu_Show(submenu, x, y, {direction:direction}, event);
 }
 else
 // CALL FUNCTION AND CLOSE MENU
 {  
  if(menu) UI_Menu_Close(menu); 
 
  var func = Document_Element_GetObject(item, "func");
  if(func) func(item); 
 }	 

}





function UI_Menu_GlobalCloser()
{
 if(Document_Element_GetObject(document, "menu-globalcloser")) return;
 
 var handler = document.addEventListener("click", 
 function()
 {
  Document_Element_SetObject(document, "menu-globalcloser", undefined);
  UI_Menu_CloseAll();
 }, 
 {capture:false, once:true});
 
 Document_Element_SetObject(document, "menu-globalcloser", handler);
}





function UI_Menu_FromDatapage(id, page, category_field, categories = {}, handler = false)
{
 // BUILD CATALOG OF CATEGORIES AND THEIR ITEMS
 var catalog = {};
 for(var id in page)
 {
  var item = page[id];
  
  var category = item[category_field];
  if(!catalog[category]) catalog[category] = {};
  
  catalog[category][id] = item;
 }
 
 // PARSE ITEMS
 var items = {};
 for(var category in catalog)
 {
  // MAIN ITEMS - REPRESENTING CATEGORIES
  var item      = {};
  
  item["text"]  = UI_Language_Object(categories[category]);
  item["state"] = "enabled";
  item["icon"]  = categories[category]["icon"] || false;
   
  // SUBMENU FOR THIS MAIN (CATEGORY) ITEM
  var sub_items = {}; 
  for(var id in catalog[category])
  {
   var sub_item = {};
  
   sub_item["text"]  = UI_Language_Object(catalog[category][id]);
   sub_item["state"] = "enabled";
   sub_item["func"]  = handler;
  
   sub_items[id] = sub_item;
  }
  
  // CREATE SUBMENU
  item["submenu"] = UI_Menu_Create(id, sub_items, 
  {
   onshow: Editor_Presentation_MenuStyles
  });
  
  // MAIN ITEM MENU
  items[category] = item;
 }
 
 // FINALLY CREATE THE MAIN MENU
 var menu  = UI_Menu_Create("element-style", items);
 
 return menu;
}




function UI_Menu_FromObject(id, obj, category_field = false, handler = false)
{ 
 var items = {};
 
 // IF CATEGORY FIELD SET, COLLECT KEYS IN A STRUCTURED MANNER
 if(category_field)
 {
  // FIRST CATALOGUE CATEGORIES
  var catalog = {};
  for(var key in obj)
  {
   var category = obj[key][category_field];
   if(category) Safe_Push(catalog, category, key);
  }
  
  
  // NOT PUT KEYS IN A SEQUENCES BY CATEGORY, AND WITH SEPARATORS BETWEEN CATEGORIES
  var keys       = [];
  var categories = Object.keys(catalog);
  for(var i = 0; i < categories.length; i++) 
  {
   // ADD ALL KEYS IN THIS CATEGORY
   for(var key of catalog[categories[i]]) keys.push(key);
   
   // IF NOT LAST CATEGORY IN THE CATALOG, ADD A SEPARATOR ITEM
   if(i < categories.length - 1)
   {
	// THIS REPRESENTS A SEPARATOR
	keys.push(false);
   }	   
  }
 }
 else
 // NO CATEGORY FIELD SET, SIMPLY COLLECT OBJECT'S KEYS
 {
  var keys = Object.keys(obj);
 }
 
 
 // PARSE OBJECT AND CREATE ITEMS
 var sc = 0;
 for(var key of keys)
 {
  var item = {};
  
  if(!key)
  {
   // SEPARATOR
   var id = "separator " + sc; 
   sc     = sc + 1;
  }
  else
  {
   var id        = key;
   item["text"]  = UI_Language_Object(obj[key]);
   item["icon"]  = obj[key]["icon"] || false;
   item["state"] = "enabled";
   item["func"]  = handler;
  }
  
  items[id] = item;
 }
 
 
 // CREATE THE MENU
 var menu  = UI_Menu_Create(id, items);
 return menu;
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                        T A B L E S                                             // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function UI_Table(style = "standard", config = {})
{
 var table = document.createElement("table");
 Document_CSS_SetClass(table, "table-" + style);
 
 Document_Element_SetData(table,   "style",  style);
 Document_Element_SetObject(table, "config", config);

 var cells = [];
 Document_Element_SetObject(table, "cells", cells);
 
 if(config["fixed"])
 {
  table.style.height = "auto";
 }
 
 if(config["seamless"])
 {
  table.style.borderCollapse = "collapse";
 }
 
 return table;
}



function UI_Table_Row(table, config = {}, onclick)
{
 var style = Document_Element_GetData(table, "style");
 
 var row   = document.createElement("tr");
 Document_CSS_SetClass(row, "table-" + style + "-row");
 Document_Element_SetData(row,   "style", style);
 Document_Element_SetObject(row, "table", table);
 Document_Element_SetObject(row, "config", config);
 Document_Element_SetObject(row, "onclick", onclick);
 
 if(config["fixed"])
 {
  row.style.position = "sticky";
  row.style.top      = "0";
 }
 
 
 if(config["selectable"])
 { 
  Document_CSS_SetClass(row, "effect-highlight-accented");
  
  row.onclick = 
  function(event)
  {
   var row   = event.currentTarget;
   var table = row.parentElement;
   
   Document_Conditional_Class(table, "style-highlight-accented", row);
   Document_Element_SetObject(table, "selected-row", row);
   
   var onclick = Document_Element_GetObject(row, "onclick");
   if(onclick) onclick(event);
  }
 }
 
 table.appendChild(row);
 return row;
}



function UI_Table_Cell(row, config = {type:"cell"})
{
 var style = Document_Element_GetData(row, "style");
 var table = Document_Element_GetObject(row, "table");
 var cells = Document_Element_GetObject(table, "cells");
 
 var type    = config["type"] || "cell";
 var onclick = config["onclick"];
 
 var cell  = document.createElement("td");
 
 var row_config = Document_Element_GetObject(row, "config");
 if(row_config["selectable"])
 {
  cell.style.backgroundColor = "inherit";
  cell.style.color           = "inherit";
 }
 
 Document_CSS_SetClass(cell, "table-" + style + "-" + type);
 Document_Element_SetData(cell, "style", style);
 
 if(onclick)
 {
  Document_CSS_SetClass(cell, "style-clickable");
  cell.onclick = onclick;
 }
 
 cells.push(cell);
 
 row.appendChild(cell);
 return cell;
}





function UI_Table_Data(data = [], fields = {}, language, events = {}, actions = false)
{
 var table = UI_Table("standard", {seamless:true, fixed:true});
 
 // HEADER
 var row = UI_Table_Row(table, {fixed:true});
 for(var field in fields)
 {
  var cell             = UI_Table_Cell(row, {type:"header"});   
  cell.style.textAlign = "left";
  
  cell.innerHTML = UI_Language_String(language, field, "");
  
  if(events[field])
  {
   cell.onclick = events[field];
   
   Document_CSS_SetClass(cell, "style-clickable");
   Document_Element_SetData(cell, "field", field);
  }
 }
 
 // IF AN ACTION SET IS DEFINED, ADD AN EMPTY CELL TO THE HEADER
 if(actions)
 {
  var cell  = UI_Table_Cell(row, {type:"header"});  
 }
 
 
 
 // ROWS
 for(var item of data)
 {
  var row = UI_Table_Row(table, {selectable:true}, events["row"]);
  Document_Element_SetObject(row, "item", item);
   
  var i = 0; 
  for(var field in fields)
  {
   var cell             = UI_Table_Cell(row);
   cell.style.textAlign = "left";
    
   // HOW TO DEAL WITH THE CONTENT OF THIS FIELD?
   switch(typeof fields[field])
   {
    // IF FIELD EQUIPPED WITH A FUNCTION: CALL THE FUNCTION TO DETERMINE CONTENT
	case "function": 
		var value = fields[field](item[field]);
    break;
   
    // IF FIELD EQUIPPED WITH AN OBJECT: USE IT AS A DATAPAGE TO DECODE THE VALUE
    case "object":
		var obj   = fields[field][item[field]];
		var value = UI_Language_Object(obj, item[field]);
    break;

    // DIRECT CONTENT
    default:	
		var value = item[field]; 
	break;
   }
   
   cell.innerHTML = value || "";
   i++;
  }
  
  // IF AN ACTION SET IS DEFINED, ADD A CELL WITH ACTION ICONS
  if(actions)
  {
   var cell  = UI_Table_Cell(row, {type:"actions"});  
   for(var id in actions)
   {
	var action  = actions[id];
   
	var element = document.createElement("li");
	Document_CSS_SetClass(element, "style-clickable");
	Document_CSS_SetClass(element, "fa");
	Document_CSS_SetClass(element, "fa-" + action["icon"]);
	
	Document_Element_SetObject(element, "action", action);
	Document_Element_SetObject(element, "item",   item);
	Document_Element_SetObject(element, "row",    row);
	
	element.onclick = 
	function(event)
	{	 
	 var element = event.currentTarget;
	 var action  = Document_Element_GetObject(element, "action");
	 var item    = Document_Element_GetObject(element, "item");
	 var row     = Document_Element_GetObject(element, "row");
	 
     if(action["onclick"]) 
	 {
	  event.stopPropagation();
	
	  action["onclick"](item, row);
	 }
    }
	
	cell.appendChild(element);
   }
  }
 }
 
 return table;
}	






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     H E A D E R S                                              // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function UI_Header(id, items = {}, options = {})
{
 var template = options["template"] || "standard";
 
 var header   = UI_Element_Create("core/header-" + template);
 var labels   = UI_Element_Find(header, "labels");
 var selected = false;
 
 Document_Element_SetData(header,   "uid",     id);
 Document_Element_SetObject(header, "options", options);
 
 if(Object.keys(items).length > 1) Document_Element_SetData(header, "multi", true); 
 
 for(var id in items)
 {
  var item               = items[id];
  item["id"]             = id;
  
  var label              = document.createElement("div");
  label.innerHTML        = item["text"];
  if(!selected) selected = label;        // AUTOSELECT FIRST LABEL
  
  if(item["color"])
  {
   label.style.color = item["color"];
  }
  
  Document_Element_SetData(label,   "uid", id);
  Document_Element_SetObject(label, "item",   item);
  Document_Element_SetObject(label, "header", header); 
  Document_CSS_SetClass(label,      "style-clickable");
  
  // WHEN A HEADER LABEL (LEFT SIDE) IS CLICKED, LOAD ITS ICONS AND CALL THE ASSOCIATED FUNCTION IF ANY 
  label.onclick =
  function(event)
  { 
   var element = event.currentTarget;
   var item    = Document_Element_GetObject(element, "item");
   var header  = Document_Element_GetObject(element, "header");
   
   Document_Element_SetObject(header, "selected", element);
   
   UI_Header_Update(header);
   
   if(item["onclick"]) item["onclick"](item);
  }
  
  if(item["disabled"]) Document_Element_Disable(label, "style-disabled");
  labels.appendChild(label);
 }
 
 
 if(options["selectfirst"])
 {
  Document_Element_SetObject(header, "selected", selected);
  UI_Header_Update(header);
 
  var item = Document_Element_GetObject(selected, "item");
  if(item["onclick"]) item["onclick"]();
 }
 
 return header;
}





function UI_Header_Update(header)
{
 var options  = Document_Element_GetObject(header,   "options");
 var selected = Document_Element_GetObject(header,   "selected");
 var item     = Document_Element_GetObject(selected, "item");
 
 if(!item) return;
 
 // IF THIS HEADER HAS MULTIPLE LABELS, UNDERLINE THE CURRENTLY SELECTED LABEL, DE-UNDERLINE ALL OTHERS
 if(Document_Element_GetData(header, "multi"))
 { 
  var labels   = UI_Element_Find(header, "labels");
  
  // UNDERLINING
  Document_Conditional_Class(labels, "style-underlined", selected); 
  
  // EXTRA CLASS
  if(options["css"])
  {
   Document_Conditional_Class(labels, options["css"], selected); 
  }
 }
   
 // DISPLAY ICONS FOR THIS LABEL
 var glyphs       = UI_Element_Find(header, "icons");
 glyphs.innerHTML = "";
   
 var icons = item["icons"] || [];
 for(var icon of icons)
 {
  var glyph = document.createElement("li");
  Document_CSS_SetClass(glyph, "fa-solid");
  Document_CSS_SetClass(glyph, "fa-" + icon["icon"]);
	
  var func = icon["onclick"];
  if(func)
  {
   Document_CSS_SetClass(glyph, "style-clickable");
   glyph.onclick = func;
  }
   
  glyphs.appendChild(glyph);
 }
 
}




function UI_Header_Set(header, tab, autoclick)
{
 var selected = UI_Element_Find(header, tab);
 Document_Element_SetObject(header, "selected", selected);
 
 UI_Header_Update(header);
 
 if(selected && autoclick) 
 {
  var item = Document_Element_GetObject(selected, "item");
  if(item["onclick"]) item["onclick"](item);
 }
}




function UI_Header_Disable(header, tab)
{
 var selected = UI_Element_Find(header, tab);
 
 Document_CSS_SetClass(selected, "style-disabled");
 selected.style.pointerEvents = "none";
}



function UI_Header_Enable(header, tab)
{
 var selected = UI_Element_Find(header, tab);
 
 Document_CSS_UnsetClass(selected, "style-disabled");
 selected.style.pointerEvents = "";
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          L I S T S                                             // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function UI_List_Items(items, selectedstyle, onselect, options = {style:"vertical", overflow:true}, itemcreator, sectioncreator)
{
 var style = options["style"] || "vertical";
 
 var itemlist = UI_Element_Create("core/itemlist-" + style);
 Document_Element_SetObject(itemlist, "selectedstyle", selectedstyle);
 Document_Element_SetObject(itemlist, "onselect", onselect);
 
 //if(options["overflow"]) itemlist.style.overflow = "";
 
 var select =
 function()
 {
  if(!options["selected"]) return;
  
  for(var element of itemlist.children)
  {
   var item = Document_Element_GetObject(element, "itemlist-item");
   if(item == options["selected"])
   {
	Document_CSS_SetClass(element, options["highlight"] || "style-outlined-alert"); 
	Document_Element_Animate(element, "flash 1.5s") ;
	
	element.scrollIntoView({behavior: "smooth", block: "center"});
   }	   
  }
 }
 
 if(options["sections"])
 {
  var sections = true;
  var catalog  = Array_Catalog_ByField(items, options["sections"]);
 }
 else
 {
  var sections = false; 
  var catalog  = {items};
 }
 
 for(var key in catalog)
 {
  // SECTION HEADER
  if(sections)
  {
   var element = sectioncreator(key, item);
   itemlist.appendChild(element);
  }
	 
  // ITEMS
  for(var item of catalog[key])
  {
   var element = itemcreator(item);
   Document_Element_SetObject(element, "itemlist-item", item);
   
   // IF ITEMS WILL BE ANIMATED, START THEM AS INVISIBLE
   if(options["animate"]) element.style.visibility = "hidden";
   
   element.onclick = 
   function(event)
   {
    var element       = event.currentTarget;
    var list          = element.parentElement;
 
    var selectedstyle = Document_Element_GetObject(list, "selectedstyle");
    var onselect      = Document_Element_GetObject(list, "onselect");

    Document_Conditional_Class(list, selectedstyle, element);    
    Document_Element_SetObject(list, "selecteditem", element);
 
    if(onselect) onselect(element);
   } 
  
   itemlist.appendChild(element);
  }
 }
 
 
 // ANIMATE LIST ITEMS?
 if(options["animate"])
 {  
  Document_Element_AnimateChildren(itemlist, "zoomIn 0.250s 1 ease-out", 
  {
   delay:    250, 
   interval: 125, 
  
   onstart:
   function(element) 
   {
    element.style.visibility = "visible";
   },
  
   onend:
   function(element)
   {
   }
  }).then(
  function()
  {
   // AFTER ALL HAS BEEN ANIMATED, CHECK SELECTED ITEM
   select();
  });
 }
 else  
 { 
  // CHECK SELECTED ITEM
  select();
 }
 
 return itemlist;
}






function UI_List_Files(files, onclick, options = {style:"standard"})
{
 style        = Safe_Get(options, "style", "standard");
 var filelist = UI_Element_Create("core/filelist-" + style);
 
 for(var file of files)
 {
  if(typeof file == "object")
  {
   var name = file["name"];
   var f    = file["onclick"] || onclick;
   var icon = file["icon"];
  }
  
  else	 
  
  {
   // NAME
   var name = Path_RemoveExtension(Path_Filename(file));
   var f    = onclick;
   
   var type = Media_Info_Type(file);
   switch(type)
   {
    case "image":
 	 var icon = "file-image";
    break;
   
    case "audio":
	 var icon = "file-audio";
    break;
   
    case "video":
	 var icon = "file-video";
    break;
   
    default:
	 var ext  = Path_Extension(file).toLowerCase();
     switch(ext)
	 {
      case "doc":
	  case "docx":
	  case "odt":
	 	var icon = "file-word";
	  break;
	 
	  case "xls":
	  case "xlsx":
	  case "odf":
		var icon = "file-excel";
	  break;
	 
	  case "pdf":
	 	var icon = "file-pdf";
	  break;
	 
	  default:
	 	var icon = "file";
	  break;
	}
    break;
   }
  }
 
  
  // CREATE ELEMENT
  var element = UI_Element_Create("core/filelist-" + style + "-item", {name, icon});
  Document_Element_SetData(element, "file", file);
  
  if(f) 
  {
   Document_CSS_SetClass(element, "style-clickable");
   Document_CSS_SetClass(element, "effect-highlight-accented");

   switch(f)
   {   
    case "download":
		element.onclick =
		function(event)
		{
	     var element = event.currentTarget;
		 var url  = Document_Element_GetData(element, "file");
		 
		 //Document_Element_Animate(item, "bounce 1s ease-in-out");
		 Request_Download(url);
		}
    break;	   
	
	default:
		 element.onclick = f;
	break;
   }
   
  }
  
  filelist.appendChild(element);
 }
 
 return filelist;
}



function UI_List_Checks(items, template = "plain", onchange)
{
 var box = UI_Element_Create("core/checklist-box-" + template);
 Document_Element_SetObject(box, "items", items);
 
 for(var item of items)
 {  
  var element   = UI_Element_Create("core/checklist-item-" + template, item);
  var check     = UI_Element_Find(element, "check");
  
  check.checked = item["value"];
  Document_Element_SetObject(check, "item", item);
  
  check.onclick = 
  function(event)
  {
   var element   = event.currentTarget;
   var item      = Document_Element_GetObject(element, "item", {});
   
   var list      = Document_Element_FindParent(element, "control", "checklist");
   var items     = Document_Element_GetObject(list, "items", []);
   
   item["value"] = element.checked;

   if(onchange) onchange(item, items);   
  }
  
  box.appendChild(element);
 }
 
 return box;
}





// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         G A U G E S                                            // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function UI_Gauge_ProgressCircle(element, options = {width:"100%", height:"100%", zIndex:100}, color)
{
 var gauge              = UI_Element_Create("core/gauge-circle");
 element.style.position = "relative";
 element.appendChild(gauge);
 
 var canvas  = UI_Element_Find(gauge, "canvas");
 
 Object.assign(canvas.style, options);
 
 var context = canvas.getContext("2d"); 
 var radius  = 0.75;
 
 
 var plugins = 
 {
  legend: 
  {
   display: false
  },
   
  tooltip: 
  {
   enabled: false
  },
   
  datalabels: 
  {
   formatter: 
   function (value, context) 
   {
    return "";
   } 
  }
 }


 var options = 
 {
  plugins:    plugins,
  cutout:     (100 * radius) + "%",
  responsive: false,
  
  animation:
  {
   duration:0
  }
 }


 var data = 
 {
  datasets: 
  [
   {
    data:            [0, 1],
    backgroundColor: [color, "transparent"],
    borderWidth:     0
  }
  ]
 }


 var chart = 
 new Chart(context, 
 {
  type:       "doughnut",
 
  cutout:     100 * radius,
  responsive: false,
  data:       data, 
  options:    options

 });
 
 
 Document_Element_SetData(gauge, "type", "progress-circle");
 Document_Element_SetObject(gauge, "chart", chart);
 return gauge; 
}






function UI_Gauge_Update(gauge, progress)
{
 var type  = Document_Element_GetData(gauge, "type");
 var chart = Document_Element_GetObject(gauge, "chart");
 
 chart.data.datasets[0].data[0] = progress;
 chart.data.datasets[0].data[1] = 1 - progress;
 
 chart.update();
}




async function UI_Gauge_TimeUpdate(gauge, time)
{
 var promise = new Promise((resolve, reject) =>
 {
  var start = Date.now();
 
  var update = setInterval(
  function()
  {
   var delta = (Date.now() - start) / time;
   if(delta > 1) delta = 1;
  
   UI_Gauge_Update(gauge, delta);
  
   if(delta == 1) 
   {
	clearInterval(update);
    resolve();
   }
  },
  1000 / 60);  // 60 TIMES PER SECOND 
 });
 
 return promise;
}









// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         C H A R T S                                            // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function UI_Chart_LabelFormatter(context)
{
 var index = context["dataIndex"];
 var data  = Safe_Get(context, ["chart", "sourcedata"]); 
	
 if(data) 
 {
  var label = Safe_Get(data, [index, "label"]); 
 }
 else
 {
  var label = "";
 }
	
 return label;
}



function UI_Chart_DataDestructure(data)
{
 var values = [];
 var colors = [];
 
 for(var item of data)
 {
  values.push(item["value"]);
  colors.push(item["color"]);
 }
 
 return {values, colors};
}




function UI_Chart_UpdateValues(element, values)
{  
 var chart = Document_Element_GetObject(element, "chart");
 
 chart.data.datasets[0].data = values;
 chart.update();
}




function UI_Chart_UpdateData(element, data)
{  
 var chart           = Document_Element_GetObject(element, "chart");
 chart["sourcedata"] = data;
 
 
 var destructured = UI_Chart_DataDestructure(data);
 
 chart.data.datasets[0].data            = destructured["values"];
 chart.data.datasets[0].backgroundColor = destructured["colors"];
 chart.update();
}





function UI_Chart_Sunburst(data, radius = 0.5, onclick, config = {width:"100%", height:"100%", zIndex:100})
{
 // CREATE ELEMENT
 var element            = UI_Element_Create("core/chart-doughnut");
 element.style.position = "relative";

  
 // SETUP CANVAS
 var canvas  = UI_Element_Find(element, "canvas");
 var context = canvas.getContext("2d");  
 Object.assign(canvas.style, config);
 
 
 // SETUP CHART DEFAULTS
 var plugins = 
 {
  legend: 
  {
   display: false
  },
   
  tooltip: 
  {
   enabled: true,
   
   callbacks: 
   {
    label:UI_Chart_LabelFormatter 
   }
  },
   
  datalabels:
  {
   anchor: "center", //start, center, end
    
   rotation: function(ctx) 
   {
    const valuesBefore = ctx.dataset.data.slice(0, ctx.dataIndex).reduce((a, b) => a + b, 0);
    const sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
    const rotation = ((valuesBefore + ctx.dataset.data[ctx.dataIndex] /2) /sum *360);
    return rotation < 180 ? rotation-90 : rotation+90;
   },
      
   formatter: function (value, context) 
   {
	var index = context["dataIndex"];
    var label = Safe_Get(context, ["chart", "sourcedata", index, "label"], "");
	
	// LABEL CLIPPING?
	if(config["maxlength"])
	{
     if(label.length > config["maxlength"]) label = label.substr(0, config["maxlength"]) + "…";
	}
	
	return label;
   },
  }
 }


 // CUSTOM FONT?
 if(config["font"])
 {
  plugins["datalabels"]["font"] = config["font"];
 }


 // 
 var options = 
 {
  plugins:    plugins,
  cutout:     (100 * radius) + "%",
  responsive: true,
 }


 // DISSECT DATA INTO COMPONENTS
 var destructured = UI_Chart_DataDestructure(data);
 var chartdata    = 
 {
  datasets: 
  [
   {
    data:            destructured["values"],
    backgroundColor: destructured["colors"],
    borderWidth:     1
   }
  ]
 }


 var chart = 
 new Chart(context, 
 {
  type:       "doughnut",
  cutout:     100 * radius,
  responsive: false,
  data:       chartdata, 
  options
 });
 
 
 
 canvas.onclick =
 function()
 {  
  var elements = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true); 
  var element  = elements[0];
  //var label    = datasets[element.datasetIndex]["labels"][element.index];
  var index     = element["index"];
  
  //chart.data.datasets[0].backgroundColor[index] = "red";
  //chart.update();
  
  if(onclick) onclick(data[index], element);
 }
 
 
 chart["sourcedata"] = data;
 Document_Element_SetData(element,   "type",  "doughnut");
 Document_Element_SetObject(element, "chart", chart);
 return element; 
}





function UI_Chart_Doughnut(data, radius = 0.5, config = {width:"100%", height:"100%", zIndex:100})
{
 // CREATE ELEMENT
 var element            = UI_Element_Create("core/chart-doughnut");
 
  
 // SETUP CANVAS
 var canvas  = UI_Element_Find(element, "canvas");
 var context = canvas.getContext("2d");  
 Object.assign(canvas.style, config);
 
 
 if(typeof config["tooltip"] != "undefined") var tooltip = config["tooltip"]; else var tooltip = true;

 
 // SETUP CHART DEFAULTS
 var plugins = 
 {
  legend: 
  {
   display: false
  },
   
  tooltip: 
  {
   enabled: tooltip,
   
   callbacks: 
   {
    label:UI_Chart_LabelFormatter 
   }
  },
   
  datalabels: 
  {
   formatter: 
   function(value, context) 
   {
    return "";
   } 
  }
 }


 var options = 
 {
  plugins:    plugins,
  cutout:     (100 * radius) + "%",
  responsive: true,
 }


 // DISSECT DATA INTO COMPONENTS
 var destructured = UI_Chart_DataDestructure(data);
 var chartdata    = 
 {
  datasets: 
  [
   {
    data:            destructured["values"],
    backgroundColor: destructured["colors"],
    borderWidth:     0
   }
  ]
 }


 var chart = 
 new Chart(context, 
 {
  type:       "doughnut",
  cutout:     100 * radius,
  responsive: false,
  data:       chartdata, 
  options:    options
 });
 
 
 chart["sourcedata"] = data;
 Document_Element_SetData(element,   "type",  "doughnut");
 Document_Element_SetObject(element, "chart", chart);
 return element; 
}





function UI_Chart_Lines(labels, data, options = {}, y_formatter, x_formatter, onclick, config = {width:"100%", height:"100%", zIndex:100})
{
 // CREATE ELEMENT
 var element            = UI_Element_Create("core/chart-lines");
 element.style.position = "relative";

  
 // SETUP CANVAS
 var canvas  = UI_Element_Find(element, "canvas");
 var context = canvas.getContext("2d");
 Object.assign(canvas.style, config);
 
  
 // DATA
 var chartdata =
 {
  labels,
  
  datasets: data
 }
 
 // SET INTERPOLATION FOR ALL SETS IN DATA
 if(options["interpolation"]) 
 {
  for(var set of data) set["cubicInterpolationMode"] = "monotone";
 }



 
 // SETUP CHART DEFAULTS
 var plugins = 
 {
  legend: 
  {
   display: false
  },
   
  tooltip: 
  {
   enabled: true,
   
   callbacks: 
   {
    label:UI_Chart_LabelFormatter 
   }
  },
   
  datalabels: 
  {
   formatter: 
   function(value, context) 
   {
    return "";
   } 
  }
 }


 
 // OPTIONS
 var chartoptions = 
 {
  plugins:    plugins,
  
  responsive: true,
  
  scales: 
  {
   y: 
   {
    ticks: 
	{
     callback : y_formatter || function(value){return value}
    }
   },
   
   x:
   {
	ticks: 
	{
     callback : x_formatter || function(value){return ""}
    }
   }
  }
  
 }
 
   
 if(options["min"] != undefined)
 {
  Safe_Set(chartoptions, ["scales", "y", "min"],          options["min"]);
 }

 
 if(options["max"] != undefined)
 {
  Safe_Set(chartoptions, ["scales", "y", "max"],          options["max"])
 }
 
 
 if(options["responsive"])
 { 
  chartoptions["responsive"]          = true;
  chartoptions["maintainAspectRatio"] = false;	
 }
 
 
 if(!options["gaps"])
 { 
  chartoptions["spanGaps"] = true;
 }


 // CHART
 var chart = 
 new Chart(context, 
 {
  type:       "line",
  data:       chartdata, 
  options:    chartoptions
 });
 

 // MAP CANVAS CLICK TO POINT SELECTION IN CHART
 canvas.onclick = 
 function(event)
 {
  var points = chart.getElementsAtEventForMode(event, "nearest", {intersect: true}, true);
  
  if(points.length > 0)
  {
   var point = points[0];

   if(onclick) onclick(point, event);
  }
 };

 
 chart["sourcedata"] = chartdata;
 Document_Element_SetData(element,   "type",  "line");
 Document_Element_SetObject(element, "chart", chart);
 return element; 
}







function UI_Chart_Bars(sets, options = {})
{
 // CREATE ELEMENT
 var element            = UI_Element_Create("core/chart-bars");
 element.style.position = "relative";

  
 // SETUP CANVAS
 var canvas   = UI_Element_Find(element, "canvas");
 var context  = canvas.getContext("2d"); 


 // DATA
 var chartdata   = 
 {
  labels: [""],
  datasets: sets
 }

 
 // OPTIONS 
 var chartoptions = 
 {
  indexAxis: 'y',
  elements: 
  {
   bar: 
   {
    borderWidth: 2,
   }
  },
   
  responsive: true,
  
  plugins: 
  {
   legend:
   {
    display: false,
   },
	
   datalabels: 
   {
    formatter: function(value, context) 
	{
     return Safe_Get(context, ["dataset", "label"], "");
    }
   }
  }
 }
 
 
  
 if(options["min"])
 {
  Safe_Set(chartoptions, ["scales", "x", "suggestedMin"], options["min"])
 }
 
 
 if(options["max"])
 {
  Safe_Set(chartoptions, ["scales", "x", "suggestedMax"], options["max"])
 }
 
 
 
 // CONFIG
 const config = 
 {
  type:    "bar",
  data:    chartdata,
  options: chartoptions
 } 
 
 var chart = new Chart(context, config);

 chart["sourcedata"] = chartdata;
 Document_Element_SetData(element,   "type",  "bar");
 Document_Element_SetObject(element, "chart", chart);
 
 return element; 
}





function UI_Chart_Radar(labels, data, options = {}, config = {width:"100%", height:"100%", zIndex:100})
{
 // CREATE ELEMENT
 var element            = UI_Element_Create("core/chart-radar");
 element.style.position = "relative";

  
 // SETUP CANVAS
 var canvas  = UI_Element_Find(element, "canvas");
 var context = canvas.getContext("2d"); 
 Object.assign(canvas.style, config);

 
 // DATA
 var chartdata =
 {
  labels,
  datasets: data
 }
 
 
 // SETUP CHART DEFAULTS
 var plugins = 
 {
  legend: 
  {
   display: false
  },
   
  tooltip: 
  {
   enabled: false 
  },
   
  datalabels: 
  {
   formatter: 
   function(value, context) 
   {
    return "";
   } 
  }
 }


 // OPTIONS
 var chartoptions = 
 {
  aspectRatio: 1,
  plugins:    plugins,
 }
 
 
 // SET FONT SIZE AND PADDING (DOUBLE THE FONT'S SIZE)
 Safe_Set(chartoptions, ["scales", "r", "pointLabels", "font", "size"], Chart.defaults.font.size);
 Safe_Set(chartoptions, ["scales", "r", "pointLabels", "padding"],      parseInt(Chart.defaults.font.size) * 2);
 
 // DO NOT DISPLAY TICKS
 Safe_Set(chartoptions, ["scales", "r", "ticks", "display"], false);
 Safe_Set(chartoptions, ["scale", "stepSize"], 1);
   
 if(options["min"] != undefined)
 {
  Safe_Set(chartoptions, ["scale", "min"], options["min"]);
 }

 
 if(options["max"] != undefined)
 {
  Safe_Set(chartoptions, ["scale", "max"], options["max"])
 }
 
 
 if(options["responsive"])
 { 
  chartoptions["responsive"]          = true;
  chartoptions["maintainAspectRatio"] = false;	
 }
 
 console.log(chartdata);

 // CHART
 var chart = 
 new Chart(context, 
 {
  type:       "radar",
  data:       chartdata, 
  options:    chartoptions
 });
 

 chart["sourcedata"] = chartdata;
 Document_Element_SetData(element,   "type",  "radar");
 Document_Element_SetObject(element, "chart", chart);
 return element; 
}





// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      C A L E N D A R                                           // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function UI_Calendar(month, year, data = {},  config = {})
{ 
 // BASICS
 var today  = Date_Portion(Date_Now(), "date-only");
 var locale = UI_Language_Current(true);
 
 
 // TABLE
 var table  = UI_Table("cursive");
 table.style.tableLayout = "fixed";
 
 
 // HEADER
 var row = UI_Table_Row(table); 
 for(var i = 1; i <= 7; i++)
 {
  var cell       = UI_Table_Cell(row, {type:"header"});  
  cell.innerHTML = Date_Weekday_Name(i, "short", locale); 
 }
 
 
 var days   = Date_Month_ListDays(month, year);
 
 
 // FIRST ROW: SEE HOW MANY CELLS WE NEED TO SKIP TO GET TO THE FIRST DAY OF THE MONTH
 var row = UI_Table_Row(table); 
 
 var first = Date_Weekday_Get(days[0]);
 for(var weekday = 1; weekday < first; weekday++)
 {
  var cell              = UI_Table_Cell(row);
  cell.style.visibility = "hidden";
  
  row.appendChild(cell);
 }	 


 // FUNCTION THAT WILL DETERMINE WHETHER A CELL IS ACTIVE OR NOT, GIVEN A DAY AND DATA
 if(config["activeday"])
 {
  var activeday = config["activeday"];
 }
 else
 {
  var activeday =
  function(day, data)
  {
   return data[day];
  }
 }
 

 // NOW WE PROCEED: KEEP ADDING DAYS
 var d = 0;
 while(d < days.length)
 {	 
  var weekday = Date_Weekday_Get(days[d]);
  
  var cell       = UI_Table_Cell(row); 
  cell.innerHTML = Date_Get(days[d], "day"); 
    
  var day = Date_Portion(days[d], "date-only");
  Document_Element_SetData(cell, "date", day);
	
	
  // ACTIVE CELL?	
  var active = activeday(day, data);
	
	
  // CELL WITH DATA?
  if(active)
  {
   cell.style.backgroundColor = "var(--color-alert-light)"; 
   Document_Element_SetObject(cell, "data", data[day]);
  }
  else
  {
  }
  
  
  // CELL ONCLICK
  if(config["onclick"] && (active || config["emptyactive"]))
  {
   Document_CSS_SetClass(cell, "style-clickable");
   
   cell.onclick =
   function(event)
   {
    var element = event.currentTarget;
	var data    = Document_Element_GetObject(element, "data");
	var date    = Document_Element_GetData(element, "date");
	
	config["onclick"](cell, date, data);
   }
  }
 
    
  // HIGHLIGHT TODAY
  if(day == today) 
  {
   cell.style.backgroundColor = "var(--color-noted)";
   Document_Element_Animate(cell, "flash 1.5s ease-in-out 1.5");
  }
  
  
  // CHECK ROW END
  if(weekday == 7)
  {
   var row = false;
   
   // START NEW ROW UNLESS THIS WAS ALSO THE FINAL DAY
   if(d != (days.length -1))
   {
    var row = UI_Table_Row(table);
   }
  }
  
  d++;
 }


 return table;
}



// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          F R A M E S                                           // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function UI_Frame(template = "standard", background, options = {})
{
 var frame  = UI_Element_Create("core/frame-" + template);
 
 for(var component of ["top", "right", "bottom", "left"])
 {
  var element = UI_Element_Find(frame, component); 
  var url     = background + "/" + component + ".png";
  
  await Document_Image_Load(element, [url]);
 }
 
 return frame;
}



async function UI_Frame_Flexi(background, bordersize)
{
 var frame                  = UI_Table();
 frame.style.borderCollapse = "collapse";
 frame.style.width          = "auto";
 frame.style.height         = "auto";
 frame.style.overflow       = "hidden";
 
 
 var row            = UI_Table_Row(frame);
 
 var cell           = UI_Table_Cell(row);
 cell.colSpan       = 3;
 cell.style.padding = "0px";
 cell.style.height  = bordersize + "px";
 Document_Element_SetData(cell, "uid", "top");
 
 
 var row             = UI_Table_Row(frame);
 
 var cell            = UI_Table_Cell(row);
 cell.style.padding  = "0px";
 cell.style.width    = bordersize + "px";
 Document_Element_SetData(cell, "uid", "left");
 
 var cell            = UI_Table_Cell(row);
 cell.style.padding  = "0px";
 cell.style.overflow = "hidden";
 Document_Element_SetData(cell, "uid", "content");
 
 var cell            = UI_Table_Cell(row);
 cell.style.padding  = "0px";
 cell.style.width    = bordersize + "px";
 Document_Element_SetData(cell, "uid", "right");
 
 
 var row             = UI_Table_Row(frame);
 
 var cell            = UI_Table_Cell(row);
 cell.colSpan        = 3;
 cell.style.padding  = "0px";
 cell.style.height   = bordersize + "px";
 Document_Element_SetData(cell, "uid", "bottom");
 
 
 
 for(var component of ["top", "right", "bottom", "left"])
 {
  var element = UI_Element_Find(frame, component); 
  var url     = background + "/" + component + ".png";
  
  element.style.backgroundSize  = "100% 100%";
  element.style.backgroundImage = "url(" + url + ")";	  
 }
 
 return frame;
}









// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      S T I C K E R S                                           // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function UI_Sticker(element, sticker, options = {corner:"top", z:1000})
{
 sticker.style.position = "absolute";
 sticker.style.zIndex   = options["z"];
 Document_Element_SetData(sticker, "sticker", true);

 
 document.body.appendChild(sticker);
 
 
 var attach = 
 function(event)
 {  
  var point = Document_Element_Corner(element, options["corner"]);
  
  switch(options["corner"])
  {
   case "top":          var opposite = "bottom";       break;
   case "center":       var opposite = "center";       break;
   case "bottom":       var opposite = "top";          break;
   case "left top":     var opposite = "right bottom"; break;
   case "left":         var opposite = "right";        break;
   case "left bottom":  var opposite = "right top";    break;
   case "right top":    var opposite = "left top";     break;
   case "right":        var opposite = "left";         break;
   case "right bottom": var opposite = "left bottom";  break;
  }
  var rect         = sticker.getBoundingClientRect();
  var displacement = Geometry_Rect_Displacement(rect, opposite);
  
  var offset_left    = options["offset_left"] || 0;
  var offset_top     = options["offset_top"]  || 0;
  
  sticker.style.left = point["left"] - displacement["left"] + offset_left;
  sticker.style.top  = point["top"]  - displacement["top"]  + offset_top;
 }
 
 attach();
 
 var observer = new ResizeObserver(attach);
 observer.observe(element);
 
 return sticker;
}



function UI_Stickers_Clean(container)
{
 if(!container) var container = document.body;
 
 var stickers = Document_Element_FindChildren(container, "sticker");
 for(var sticker of stickers) sticker.remove();
}




function UI_Sticker_Frame(template, content, variables)
{
 var frame     = UI_Element_Create("core/" + template, variables);
 var container = UI_Element_Find(frame, "content");
 
 container.appendChild(content);
 
 return frame;
}










// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      L A N G U A G E                                           // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function UI_Language_Current(aslocale)
{
 var lang = Safe_Get(application, ["state", "core", "lang"], "en");
 
 if(aslocale) lang = Core_Data_Value("core/languages", lang, "code");
 
 return lang;
}



function UI_Language_Set(language)
{
 Safe_Set(application, ["state", "core", "lang"], language);
}



function UI_Language_Page(pageid)
{
 // FOR MODULES, WE ALLOW TO ADDRESS THE MODULE'S BASE PAGE (/MODULE) AS JUST "MODULENAME"
 if(!pageid.includes("/")) pageid = pageid + "/module";
	 
 var page = Safe_Get(application, ["data", pageid], {});
 return page;
}





function UI_Language_Exists(pageid, item, lang)
{	
 if(!lang) var lang = UI_Language_Current();
 var page   = UI_Language_Page(pageid);
 var string = Safe_Get(page, [item, lang], "");
 
 return string !== "";
}





function UI_Language_String(pageid, item, variables, lang)
{	  
 var page   = UI_Language_Page(pageid);
 
 // LANGUAGE TO BE USED
 if(!lang) var lang = UI_Language_Current();
 
 // TRY GETTING A STRING FOR THIS ITEM AND LANGUAGE
 var string = Safe_Get(page, [item, lang], "");
 
 console.log(pageid, item, string);
 
 // NOT FOUND? TRY WITH ENGLISH (UNIVERSAL DEFAULT). IF NOT FOUND, JUST THE ITEM DEFINITION AS TEXT
 if(string == "") 
 {
  //console.log(pageid + " / " + itemid + " / " + lang + " was undefined");
  var string = Safe_Get(page, [item, "en"], item);
 }
 
 // FORMAT AND RETURN
 string = String_Variables_Set(string, variables);
 return string;
}



function UI_Language_Object(obj, def, variables, lang)
{
 if(!lang) var lang = UI_Language_Current();
 
 var text = Safe_Get(obj, [lang], "");
 if(text == "") var text = Safe_Get(obj, ["en"], def);
 
 if(variables) text = String_Variables_Set(text, variables);
 return text;
}





function UI_Language_Apply(text, pageid, variables, lang)
{ 
 var page = UI_Language_Page(pageid);
 
 if(!lang) var lang = UI_Language_Current();

 var keys = Object.keys(page);
 
 for(var key of keys)
 {
  var string = Safe_Get(page, [key, lang], "");
  if(string == "") var string = Safe_Get(page, [key, "en"], key);
  
  text = text.replaceAll("%" + key + "%", string);
 }
 
 if(variables) text = String_Variables_Set(text, variables);
 
 return text;
}




function UI_Language_Options(page, lang)
{
 if(!lang) var lang = UI_Language_Current();
 
 if(typeof page == "string") var page = Core_Data_Page(page);
 
 var options = [];
 for(var id in page)
 {
  var value = id;
  var text  = UI_Language_Object(page[id]);
  
  options.push({value, text});
 }
 
 return options;
}





function UI_Language_Date(date, format, lang)
{
 if(!lang) var lang = UI_Language_Current();
 var locale         = Core_Data_Value("core/languages", lang, "code");
 
 var text = Date_Format(date, locale, format);
 
 return text;
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          I N I T                                               // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

Chart.defaults.font.family = Document_CSS_GetValue("text-caption-medium", "fontFamily")
Chart.defaults.font.size   = Document_CSS_GetValue("text-caption-medium", "fontSize");