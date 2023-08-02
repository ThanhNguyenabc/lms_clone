// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                P R E S E N T A T I O N                                         //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Editor_Presentation()
{
 // FLUSH EDITOR FROM CERTAIN SAVED STATES
 Editor_Flush();
 
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 

 // DETERMINE PRESENTATION TO EDIT
 var source = false;
  
 
 // SET BY ANOTHER MODULE? 
 if(!source)
 {
  var source = Core_State_Get("editor", ["edit-presentation"], false);
  if(source)
  {
   // UNSET
   Core_State_Set("editor", ["edit-presentation"], false);
  }
 }
 
 
 
 
 // JUST SET IT TO THE USER'S TEMP FOLDER
 if(!source)
 {
  var user_id = Safe_Get(application, ["user", "id"]); 
  var source  = Resources_URL("temp/editor/presentation", "user", user_id);
 }
 
 Core_State_Set("editor", ["current-source"], source);
 
	
 // LOAD
 var presentation = await Presentation_Load(source, {mode:"edit"}); 

 // SET AS CURRENTLY EDITED
 presentation["mode"] = "edit";
 Core_State_Set("editor", ["presentation"], presentation);
 
 
 // STORE AS LAST PRESENTATION EDITED
 Core_Api("User_Config_WriteValue", {file:"editor", section:"wip", field:"presentation", value:source});
  
 


 // SETUP CONTROLS
 var header = UI_Header("presentation-selector",
 {
  slide:
  {
   text :   UI_Language_String("editor", "selector slide caption"),
   icons:   [{icon:"cloud-arrow-down", onclick:Editor_Download}, {icon:"tv", onclick:Editor_Presentation_Test}],
   onclick: Editor_Presentation_SelectPanel
  },
  
  elements:
  {
   text :   UI_Language_String("editor", "selector elements caption"),
   icons:   [],
   onclick: Editor_Presentation_SelectPanel
  },
  
  scripts:
  {
   text :   UI_Language_String("editor", "selector scripts caption"),
   icons:   [],
   onclick: Editor_Presentation_SelectPanel
  },
  
  resources:
  {
   text:  UI_Language_String("editor", "selector resources caption"),
   icons: [{icon:"folder-open", onclick:Editor_Presentation_AddResources}],
   onclick: Editor_Presentation_SelectPanel
  }
 });
  
 UI_Element_Find(submodule, "slide-panels-selector").appendChild(header);
  

 Editor_Presentation_SlidesControls();

 Editor_Presentation_ElementsControls();
 
 Editor_Presentation_ScriptsControls();
 
 
 
 // TRY TO AUTOMATICALLY ASSIGN DATA SOURCES TO SELECTS
 var container = UI_Element_Find(submodule, "slide-panels");
 var selects   = Document_Element_FindChildren(container, "source", undefined, ["recurse"]);
 for(var select of selects)
 {
  Document_Select_Clear(select);
  Document_Select_AddOption(select, "" , "");
  
  var source = Document_Element_GetData(select, "source");
  var svalue = Document_Element_GetData(select, "sourcevalue");
  var page   = Core_Data_Page("editor/" + source);
  
  if(page)
  {
   for(var id in page)
   {
    var text   = UI_Language_Object(page[id]);
    
	if(svalue) var value = page[id][svalue]; else var value = id;
	
    var option = Document_Select_AddOption(select, text, value);
   }
  }
 }
  



 // ALL STYLE SELECTS
 var selects    = [UI_Element_Find(submodule, "element-style")]; //Document_Element_FindChildren(container, "source", "styles", ["recurse"]);
 var page       = Core_Data_Page("presentation/styles");
 var categories = Core_Data_Page("presentation/style-categories");
 
 for(var select of selects)
 {  
  select.innerHTML = "";

  UI_Select_FromDatapage(select, page, "type", categories, "text-option-category")
 }
  
 
 

 // UPDATE SELECTS WITH DYNAMIC SOURCES
 var container = UI_Element_Find(submodule, "slide-panels-panels");
 Editor_Presentation_UpdateControls(container);
 
 
 // LIST RESOURCES
 Editor_Presentation_ListResources();
  
 
 // ASSIGN DISPLAY TO PRESENTATION
 //var display = UI_Element_Find(submodule, "slides-slide");
 //Presentation_Assign(presentation, display, Editor_Presentation_DisplayEventHandler);
 
 
 
 // DISPLAY SLIDES LIST
 Editor_Presentation_ListSlides();
 
 
 
 // SETUP KEYBOARD
 Input_Keyboard_Assign(document.body, Editor_Presentation_DisplayKeyboard);
 
 

 // SET UP UPLOAD OF NEW RESOURCES
 var display = UI_Element_Find(submodule, "slides-slide");
 
 Document_Handler_FileDrop(display, {},  Editor_Presentation_DropResources);
 
 

 // SET UP PASTING
 Document_Handler_Paste(
 {
  image: Editor_Presentation_PasteResource,
 }, 
 UI_Element_Find(submodule, "slides-edit"));
 
 
 // SET UP RESOURCE PREVIEW AND INSERT
 UI_Element_Find(submodule, "resources-list").onclick    = Editor_Resource_Preview;
 UI_Element_Find(submodule, "resources-list").ondblclick = Editor_Presentation_InsertResource;
 
 
 
 // SWITCH TO ELEMENTS PANEL
 var header = UI_Element_Find(submodule, "presentation-selector");
 UI_Header_Set(header, "slide", true);
 
 
 // DELAYED DISPLAY OF PRESENTATION (UI NEEDS TO BE ATTACHED TO THE DOM OR IT WILL FAIL)
 setTimeout(
 function()
 {
  // ASSIGN DISPLAY TO PRESENTATION
  var display = UI_Element_Find(submodule, "slides-slide");
  Presentation_Assign(presentation, display, Editor_Presentation_DisplayEventHandler);
  
  // IF PRESENTATION HAS AT LEST ONE SLIDE, SELECT IT AND DISPLAY IT
  if(presentation["slides"].length > 0)
  {  
   var list = UI_Element_Find(submodule, "slides-list");
  
   list.options[0].selected = true;
   list.options[0].click();
  
   Editor_Presentation_UpdateDisplayHelpers();
  }
 }, 250);
}






