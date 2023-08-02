// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      L E S S O N S                                             //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Lesson_Load(source, data = {})
{ 
 var lesson       = await Core_Api("Lesson_Read", {source:source, data:data}) || {};
 lesson["source"] = source;

 Lesson_AdjustDocuments(lesson);
  
 return lesson;
}



function Lesson_AdjustDocuments(lesson)
{
 // AUTOADJUST DOCUMENTS : FOR EACH ONE OF THE FILES CONTAINED IN "DOCUMENTS", SEE IF IT WAS ASSOCIATED TO AN EXISTING "DOCUMENT XX" SECTION
 var documents = Object_Subset(lesson, "document ")
 var sections  = {};
 var count     = 0;
 
 for(var file of lesson["documents"] || [])
 {  
  var search = Path_RemoveExtension(file).toLowerCase();
  var found  = false;
  
  for(var id in documents)
  {   
   var filename = (documents[id]["file"] || "");
   
   if(Path_RemoveExtension(filename).toLowerCase() == search) 
   {
	found  = true;
    var en = documents[id]["en"] || Path_RemoveExtension(file);
	
	break;
   }
  }
  
  if(!found) var en = Path_RemoveExtension(file);
  
  sections["document " + count.toString().padStart(2, "0")] = {file, en};
  
  count++;
 }
 
 Object_Purge(lesson, "document ");
 for(var id in sections)
 {
  lesson[id] = sections[id];
 }
}



async function Lesson_Summary_Popup(lesson)
{
 // GATHER DATA
 
 var userid = User_Id();

 if(typeof lesson == "string") var source = lesson; else var source = Safe_Get(lesson, ["source"], "");
 Core_State_Set("lesson", ["summary", "source"], source); 

 var info   = await Core_Api("Lesson_Metadata", {lesson:source, options:{rating:userid}});
 Core_State_Set("lesson", ["summary", "info"], info); 
 
 
 
 // CREATE POPUP
 var popup  = await UI_Popup_Create({}, [], "lessons/summary", {open:false, escape:true});
 Core_State_Set("lesson", ["summary", "popup"], popup); 
 
 var element  = UI_Element_Find(popup, "lesson-cover");
 var source   = "content/lessons/" + Safe_Get(lesson, ["source"], "") + "/cover.png";
 var fallback = Resources_URL("images/cover-lesson.jpg");
 Document_Image_Load(element, [source, fallback]);
 
 var element       = UI_Element_Find(popup, "lesson-type");
 var text          = UI_Language_String("lessons/types", Safe_Get(lesson, ["info", "type"], "standard"));
 element.innerHTML = text;
 
 var element       = UI_Element_Find(popup, "lesson-title");
 var text          = UI_Language_Object(Safe_Get(lesson, ["title"], {}));
 element.innerHTML = text;
 
 var element       = UI_Element_Find(popup, "lesson-desc");
 var text          = UI_Language_Object(Safe_Get(lesson, ["desc-teacher"], {}));
 element.innerHTML = text;
 
 
 // AUTHORS
 var container = UI_Element_Find(popup, "lesson-authors");
 var authors   = info["authors"] || [];
 for(var author of authors)
 {
  var name = []; 
  if(author["firstname"]) name.push(author["firstname"]);
  if(author["lastname"])  name.push(author["lastname"]);
  name = name.join(" ");
  
  var item  = UI_Element_Create("lessons/summary-author", {name});
  var image = UI_Element_Find(item, "image");
  
  User_Picture_Load(image, author["id"]);
  
  container.appendChild(item);
 }
  
 // RATING
 Lesson_Summary_UpdateRating();
 
 // FEEDBACK
 var element         = UI_Element_Find(popup, "lesson-feedback");
 element.placeholder = UI_Language_String("lessons/popups", "summary notes placeholder");
 element.value       = info["feedback"] || "";
 
 element.onchange    =
 function(event)
 {
  var element = event.currentTarget;
  var source  = Core_State_Get("lesson", ["summary", "source"]);  
  
  Core_Api("Lesson_Feedback", {lesson:source, feedback:element.value});
 }
 
 await UI_Popup_Show(popup);
}



function Lesson_Summary_UpdateRating()
{
 var info  = Core_State_Get("lesson", ["summary", "info"]);
 var popup = Core_State_Get("lesson", ["summary", "popup"]); 
 
 var score           = info["rating"] || 0;
 var container       = UI_Element_Find(popup, "lesson-rating");
 container.innerHTML = "";
 
 for(var i = 1; i<=5; i++)
 {
  if(i <= score) var template = "full"; else var template = "empty";
  var point = UI_Element_Create("lessons/summary-point-" + template);
  
  Document_Element_SetData(point, "score", i);
  point.onclick = Lesson_Summary_Rate;
 
  container.appendChild(point);
 }
}



async function Lesson_Summary_Rate(event)
{
 var point  = event.currentTarget;
 var score  = Document_Element_GetData(point, "score");
 
 var userid = User_Id();
 var info   = Core_State_Get("lesson", ["summary", "info"]);
 var source = Core_State_Get("lesson", ["summary", "source"]);  
 
 Safe_Set(info, ["rating"], score);
 Lesson_Summary_UpdateRating();
 
 Core_Api("Lesson_Rate", {lesson:source, userid, score});
}




