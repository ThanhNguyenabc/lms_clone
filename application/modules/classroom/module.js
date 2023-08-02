// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                   C L A S S R O O M                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



async function Classroom_OnLoad(module, data)
{  
 var page = Client_Location_Parameter("page");
 Core_State_Set("classroom", "page", page);
 
 
 // SET BY ANOTHER MODULE? 
 if(!class_id)
 {
  var class_id = Core_State_Get("global", ["view-class"], false);
  if(class_id)
  {
   // UNSET
   Core_State_Set("global", ["view-class"], false);
  }
 }
 
 // SET BY URL?
 if(!class_id)
 {
  var class_id = Client_Location_Parameter("class");
 }
  
 
 // SET CLASS AS CURRENT
 Core_State_Set("classroom", ["current-class"], class_id);
 
 // STILL NO VALID CLASS TO READ? THEN LEAVE
 if(class_id)
 {
  // LOAD CLASSROOM DATA (PEOPLE, LESSON ID, ETC.)
  var classdata = await Classes_Load(class_id, {seats:true, users:true});
 }
 else
 {
  var classdata = {};
 }
 
 Core_State_Set("classroom", ["class"], classdata);
 
  
 // LOAD LESSON AND STORE IT
 var force_lesson    = Client_Location_Parameter("lesson_id");
 var lesson_id       = force_lesson || Safe_Get(classdata, ["info", "lesson_id"], "null");
 var lesson          = await Lesson_Load(lesson_id, {all:true});
 classdata["lesson"] = lesson;
 Core_State_Set("classroom", ["lesson"], lesson);
  
 var presentation_source = "content/lessons/" + lesson_id + "/presentation";

 // LOAD PRESENTATION
 var presentation        = await Presentation_Load(presentation_source); 
 Core_State_Set("classroom", ["presentation"], presentation);
 
 // *** HACK *** ADJUST PRESENTATION (CONVERT ONCLICK TO SCRIPTS)
 Presentation_Adjust_OnclickToScripts(presentation);
 
 // CREATE SLIDES MENUS
 var index = 0;
 for(var slide of presentation["slides"])
 {
  // CREATE SLIDE MENU
  var items = {};
 
  
  
  // SCRIPTS MENU
  var scripts = slide["scripts"] || [];
  for(var script of slide["scripts"])
  {
   var id        = script["id"];
   var item      = {};
   
   item["text"]  = script["name"];
   item["state"] = "enabled";
   item["icon"]  = "play";
   item["func"]  = Classroom_Manage_RunScript;
   item["tag"]   = {slide_id:slide["id"], script_id:script["id"]}; 
   
   items[id] = item;
  }
  

  // CLICKABLE ITEMS MENU
  var clickable = [];
  var elements  = slide["elements"] || [];
  for(var element of elements)
  {
   if(Presentation_Element_Active(element)) clickable.push(element);
  }
		
 
  for(var element of clickable)
  {
   if(Presentation_Element_Active(element))
   {
	var id        = Document_Element_GetData(element, "uid");
    var item      = {};
   
    item["text"]  = Document_Element_GetData(element, "name");
    item["state"] = "enabled";
	item["icon"]  = "hand-point-right";
    item["func"]  = Classroom_Manage_TriggerElement;
    item["tag"]   = {slide_id:slide["id"], element_id:id}; 
   
    items[id] = item;
   }
  }
  
  
  
  
  // IF THERE WERE ANY SCRIPTS OR CLICKABLE ELEMENTS, ADD A BREAK LINE
  if(clickable.length > 0 || scripts.length > 0) 
  {  
   items["break1"] = 
   {
    id:"break1"
   }  
  }
  
  
  // VOCAB SUBMENU
  var vocabulary = Core_State_Get("classroom", ["lesson", "vocabulary"]);
  if(Safe_Length(vocabulary) > 0)
  {
   var subitems = {};
   
   for(var id in vocabulary)
   {
	var term      = vocabulary[id];
    var item      = {};
	
	item["text"]  = UI_Language_Object(term["info"] || {});
    item["state"] = "enabled";
	item["icon"]  = "language";
    item["func"]  = Classroom_Manage_SendVocabulary;
    item["tag"]   = term; 
	
	subitems[id]  = item;
   }
   
   
   // CREATE SUBMENU
   var item = {};
   
   item["text"]        = UI_Language_String("classroom/manage", "menu presentation vocabulary");
   item["state"]       = "enabled";
   item["icon"]        = "book";
   item["submenu"]     = UI_Menu_Create("vocabulary", subitems);
   
   items["vocabulary"] = item;
  }
  
  
  
  
  // DOCUMENTS SUBMENU
  var lesson    = Core_State_Get("classroom", ["lesson"], {});
  var documents = Object_Subset(lesson, "document "); //console.log(documents);
  if(Safe_Length(documents) > 0)
  {
   var subitems = {};
   
   for(var id in documents)
   {
    var item      = {};
	var document  = documents[id];
	var file      = document["file"];
		
	item["text"]  = UI_Language_Object(document) || file;
    item["state"] = "enabled";
	item["icon"]  = "file";
    item["func"]  = Classroom_Manage_OpenDocument;
    item["tag"]   = {file}; 
	
	subitems[id]  = item;
   }
   
   
   // CREATE SUBMENU
   var item = {};
   
   item["text"]        = UI_Language_String("classroom/manage", "menu presentation documents");
   item["state"]       = "enabled";
   item["icon"]        = "folder-open";
   item["submenu"]     = UI_Menu_Create("documents", subitems);
   
   items["documents"]  = item;
  }
  
  
  
  // LINKS SUBMENU
  var lesson = Core_State_Get("classroom", ["lesson"], {});
  var links  = Object_Subset(lesson, "link");
  if(Safe_Length(links) > 0)
  {
   var subitems = {};
   
   for(var id in links)
   {
    var item      = {};
	var link      = links[id];
	var url       = link["url"];
		
	item["text"]  = UI_Language_Object(link);
    item["state"] = "enabled";
	item["icon"]  = "passport";
    item["func"]  = Classroom_Manage_OpenLink;
    item["tag"]   = {url}; 
	
	subitems[id]  = item;
   }
   
   
   // CREATE SUBMENU
   var item = {};
   
   item["text"]        = UI_Language_String("classroom/manage", "menu presentation links");
   item["state"]       = "enabled";
   item["icon"]        = "globe";
   item["submenu"]     = UI_Menu_Create("links", subitems);
   
   items["links"] = item;
  }
  
  
  // BREAK LINE
  items["break2"] = 
  {
   id:"break2"
  } 
  
  
  // CLEAN PRESENTATION LAYERS
  items["clean"] = 
  {
   id:    "clean",
   icon:  "soap", 
   text:  UI_Language_String("classroom/manage", "menu projector clean"),
   state: "enabled",
   func:  Classroom_Manage_CleanProjector,
   tag:   slide
  }
  
 
  // RESET SLIDE
  items["reset"] = 
  {
   id:    "reset",
   icon:  "arrows-rotate", 
   text:  UI_Language_String("classroom/manage", "menu slide reset"),
   state: "enabled",
   func:  Classroom_Manage_ResetSlide,
   tag:   slide
  }
  
  var menu      = UI_Menu_Create(slide["id"], items);
  slide["menu"] = menu;
 
  index = index + 1;
 }
 
}