function Editor_Presentation_SelectPanel(item)
{	
 if(typeof item == "string") var selected = item; else var selected = item["id"];
 
 
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 // DISPLAY SELECTED PANEL AND HIDE ALL OTHERS
 var container = UI_Element_Find(submodule, "slide-panels-panels");
 Document_Conditional_Style(container, {display:"flex"}, {display:"none"}, "panel", selected);


 // TAKE A CHANCE TO SAVE THE CURRENT SLIDE IF CHANGES OCCURRED
 Editor_Presentation_SaveSlide();


 Core_State_Set("editor", ["presentation", "current-panel"], selected);
}






function Editor_Presentation_UpdateControls(container)
{
 var presentation = Core_State_Get("editor", ["presentation"]);
 var resources    = Core_State_Get("editor", ["presentation", "resources"], []);
 
  
 // THIS WILL LOAD MEDIA INTO SELECTS
 Editor_Resources_UpdateControls(resources, container);
 
 
 // ALL ELEMENTS SELECTS
 var selects  = Document_Element_FindChildren(container, "source", "elements", ["recurse"]);
 var slide    = Core_State_Get("editor", ["selected-slide"], {});
 var elements = slide["elements"] || [];
 
 for(var select of selects)
 {
  Document_Select_Clear(select);
  Document_Select_AddOption(select, "", "");
 
  for(var element of elements)
  {
   var value  = Document_Element_GetData(element, "uid");
   var text   = Document_Element_GetData(element, "name") || value; 
   var option = Document_Select_AddOption(select, text, value, element);
  }
 }
 
 
 
 // ALL COMMANDS SELECTS
 var selects    = Document_Element_FindChildren(container, "source", "commands", ["recurse"]);
 var page       = Core_Data_Page("presentation/commands");
 var categories = Core_Data_Page("presentation/command-categories");
 
 for(var select of selects)
 {  
  Document_Select_Clear(select);
  Document_Select_AddOption(select, "", "");
 
  UI_Select_FromDatapage(select, page, "type", categories, "text-option-category",
  // FILTER OUT COMMANDS THAT THIS SELECT DOES NOT ALLOW
  function(item)
  {
   var allow = Object_From_String(Document_Element_GetData(select, "allow"));
   if(allow)
   {
    var field = Object.keys(allow)[0];
    var value = Object.values(allow)[0];
    
    return (item[field] == value);	
   }
   else return true;
  });
 }
  
  
 
 
 // ALL FONTS SELECTS 
 var selects     = Document_Element_FindChildren(container, "source", "fonts", ["recurse"]);
 var system      = Core_Data_Page("core/system fonts");
 var custom      = Document_Fonts_List();
  
 for(var select of selects)
 { 
  Document_Select_Clear(select);
  Document_Select_AddOption(select, "", "");
 
  for(var source of custom)
  {
   var text                = source;
   var value               = source;
   var option              = Document_Select_AddOption(select, source, source);
   option.style.fontFamily = source; 
  }
  
 
  for(var source in system)
  {
   var text                = UI_Language_Object(system[source]);
   var value               = source;
   var option              = Document_Select_AddOption(select, text, value);
   option.style.fontFamily = source; 
  }
  
 }
 
 
 
 // ALL TEXT ALIGNMENT SELECTS 
 var selects    = Document_Element_FindChildren(container, "source", "alignment", ["recurse"]);
 var sources    = Core_Data_Page("editor/alignments");

 for(var select of selects)
 { 
  for(var source in sources)
  {
   var text                = UI_Language_Object(sources[source]);
   var value               = source;
   var option              = Document_Select_AddOption(select, text, value);
  }
  
 }
 
 
 
 // ALL COLOR SELECTS 
 var selects     = Document_Element_FindChildren(container, "source", "colors", ["recurse"]);
 var sources     = Core_Data_Page("core/colors");
 
 for(var select of selects)
 {  
  var svalue = Document_Element_GetData(select, "sourcevalue");
  
  Document_Select_Clear(select);
  Document_Select_AddOption(select, "", "transparent");
 
  for(var source in sources)
  {
   var text              = "████████████████ / " + UI_Language_Object(sources[source]);
   
   if(svalue)            var value = sources[source][svalue]; else var value = source;
   
   var option            = Document_Select_AddOption(select, text, value);
   option.style.color    = source;
   option.style.fontSize = "24px"; 
   
   // TRICK: WE USE DOM'S COLOR CONVERSION TO RESET THE OPTION VALUE, BECAUSE HEX ARE CONVERTED TO RGB AND SO THE ELEMENT STYLE/VALUES WON'T MATCH. 
   // SHOULD REFACTOR THE COLOR.DAT FILE INSTEAD
   if(!svalue) option.value = option.style.color;
  }
 }
  
}