function Lesson_Id_Decode(id)
{
 var parts = String_Split(id, ["_", "-", ".", " "]);
   
 // PAD MISSING PARTS
 for(var i = parts.length; i<3; i++)
 {
  Array_Element_Insert(parts, 0, "");
 }
 
 var decoded = 
 { 
  program : parts[0],
  level   : parts[1],
  lesson  : parts[2]
 }
 
 return decoded;
}




async function Lesson_Popup_SelectFromCatalog(selected, options = {})
{
 var promise = new Promise(async(resolve, reject) =>
 {
  var lessons = await Resources_Lessons();
  var catalog = Safe_Get(lessons, ["catalog"], {});
     
  var content        = UI_Element_Create("lessons/popup-catalog-select", {}, {language:"lessons/popups"});
  var program_select = UI_Element_Find(content, "program");
  var level_select   = UI_Element_Find(content, "level");
  var lesson_select  = UI_Element_Find(content, "lesson");
 
  // PROGRAMS
  var programs = Object.keys(catalog);
  Document_Select_AddOption(program_select, "", "");
  Document_Select_OptionsFromValues(program_select, programs, programs);
  program_select.onchange = 
  function()
  {
   Document_Select_Clear(level_select);   
   Document_Select_Clear(lesson_select);
  
   Document_Select_AddOption(level_select, "", "");
  
   var program = program_select.value;
   var levels  = Object.keys(catalog[program]);
   Document_Select_OptionsFromValues(level_select, levels, levels);
  }
  
  // LEVELS
  level_select.onchange = 
  function()
  {
   Document_Select_Clear(lesson_select); 
   Document_Select_AddOption(lesson_select, "", "");
  

   var program = program_select.value;
   var level   = level_select.value;
   
   var lessons  = Object.keys(catalog[program][level] || {});
   Document_Select_OptionsFromValues(lesson_select, lessons, lessons);
  }
  
  
  if(selected)
  {
   var parts = Lesson_Id_Decode(selected);
   
   program_select.value = parts["program"];
   program_select.onchange();
   
   level_select.value = parts["level"];
   level_select.onchange();
   
   lesson_select.value = parts["lesson"];
  }
  
   
  var onescape =
  function()
  {
   resolve(false);
   
   return true;
  }
  
  var button_select = 
  {
   text   : UI_Language_String("lessons/popups", "catalog select select"),
   onclick:
   function(popup)
   {
	var program = program_select.value;
    var level   = level_select.value;
    var lesson  = lesson_select.value;
	
	// IF OPTIONS DICTATE WE CAN ACCEPT PARTIAL LESSON CODES...
	if(options["partial"])
	{
     var  id = [];
     
	 if(program) id.push(program);
	 if(level)   id.push(level);
	 if(lesson)  id.push(lesson);
	 
	 id = id.join(options["partial"]);
	 resolve(id);
	}
	else
    {
     // OTHERWISE, THE COMBINED LESSON MUST EXIST
     var id = Safe_Get(catalog, [program, level, lesson, "id"], false);
     resolve(id);	
	}
	
	UI_Popup_Close(popup);
   }
  }
 
  await UI_Popup_Create({content}, [button_select], "flexi", {open:true, escape:onescape});
  
  // RESOLVE
 });
 
 return promise;
}



async function Lesson_Bookpage_Render(source)
{
 var lesson     = await Core_Api("Lesson_Read", {source:source, data:{all:true}});
 var bookpage   = await Bookpage_Read("content/lessons/" + source + "/bookpage");
 var dialogue   = await Dialogue_Read("content/lessons/" + source + "/dialogue");
 var vocabulary = await Vocabulary_Terms_Read("content/lessons/" + source);
 
 var extras = {};
 

 // TITLE
 extras["title"]     = UI_Language_Object(lesson["title"] || {});
 extras["lesson-id"] = source;
 extras["cover"]     = "content/lessons/" + source + "/cover.png";
 
 // TYPE 
 var type            = Safe_Get(lesson, ["info", "type"], "");
 var info            = Core_Data_Value("lessons/types", type, "bookparagraph") || "***";
 extras["type"]      = UI_Language_Object(info, "");
 
 // DIALOGUE
 var display              = await Dialogue_Display(dialogue, "columns");
 extras["dialogue"]       = display.outerHTML;
 
 var title                = Safe_Get(dialogue, ["info", "title"], {}); 
 extras["dialogue-title"] = UI_Language_Object(title, "");
 
 
 // VOCABULARY
 var vocabulary       = await Vocabulary_Display(vocabulary, "dynamic");
 extras["vocabulary"] = vocabulary.outerHTML;
  
  
 // RENDER PAGE
 var rendered = await Bookpage_Render(bookpage, extras, {scale:true, layout:false, shadow:true});
 return rendered;
}



async function Lesson_Bookpage_Window(lesson)
{
 var info    = await Client_Screen_Info();
 var display = info["primary"] || window.screen;

 var url     = Client_Location_Current() + "?module=bookpage&lesson=" + lesson + "&framework=null&print=true";
 var win     = window.open(url, "bookpage", "popup, width="+ display["availWidth"] + ", height=" + display["availHeight"] + ", fullscreen=yes");
 
 return win;
}