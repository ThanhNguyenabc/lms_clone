// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      S L I D E S                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Editor_Presentation_SlidesControls()
{
 // LOAD TEMPLATES
 var paths     = await Core_Api("Editor_Templates_List", {content:"slides"});
 var templates = Object_From_Paths(paths); 
 Core_State_Set("editor", ["slides-templates"], templates);
	
	
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 var select    = UI_Element_Find(submodule, "slides-list");
 
 
 // PERMISSIONS
 if(User_Can("create-templates")) var cansavetemplate = "enabled"; else var cansavetemplate = false;
 
 
 // SLIDE MENU
 var menu = UI_Menu_Create("elements-create", 
 // MENU ITEMS
 {
  moveup:
  {
   icon:    "arrow-up", 
   text:    UI_Language_String("editor", "slide menu moveup"),
   state:  "enabled",
   func:    function(menu){Editor_Presentation_MoveSlideUp()}
  },
  
  movedown:
  {
   icon:    "arrow-down", 
   text:    UI_Language_String("editor", "slide menu movedown"),
   state:  "enabled",
   func:    function(menu){Editor_Presentation_MoveSlideDown()}
  },
  
  /*
  swap:
  {
   icon:    "arrow-right-arrow-left", 
   text:    UI_Language_String("editor", "slide menu swap"),
   state:  "enabled",
   func:    Editor_Presentation_SwapSlides
  },
  */
  
  reset:
  {
   icon:    "arrows-rotate", 
   text:    UI_Language_String("editor", "slide menu reset"),
   state:  "enabled",
   func:    function(menu){Editor_Presentation_ResetSlide()}
  },

  newslide:
  {
   icon:    "plus", 
   text:    UI_Language_String("editor", "slide menu new"),
   state:  "enabled",
   func:    function(menu){Editor_Presentation_NewSlide()}
  },
  
  duplicate:
  {
   icon:    "clone", 
   text:    UI_Language_String("editor", "slide menu duplicate"),
   state:  "enabled",
   func:    Editor_Presentation_DuplicateSlide
  },


  break1: {},
  
  savetemplate:
  {
   icon:    "star", 
   text:    UI_Language_String("editor", "slide menu savetemplate"),
   state:   cansavetemplate,
   func:    Editor_Presentation_SaveSlideTemplate
  },
 
  loadtemplate:
  {
   icon:    "star-half-stroke", 
   text:    UI_Language_String("editor", "slide menu loadtemplate"),
   state:  "enabled",
   func:    Editor_Presentation_LoadSlideTemplate
  },
  
  break2: {},
 
  delete:
  {
   icon:   "trash-can", 
   text:    UI_Language_String("editor", "slide menu delete"),
   enabled: true,
   func:    function(menu){Editor_Presentation_DeleteSlide()}
  }
 },
 
 // MENU EVENTS
 {
  onshow: Editor_Presentation_MenuSlide
 }); 
 
 UI_Menu_Assign(select, menu);	
	
 // MANAGE KEYPRESS
 select.onkeyup = Editor_Presentation_MoveSlide;
	
	
	
	
 // SLIDE PROPERTIES HANDLER
 var container = UI_Element_Find(submodule, "slide-properties");
 var elements  = Document_Element_FindChildren(container, "uid", undefined, ["recurse"]);
 for(var element of elements)
 {
  var id = Document_Element_GetData(element, "uid");
  id = id.split("-");
  
  if(id[0] == "slide")
  {
   element.onchange = Editor_Presentation_UpdateSlide;
  }
 }
 
  
 // STAGE SELECT
 var select = UI_Element_Find(submodule, "slide-stage");
 UI_Select_FromDatapage(select, "presentation/stages");
 
}




function Editor_Presentation_ListSlides()
{
 var presentation = Core_State_Get("editor", ["presentation"], {});
 var slides       = Safe_Get(presentation, ["slides"], []);
 var selected     = Core_State_Get("editor", ["selected-slide"], undefined);

 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 // LIST SLIDES
 var select       = UI_Element_Find(submodule, "slides-list");
 select.innerHTML = ""; 
 
 for(var slide of slides)
 {   
  var value  = slide["id"];
  var text   = slide["header"]["name"];
  var option = Document_Select_AddOption(select, text, value);
  
  option.selected = (slide == selected);
  
  // LINK
  slide["option"] = option;
  Document_Element_SetObject(option, "slide", slide);
  
  option.onclick = Editor_Presentation_SelectSlide;
 }
 
  
}