function Editor_Presentation_Test()
{
 var presentation_source = Core_State_Get("editor", ["presentation", "path"]);
 
 var lesson_id           = presentation_source.replace("content/lessons/", "");
 lesson_id               = lesson_id.replace("/presentation", "");
 
 var slide_id            = Core_State_Get("editor", ["presentation", "current-slide", "id"]);
 
 var projector = window.open("?framework=null&module=classroom&page=present&lesson_id=" + lesson_id + "&slide=" + slide_id, "_", "popup, width="+ screen.width + ", height=" + screen.height + ", fullscreen=yes");
}








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       D I S P L A Y                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Editor_Presentation_DisplayEventHandler(event)
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
	
 switch(event["event"])
 {
  case "click":
  
    // TRIGGER SELECTION
	if(event["element"])
	{
     if(Editor_Presentation_SetSelectedElement(event["element"]))
	 {
	  
	 }
	}
	else
	{
     // UNSELECT
	 Editor_Presentation_UnselectElement();
	}
  
  break;
  
  
  case "dblclick":
    // TRIGGER SELECTION
	if(event["element"])
	{
     if(Editor_Presentation_SetSelectedElement(event["element"]))
	 {
	  // SWITCH TO ELEMENTS PANEL
	  var header = UI_Element_Find(submodule, "presentation-selector");
      UI_Header_Set(header, "elements", true);
	 }
	}
	else
	{
     // UNSELECT
	 Editor_Presentation_UnselectElement();
	}
  break;
    
	
  case "move":
    // ELEMENT POSITION HAS CHANGED: MARK IT FOR SAVING
    if(event["element"])
	{
     // SAVE ELEMENT
     Editor_Presentation_ElementChanged(event["element"]);
	}
  break;
  
  
  
  case "drop":
    // ELEMENT POSITION HAS CHANGED: MARK IT FOR SAVING
	if(event["element"])
	{
     // SAVE ELEMENT
     Editor_Presentation_ElementChanged(event["element"]);
	}
  break;
 }
}