async function Classroom_OnShow(module, data)
{
 // SET INITIAL PAGE
 var page = Core_State_Get("classroom", ["page"]);
 if(!page) var page = Client_Location_Parameter("page") || "manage";
 
 var submodule       = UI_Element_Create("classroom/" + page);  
 var container       = UI_Element_Find("module-page");
 
 // HIDE SOME COMPONENTS BASED ON ROLE
 switch(User_Role())
 {
  case "ta":
	UI_Element_Find(submodule, "presentation-panel-left").style.display = "none";
  break;
 }
 
 
 container.innerHTML = "";
 container.appendChild(submodule);
 
 var func = "Classroom_" + String_Capitalize_Initial(page);
 window[func]();
}





async function Classroom_OnUnload()
{
 // CLOSE PROJECTOR IF OPENED
 var projector = Core_State_Get("classroom", ["projector"]); 
 if(projector)
 {
  Classroom_Manage_TriggerEvent("close");
  
  Core_State_Set("classroom", ["projector"], false);
 }
}




function Classroom_Find_Student(id)
{
 var seats = Core_State_Get("classroom", ["class", "seats"], {});
 
 for(var seat_id in seats)
 {
  var seat = seats[seat_id];
  
  var student_id = Safe_Get(seat, ["student", "id"]);
  if(id == student_id)
  {
   return seat["student"];
  }
 }
 
 return false;
}



function Classroom_Find_Term(id)
{
 var vocabulary = Core_State_Get("classroom", ["lesson", "vocabulary"], {});
 var term       = vocabulary[id];
 
 return term;
}





function Classroom_Link()
{
 var class_id  = Core_State_Get("classroom", "current-class");
 var lesson_id = Core_State_Get("classroom", ["lesson", "source"]);
 var slide_id  = Core_State_Get("classroom", ["current-slide", "id"]);
 
 var link      = "?framework=null&module=classroom&page=present&lesson_id=" + lesson_id + "&class=" + class_id + "&slide=" + slide_id;

 return link;
}




function Classroom_Mode()
{
 var page = Core_State_Get("classroom", "page");
 
 return page;
}