function Editor_Presentation_SelectSlide(event, slide)
{ 
 // UNSELECT CURRENTLY SELECTED ELEMENT
 Editor_Presentation_UnselectElement();
 
 // UNSELECT CURRENTLY SELECTED SCRIPT
 Editor_Presentation_UnselectScript();
 
 // SAVE CURRENTLY SELECTED SLIDE
 var current = Core_State_Get("editor", ["selected-slide"]);
 if(current) Editor_Presentation_SaveSlide(current);
 
 
 if(!slide)
 {
  // SELECT NEW SLIDE AND UPDATE
  var slide = Document_Element_GetObject(event.currentTarget, "slide");
  if(!slide) return;
 }
 
 
 // IF SELECTED PROGRAMMATICALLY, UPDATE LISTBOX SELECTION
 if(!event && slide)
 {
  var select           = UI_Element_Find("slides-list");
  select.selectedIndex = Presentation_Slide_Index(slide["presentation"], slide);
 }
 
 // SET AS SELECTED
 Core_State_Set("editor", ["selected-slide"], slide);
 
 
 // RENDER CURRENT SLIDE
 Presentation_Slide_Display(slide);
 
 
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 // LIST THIS SLIDE'S ELEMENTS
 UI_Element_Find(submodule, "elements-list").style.visibility = "visible";
 Editor_Presentation_ListElements();
 
 
 // LIST THIS SLIDE'S SCRIPTS
 UI_Element_Find(submodule, "scripts-list").style.visibility = "visible";
 Editor_Presentation_ListScripts();
 

 // DISPLAY SLIDE PROPERTIES ON PANEL
 Editor_Presentation_DisplaySlide();
 
 
 // DISPLAY SLIDE TITLE
 var title = Safe_Get(slide, ["header", "name"], "");
 UI_Element_Find(submodule, "slide-title").innerHTML = title;
}





function Editor_Presentation_UnselectSlide()
{
 var slide = Core_State_Get("editor", ["selected-slide"]);
 if(!slide) return;
 
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 // CLEAR SLIDE DISPLAY
 var display = UI_Element_Find(submodule, "slides-slide");
 display.style.backgroundColor = "transparent";
 display.innerHTML = "";
 
 // UNSELECT SLIDE
 Core_State_Set("editor", ["selected-slide"], undefined);
 
 // HIDE PANELS THAT ARE NOT SUPPOSED TO BE SEEN IF NO SLIDE IS SELECTED
 UI_Element_Find(submodule, "slide-properties").style.visibility = "hidden";
 UI_Element_Find(submodule, "elements-list").style.visibility    = "hidden";
 UI_Element_Find(submodule, "scripts-list").style.visibility     = "hidden";
 
 
 // UNSELECT THINGS THARE NOT SUPPOSED TO BE SELECTED IF NO SLIDE IS SELECTED
 Editor_Presentation_UnselectElement();
 Editor_Presentation_UnselectScript();
 
 // TITLE
 UI_Element_Find(submodule, "slide-title").innerHTML = "";
 
 // SAVE
 Editor_Presentation_SaveSlide(slide);
}




async function Editor_Presentation_SwapSlides(presentation, index_a, index_b)
{
 var temp                              = presentation["slides"][index_b]["id"];
 presentation["slides"][index_b]["id"] = presentation["slides"][index_a]["id"];
 presentation["slides"][index_a]["id"] = temp;
 
 var temp                        = presentation["slides"][index_b];
 presentation["slides"][index_b] = presentation["slides"][index_a];
 presentation["slides"][index_a] = temp;
 
 await Editor_Presentation_SaveSlide(presentation["slides"][index_a], true);
 await Editor_Presentation_SaveSlide(presentation["slides"][index_b], true);
}




async function Editor_Presentation_MoveSlide(event)
{
 if(!event.ctrlKey) return;
 var swapping = Core_State_Get("editor", ["presentation", "swapping-slides"]);
 if(swapping) return;
 
 Core_State_Set("editor", ["presentation", "swapping-slides"], true);
 
 switch(event.key)
 {
  case "ArrowDown":
     await Editor_Presentation_MoveSlideDown();
  break;
  
  case "ArrowUp":
	await Editor_Presentation_MoveSlideUp();
  break;
 }
	 
 Core_State_Set("editor", ["presentation", "swapping-slides"], false);
}




async function Editor_Presentation_MoveSlideUp()
{
 var presentation = Core_State_Get("editor", ["presentation"]);
 
 var slide = Core_State_Get("editor", ["selected-slide"]);
 if(!slide) return;
 
 var index = presentation["slides"].indexOf(slide);
 
 if(index > 0)
 {  
  await Editor_Presentation_SwapSlides(presentation, index - 1, index);
 }
 
 // UPDATE SLIDES LIST DISPLAY
 Editor_Presentation_ListSlides();
}