function Editor_Presentation_DisplayKeyboard(event)
{
 // ABORT IF CURSOR IS IN AN EDIT FIELD
 var focused = document.activeElement;
 if(["input", "textarea"].includes(focused.nodeName.toLowerCase())) return;
 

 var selected_element = Core_State_Get("editor", ["selected-element"]);
 var grid_size        = 8;
 var changed          = false;

 // MODIFY SELECTED ITEM
 if(selected_element)
 {
  // DELETE 
  if(Input_Keyboard_Pressed(false, [KEY_DEL]) || Input_Keyboard_Pressed(false, [KEY_BACKSP]))
  {
   Editor_Presentation_DeleteElement();
  }
  else
	  
  // INCREASE SIZE
  if(Input_Keyboard_Pressed("Z", [KEY_LSHIFT]))
  {  
   var ratio = parseInt(selected_element.style.height) / parseInt(selected_element.style.width);
   
   selected_element.style.width  = parseInt(selected_element.style.width)  + grid_size;
   selected_element.style.height = Math.round(parseInt(selected_element.style.height) + grid_size * ratio);
   
   changed = true;
  }
  else
	  
  // DECREASE SIZE
  if(Input_Keyboard_Pressed("A", [KEY_LSHIFT]))
  {   
   var ratio = parseInt(selected_element.style.height) / parseInt(selected_element.style.width);
   
   selected_element.style.width  = parseInt(selected_element.style.width)  - grid_size;
   selected_element.style.height = Math.round(parseInt(selected_element.style.height) - grid_size * ratio);
   
   changed = true;
  }
  else
	  
  // INCREASE WIDTH
  if(Input_Keyboard_Pressed(false, [KEY_LSHIFT, KEY_RIGHT]))
  {
   selected_element.style.width = parseInt(selected_element.style.width) + grid_size;
   
   changed = true;
  }
  else
	  
  // DECREASE WIDTH
  if(Input_Keyboard_Pressed(false, [KEY_LSHIFT, KEY_LEFT]))
  {  
   selected_element.style.width = parseInt(selected_element.style.width) - grid_size;
   
   changed = true;
  }
  else
	  
  // INCREASE HEIGHT
  if(Input_Keyboard_Pressed(false, [KEY_LSHIFT, KEY_DOWN]))
  {  
   selected_element.style.height = parseInt(selected_element.style.height) + grid_size;
   
   changed = true;
  }
  else
	  
  // DECREASE HEIGHT
  if(Input_Keyboard_Pressed(false, [KEY_LSHIFT, KEY_UP]))
  {  
   selected_element.style.height = parseInt(selected_element.style.height) - grid_size;
   
   changed = true;
  }
  else
	  
  // MOVE RIGHT
  if(Input_Keyboard_Pressed(false, [KEY_RIGHT]))
  {  
   selected_element.style.left = parseInt(selected_element.style.left) + grid_size;
   
   changed = true;
  }
  else
	  
  // MOVE LEFT
  if(Input_Keyboard_Pressed(false, [KEY_LEFT]))
  {  
   selected_element.style.left = parseInt(selected_element.style.left) - grid_size;
   
   changed = true;
  }
  else
	  
  // MOVE DOWN
  if(Input_Keyboard_Pressed(false, [KEY_DOWN]))
  {  
   selected_element.style.top = parseInt(selected_element.style.top) + grid_size;
   
   changed = true;
  }
  else
	  
  // MOVE UP
  if(Input_Keyboard_Pressed(false, [KEY_UP]))
  {  
   selected_element.style.top = parseInt(selected_element.style.top) - grid_size;
   
   changed = true;
  }
  else
  
  // MOVE TO FRONT
  if(Input_Keyboard_Pressed(false, [KEY_PGUP]))
  {  
   selected_element.style.zIndex = parseInt(selected_element.style.zIndex) + 1;
   
   changed = true;
  }
  else
  
  // MOVE TO BACK
  if(Input_Keyboard_Pressed(false, [KEY_PGDN]))
  {  
   selected_element.style.zIndex = parseInt(selected_element.style.zIndex) - 1;
   
   changed = true;
  }
  
  else
	  
  // UNSELECT
  if(Input_Keyboard_Pressed(false, [KEY_ESC]))
  {
   Editor_Presentation_UnselectElement();
  }
  
  
  // SAVE ELEMENT
  if(changed) Document_Element_SetData(selected_element, "changed", "yes");
 }  
 
}







function Editor_Presentation_UpdateDisplayHelpers()
{
 var presentation     = Core_State_Get("editor", ["presentation"], {});
 var selected_slide   = Core_State_Get("editor", ["selected-slide"], undefined);
 var selected_element = Core_State_Get("editor", ["selected-element"], undefined);

 if(!selected_slide) return;
  
 // SPECIAL BORDER FOR SELECTED ELEMENT
 for(var element of selected_slide["elements"])
 { 
  if(element == selected_element) 
  {
   element.style.outline = "5px dashed var(--color-accented)";
  }
  else 
  {
   element.style.outline = "";
  }	   
 }  

 // INVISIBLE ITEMS ARE FILTERED TO GREYSCALE AND SEMI-TRANSPARENT
 for(var element of selected_slide["elements"])
 { 
  if(Document_Element_GetData(element, "visible") == "no") 
  {
   element.style.opacity = "0.25";
  }
  else 
  {
   element.style.opacity = "";
  }	   
 }  
}



















// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                           S A V E                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Editor_Presentation_SaveSlide(slide, forced)
{  
 if(!User_Can("modify-content")) return;
 
 
 // EXISTING SLIDE OR AUTOPICK CURRENT
 if(!slide) slide = Core_State_Get("editor", ["selected-slide"]);
 if(!slide) return;
 

 // DO NOT SAVE IF NO CHANGES OCCURRED SINCE LAST SAVE
 if(!forced && !slide["changed"]) return;
 
 
 // GET CURRENT PRESENTATION 
 var presentation = Core_State_Get("editor", ["presentation"], {});

 
 // GET DATA
 var path     = presentation["path"];
 var slide_id = slide["id"];
 var data     = Presentation_Slide_GetData(slide);
 
 
 // SAVE
 await Core_Api("Presentation_WriteSlide", {path:path, slide_id:slide_id, data:data});
 

 // MARK THE SLIDE AS UNCHANGED SINCE LAST SAVE
 slide["changed"] = false;
}







function Editor_Presentation_SaveElement(element, forced)
{
 if(!User_Can("modify-content")) return;
 
 
 // DO NOT SAVE IF NO CHANGES OCCURRED SINCE LAST SAVE
 if(!forced && Document_Element_GetData(element, "changed") == "no") return;
 
 
 // GET CURRENT PRESENTATION 
 var presentation = Core_State_Get("editor", ["presentation"], {});
 
 // GET SLIDE THE ELEMENT BELONGS TO
 var slide = Document_Element_GetObject(element, "slide");

 
 // GET DATA
 var path       = presentation["path"];
 var slide_id   = slide["id"];
 var element_id = Document_Element_GetData(element, "uid");
 var data       = Presentation_Element_GetData(element);
 
 
 // SAVE
 Core_Api("Presentation_WriteElement", {path:path, slide_id:slide_id, element_id:element_id, data:data});
 
 
 // MARK THE ELEMENT AS UNCHANGED SINCE LAST SAVE
 Document_Element_SetData(element, "changed", "no");
}