async function Editor_Presentation_MoveSlideDown()
{
 var presentation = Core_State_Get("editor", ["presentation"]);
 
 var slide = Core_State_Get("editor", ["selected-slide"]);
 if(!slide) return;
 
 var index = presentation["slides"].indexOf(slide);
 
 if(index < presentation["slides"].length - 1)
 {
  await Editor_Presentation_SwapSlides(presentation, index, index + 1);
 }
 
 // UPDATE SLIDES LIST DISPLAY
 Editor_Presentation_ListSlides();
}




function Editor_Presentation_DeleteSlide(event)
{
 var presentation = Core_State_Get("editor", ["presentation"]);
 
 var slide = Core_State_Get("editor", ["selected-slide"]);
 if(!slide) return;
 
 // UNSELECT CURRENTLY SELECTED ELEMENT BEFORE DELETING THE SLIDE
 Editor_Presentation_UnselectElement();

 // UNSELECT CURRENTLY SELECTED SLIDE BEFORE DELETING IT
 Editor_Presentation_UnselectSlide();
 
 // DELETE THE SLIDE
 var index = presentation["slides"].indexOf(slide);;
 presentation["slides"].splice(index, 1);
 
 
 // DELETE IMMEDIATELY
 Core_Api("Presentation_DeleteSlide", {path:presentation["path"], slide_id:slide["id"]});


 // UPDATE SLIDES LIST DISPLAY
 Editor_Presentation_ListSlides();
}





function Editor_Presentation_NewSlide(event)
{
 var presentation = Core_State_Get("editor", ["presentation"]);
 
 
 // CREATE NEW SLIDE
 var slide = Presentation_Slide_Create(undefined, {}, presentation);
 
 
 // SAVE IMMEDIATELY
 Editor_Presentation_SaveSlide(slide, true);
 
 
 // SELECT AND DISPLAY
 Core_State_Set("editor", ["selected-slide"], slide);
 Editor_Presentation_ListSlides();
}





function Editor_Presentation_DuplicateSlide()
{
 var slide = Core_State_Get("editor", ["selected-slide"]);
 if(!slide) return;
 
 // DUPLICATE CURRENT SLIDE
 var duplicate = Presentation_Slide_Duplicate(slide); 
 
 // SAVE IMMEDIATELY
 Editor_Presentation_SaveSlide(duplicate, true);
 
 // UPDATE SLIDES LIST
 Editor_Presentation_ListSlides();
}





function Editor_Presentation_DisplaySlide()
{
 // GET SELECTED ELEMENT INFO
 var slide = Core_State_Get("editor", ["selected-slide"]);
 if(!slide) return;

 // GET SUBMODULE BODY
 var submodule = Module_Page_Body(); 

 var container = UI_Element_Find(submodule, "slide-properties");
 var controls  = Document_Element_FindChildren(container, "uid", undefined, ["recurse"]);
 for(var control of controls)
 {
  // GET WHAT ELEMENT PROPERTY THIS CONTROL... CONTROLS
  var id     = Document_Element_GetData(control, "uid");
  var field  = id.split("-");  
  field      = field.slice(1, field.length).join("-");
  
  control.value = slide["header"][field] || ""; 

  Editor_Control_UpdateQuirks(control);
 }	 
 
 UI_Element_Find(submodule, "slide-properties").style.visibility = "visible";
}




async function Editor_Presentation_UpdateSlide(event)
{	 
 // GET CURRENT PRESENTATION 
 var presentation = Core_State_Get("editor", ["presentation"], {});


 // GET CONTROL INFO AND PROPERTY THAT IT AFFECTS
 var control = event.currentTarget;
 var id      = Document_Element_GetData(control, "uid");
 
 
 // GET SELECTED SLIDE INFO
 var slide = Core_State_Get("editor", ["selected-slide"]);
 if(!slide) return;
 
 
 var field  = id.split("-");  
 field      = field.slice(1, field.length).join("-");
 

 
 switch(field)
 {
  case "name":
	slide["header"][field] = control.value; 
	
	var option  = slide["option"];
	option.text = control.value;
  break;
  
  case "color":
	slide["header"][field] = control.value; 
	
	Presentation_Slide_Display(slide);
  break;
  
  default:
	slide["header"][field] = control.value; 
  break;
 }
 
 
 Editor_Control_UpdateQuirks(control);
 
 
 // MARK CURRENT SLIDE AS CHANGED
 Editor_Presentation_SlideChanged();
}





function Editor_Presentation_SlideChanged(slide)
{
 if(!slide) var slide = Core_State_Get("editor", ["selected-slide"]);
 if(!slide) return;
 
 slide["changed"] = true;
}




function Editor_Presentation_ResetSlide(slide)
{
 if(!slide) var slide = Core_State_Get("editor", ["selected-slide"]);
 if(!slide) return;
 
 // RESET AND REDRAW
 Presentation_Slide_Reset(slide);
 Presentation_Slide_Display(slide);
 
 // UPDATE ELEMENTS LIST
 //Editor_Presentation_ListElements();
}




async function Editor_Presentation_SaveSlideTemplate()
{
 var presentation = Core_State_Get("editor", ["presentation"]);
 
 var slide = Core_State_Get("editor", ["selected-slide"]);
 if(!slide) return;
 
 
 var picture  = Resources_URL("images/cover-files.jpg");
 var title    = UI_Language_String("editor/presentation", "template save title");
 var button   = UI_Language_String("editor/presentation", "template save button");
 var subtitle = false;
 
 var text         = {};
 text["name"]     = UI_Language_String("editor/presentation", "template save name");
 text["category"] = UI_Language_String("editor/presentation", "template save category");

 var content = UI_Element_Create("editor/slides-savetemplate", text); 
 
 var category_select  = UI_Element_Find(content, "category");
 UI_Select_FromDatapage(category_select, "editor/slides-templates", undefined);
 
 var name_edit        = UI_Element_Find(content, "name");
 
 var save = 
 async function()
 {
  var source    = Safe_Get(slide, ["presentation", "path"]);
  var source_id = slide["id"];
  var category  = category_select.value;
  var name      = name_edit.value.trim() ?? slide_id;
  var dest      = "content/templates/slides/" + category + "/" + name;
  var dest_id   = "slide";
  
  await Core_Api("Presentation_CopySlide", {source, source_id, dest, dest_id});
  
  UI_Popup_Close(popup);
 }
 
 var popup = await UI_Popup_Create({title, subtitle, picture, content}, [{text:button, onclick:save}], undefined, {escape:true, open:true});
}



async function Editor_Presentation_LoadSlideTemplate()
{
 // GET CURRENT INFO
 var presentation = Core_State_Get("editor", ["presentation"]); 
 
 var slide = Core_State_Get("editor", ["selected-slide"]);
 if(!slide) return;
 
 
 // POPUP 
 var picture  = Resources_URL("images/cover-files.jpg");
 var title    = UI_Language_String("editor/presentation", "template load title");
 var button   = UI_Language_String("editor/presentation", "template load button");
 var subtitle = false;
 
 var content   = UI_Element_Create("editor/slides-loadtemplate", {}); 

 var categories      = Core_State_Get("editor", "slides-templates");
 var keys            = Object.keys(categories);
 var category_select = UI_Element_Find(content, "category"); 
 for(var key of keys)
 {   
  var text = UI_Language_String("editor/slides-templates", key);
  Document_Select_AddOption(category_select, text, key);
 }
 
 category_select.onchange = 
 function()
 {
  var name_select = UI_Element_Find(content, "name");
  Document_Select_Clear(name_select);
  
  var categories = Core_State_Get("editor", "slides-templates");
  var category   = category_select.value;
  var names      = Object.keys(categories[category] || {});
   
  for(var name of names)
  {
   Document_Select_AddOption(name_select, name, name);
  }	  
 }
 
 category_select.onchange();


 // ON CONFIRM
 var load = 
 async function()
 { 
  // GET CURRENT INFO
  var presentation = Core_State_Get("editor", ["presentation"]); 
 
  var slide = Core_State_Get("editor", ["selected-slide"]);
  if(!slide) return;
  
  var name_select     = UI_Element_Find(content, "name");
  var category_select = UI_Element_Find(content, "category"); 


  // COPY FROM SELECTED TEMPLATE TO CURRENT SLIDE
  var source    = "content/templates/slides/" + category_select.value + "/" + name_select.value;
  var source_id = "slide";
 
  var dest     = presentation["path"];
  var dest_id  = slide["id"];
  
  await Core_Api("Presentation_CopySlide", {source, source_id, dest, dest_id});
  
  
  // RELOAD SLIDE
  var slide = await Presentation_Slide_Reload(dest, dest_id, presentation);

  

  // UPDATE STRUCTURES AND DISPLAYS, AND AUTOSELECT SLIDE
  await Presentation_UpdateResources(presentation);

  Editor_Presentation_ListResources();
  Editor_Presentation_ListSlides();

  Editor_Presentation_SelectSlide(false, slide);
  Editor_Presentation_ListElements();
  Editor_Presentation_ListScripts();  
  
  // CLOSE
  UI_Popup_Close(popup);
 }
 
 var popup = await UI_Popup_Create({title, subtitle, picture, content}, [{text:button, onclick:load}], undefined, {escape:true, open:true});
}





// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                           M E N U S                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//




function Editor_Presentation_MenuSlide(menu)
{
 var selected_slide = Core_State_Get("editor", ["selected-slide"]);
  
 var menu_item = UI_Menu_GetItem(menu, "delete");
 if(selected_slide) menu_item["state"] = "enabled"; else menu_item["state"] = "disabled"; 	
}