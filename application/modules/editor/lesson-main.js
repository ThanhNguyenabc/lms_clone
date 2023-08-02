// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         L E S S O N                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Editor_Lesson(submodule)
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 

 // SMART FINDER
 var icon = UI_Element_Find(submodule, "lessons-find");
 icon.onclick = 
 async function()
 {
  var current = Core_State_Get("editor", ["lessons", "selected-lesson"]);
  var id      = await Lesson_Popup_SelectFromCatalog(current);
  if(id)
  {
   Core_State_Set("editor", ["lessons", "selected-lesson"], id);
   Editor_Lesson_Select();
  }
 }

 
 // NEW LESSON
 var icon = UI_Element_Find(submodule, "lessons-new");
 icon.onclick = Editor_Lesson_New;

 // DELETE LESSON
 var icon = UI_Element_Find(submodule, "lessons-delete");
 icon.onclick = Editor_Lesson_Delete;


 // CONTENT PREVIEW AND EDITING HEADER 
 UI_Element_Find(submodule, "lesson-panel-header"); 
 var header = UI_Header("lesson-selector-header",
 {
  cover:
  {
   text :   UI_Language_String("editor", "lesson cover title"),
   icons:   [],
   onclick: Editor_Lesson_DisplayCover
  },
  
  presentation:
  {  
   text :   UI_Language_String("editor", "lesson presentation title"),
   icons:   [{icon:"pen-to-square", onclick:Editor_Lesson_EditPresentation}, {icon:"caret-left", onclick:Editor_Lesson_PresentationPrev}, {icon:"caret-right", onclick:Editor_Lesson_PresentationNext}],
   onclick: Editor_Lesson_DisplayPresentation
  },
  
  test:
  {
   text :   UI_Language_String("editor", "lesson homework title"),
   icons:   [{icon:"pen-to-square", onclick:Editor_Lesson_EditTest}, {icon:"caret-left", onclick:Editor_Lesson_TestPrev}, {icon:"caret-right", onclick:Editor_Lesson_TestNext}],
   onclick: Editor_Lesson_DisplayTest
  },
  
  documents:
  {
   text :   UI_Language_String("editor", "lesson documents title"),
   icons:   [{icon:"file-medical", onclick:Editor_Lesson_UploadDocuments}],  
   onclick: Editor_Lesson_DisplayDocuments 
  },
  
  dialogue:
  {
   text :   UI_Language_String("editor", "lesson dialogue title"),
   icons:   [{icon:"pen-to-square", onclick:Editor_Lesson_EditDialogue}],
   onclick: Editor_Lesson_DisplayDialogue
  },
  
  bookpage:
  {
   text :   UI_Language_String("editor", "lesson bookpage title"),
   icons:   [{icon:"pen-to-square", onclick:Editor_Lesson_EditBookpage}, {icon:"book-open", onclick:Editor_Lesson_PreviewBookpage}],
   onclick: Editor_Lesson_DisplayBookpage
  },
  
 }, {selectfirst:false, css:"color-noted"});
 
 UI_Element_Find(submodule, "components-header").appendChild(header);
 Core_State_Set("editor", ["lessons", "components-header"], header);
 
 
 // RETRIEVE LAST LESSON EDITED
 var wip = await Core_Api("User_Config_Read", {file:"editor", section:"wip", field:"lesson"});
 if(wip)
 {
  Core_State_Set("editor", ["lessons", "selected-lesson"], wip);
  await Editor_Lesson_Select();
 }
 else
 {
  await Editor_Lesson_Unselect();
 }
 
 
}





async function Editor_Lesson_Select()
{
 var submodule = Module_Page_Body();
 var id        = Core_State_Get("editor", ["lessons", "selected-lesson"]);
 
 UI_Element_Find(submodule, "lessons-current").value = id;
 
 var path   = "content/lessons/" + id;
 
 Core_State_Set("editor", ["lessons", "presentation"], false);
 Core_State_Set("editor", ["lessons", "test"],         false);
 Core_State_Set("editor", ["documents", "index"],      false); 


 Core_State_Set("editor", ["lessons", "source"], path);
  
 var data     = await Lesson_Load(id, {documents:true});
 var config   = Core_Data_Page("lessons/template");
 var template = Data_Page_FromConfig(config);
 var lesson   = Data_Page_Complete(data, template);
  
 Core_State_Set("editor", ["documents",  "index"], lesson["documents"]); 
  

 // DISPLAY DATA SOURCES
 var outcomes   = await Resources_Outcomes(false, "list");
 var vocabulary = await Resources_Vocabulary(false, "list");
 var documents  = Core_State_Get("editor", ["documents",  "index"], []);
 var projects   = await Resources_Projects(false, "list");
 var developers = Core_State_Get("editor", ["developers", "index"], []); 
 var skills     = await Resources_Skills();

 
 var container  = UI_Element_Find(submodule, "lesson-edit");
 var editor     = Editor_Data(container, lesson, config, {outcomes, vocabulary, documents, projects, developers, skills}, Editor_Lesson_Save, Editor_Lesson_Event);
 Core_State_Set("editor", ["lesson", "editor"], editor);
 

 
 // SHOW PANELS 
 UI_Element_Find(submodule, "lesson-panel-edit").style.visibility       = "visible";
 UI_Element_Find(submodule, "lesson-panel-components").style.visibility = "visible";
 UI_Element_Find(submodule, "lessons-delete").style.display             = "flex";
 UI_Element_Find(submodule, "components-content").innerHTML             = "";
 
 var header = Core_State_Get("editor", ["lessons", "components-header"]);
 var tab    = Core_State_Get("editor", ["lessons", "components-tab"]);
 if(tab) 
 {
  UI_Header_Set(header, tab, true);
 }
 
 
 // STORE AS LAST LESSON EDITED
 Core_Api("User_Config_WriteValue", {file:"editor", section:"wip", field:"lesson", value:id});
 
 //Document_Element_Restore(list);
}






async function Editor_Lesson_Unselect()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 UI_Element_Find(submodule, "lessons-current").value = "";
 Core_State_Set("editor", ["lessons", "selected-lesson"], false);

 //UI_Element_Find(submodule, "lesson-panel-edit").style.visibility        = "hidden";
 UI_Element_Find(submodule, "lesson-panel-components").style.visibility  = "hidden";
 UI_Element_Find(submodule, "lessons-delete").style.display              = "none";
 UI_Element_Find(submodule, "components-content").innerHTML              = "";
 
 UI_Element_Find(submodule, "lesson-edit").innerHTML = "";
}





async function Editor_Lesson_New()
{
 var title       = UI_Language_String("editor/lesson", "popup new title");
 var placeholder = UI_Language_String("editor/lesson", "popup new placeholder");
 var id          = await UI_Popup_Input(title, undefined, undefined, placeholder);
 if(!id) return;
 
 var path   = "content/lessons/" + id;
 
 var config = Core_Data_Page("lessons/template");
 var data   = Data_Page_FromConfig(config);
 
 await Core_Api("Lesson_Write", {path:path, data:data});
  
 Core_State_Set("editor", ["lessons", "selected-lesson"], id);
 await Editor_Lesson_Select();
 
 Resources_Lessons(true);
}





async function Editor_Lesson_Delete()
{
 var id       = Core_State_Get("editor", ["lessons", "selected-lesson"]); 
  
 var title    = UI_Language_String("editor/lesson", "popup delete title");
 var subtitle = UI_Language_String("editor/lesson", "popup delete subtitle", {id});
 var confirm  = await UI_Popup_Code(title, subtitle, undefined, id);
 if(!confirm) return;
  
 var path = "content/lessons/" + id;
 
 Editor_Lesson_Unselect();
 await Core_Api("Lesson_Delete", {path:path});
 
 Resources_Lessons(true)
}




async function Editor_Lesson_Event(editor, event, id, item)
{
 if(!User_Can("modify-content")) return;
 console.log(id);
 
 switch(event)
 {
  case "delete-section":
	if(id.startsWith("document"))
	{
     var file   = "documents/" + item["file"];
	 var lesson = Core_State_Get("editor", ["lessons", "selected-lesson"]);
	 
     Core_Api("Editor_Lesson_DeleteFile", {lesson, file});
	}
  break;
 }
 
}


async function Editor_Lesson_Save(editor, event, item)
{
 if(!User_Can("modify-content")) return;
  
 var data = Document_Element_GetObject(editor, "data", {});
 
 var id   = Core_State_Get("editor", ["lessons", "selected-lesson"]);
 var path = "content/lessons/" + id;
 
 await Core_Api("Lesson_Write", {path:path, data:data});
}





async function Editor_Lesson_EditComponent(component)
{
 var lesson = Core_State_Get("editor", ["lessons", "selected-lesson"]);
 var source = "content/lessons/" + lesson + "/" + component;
 
 Core_State_Set("editor", "edit-" + component, source);
 Core_State_Set("editor", "back-to", component);
 
 console.log(component);
 await Module_Page_Set(component);
 
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 var back      = UI_Element_Find(submodule, "editor-lesson-back");
 if(back) 
 {
  back.style.display = "flex";

  back.onclick =
  async function()
  {
   await Module_Page_Set("lesson");
   
   var component = Core_State_Get("editor", "back-to");
   var header    = Core_State_Get("editor", ["lessons", "components-header"]);
   
   UI_Header_Set(header, component, true);
  }
 }
 
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                    P R E S E N T A T I O N                                     //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Editor_Lesson_DisplayPresentation()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 Core_State_Set("editor", ["lessons", "components-tab"], "presentation");
  
 var presentation = Core_State_Get("editor", ["lessons", "presentation"]);
 
 if(!presentation)
 {
  var path         = Core_State_Get("editor", ["lessons", "source"]);
  var presentation = await Presentation_Load(path + "/presentation");
  Core_State_Set("editor", ["lessons", "presentation"], presentation);
 }
 
 var display      = UI_Element_Create("editor/lesson-presentation");

 var container       = UI_Element_Find(submodule, "components-content");
 container.innerHTML = "";
 container.appendChild(display); 
 
 Presentation_Assign(presentation, display);
 Presentation_Slide_Display(presentation["slides"][0]); 
}



async function Editor_Lesson_EditPresentation()
{
 await Editor_Lesson_EditComponent("presentation");
}


function Editor_Lesson_PresentationPrev()
{
 var presentation = Core_State_Get("editor", ["lessons", "presentation"]);
 
 Presentation_Slide_Prev(presentation, true);
} 


function Editor_Lesson_PresentationNext()
{
 var presentation = Core_State_Get("editor", ["lessons", "presentation"]);
 
 Presentation_Slide_Next(presentation, true);
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                             T E S T                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



async function Editor_Lesson_DisplayTest()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 Core_State_Set("editor", ["lessons", "components-tab"], "test");
 

 var test    = Core_State_Get("editor", ["lessons", "test"]);
 if(!test)
 {
  var path = Core_State_Get("editor", ["lessons", "source"]);
  var test = await Test_Load(path + "/test");
  Core_State_Set("editor", ["lessons", "test"], test);	 
 }
 
 
 var display = UI_Element_Create("editor/lesson-test");
  
 var container       = UI_Element_Find(submodule, "components-content");
 container.innerHTML = "";
 container.appendChild(display); 
 
 Test_Assign(test, UI_Element_Find(display, "lesson-test")); 
 Test_Display(test);
}



async function Editor_Lesson_EditTest()
{
 await Editor_Lesson_EditComponent("test");
}




function Editor_Lesson_TestPrev()
{
 var test = Core_State_Get("editor", ["lessons", "test"]);
 
 Test_Sheet_Prev(test, true);
}




function Editor_Lesson_TestNext()
{
 var test = Core_State_Get("editor", ["lessons", "test"]);
 
 Test_Sheet_Next(test, true);
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                            C O V E R                                           //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Editor_Lesson_DisplayCover()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 Core_State_Set("editor", ["lessons", "components-tab"], "cover");
 
 var path    = Core_State_Get("editor", ["lessons", "source"])
 var display = UI_Element_Create("editor/lesson-cover");
  
 var container       = UI_Element_Find(submodule, "components-content");
 container.innerHTML = "";
 container.appendChild(display); 
 
 var source  = path + "/cover.png";
 Document_Image_Load(display, [source, ""], true); 
 
 display.onclick = Editor_Lesson_UploadCover;
}




async function Editor_Lesson_UploadCover(event)
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 var files = await Storage_File_Select({accept:".png"}) || [];
 if(files.length == 0) return;
 
 var id   = Core_State_Get("editor", ["lessons", "selected-lesson"]);
 var path = "content/lessons/" + id + "/cover.png";
 await Storage_Files_Upload(files, "api.php?direct&f=Storage_File_Upload&dest=" + path, {});
 
 UI_Element_Find(submodule, "lesson-cover").src = path + "?c=" + Date.now();
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      D O C U M E N T S                                         //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Editor_Lesson_DisplayDocuments()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 Core_State_Set("editor", ["lessons", "components-tab"], "documents");
 
 var path         = Core_State_Get("editor", ["lessons", "source"])
 var display      = UI_Element_Create("editor/lesson-documents");
 
 var id           = Core_State_Get("editor", ["lessons", "selected-lesson"]);
 var documents    = Core_State_Get("editor", ["documents", "index"]);
 
 if(!documents)
 {
  var documents = await Core_Api("Lesson_Files", {source:id, folder:"documents"});
  Core_State_Set("editor", ["documents", "index"], documents); 
 }
 
 var select       = UI_Element_Find(display, "documents-list");
 select.innerHTML = "";
 
 Document_Select_AddOption(select, "", "");
 for(var document of documents)
 {
  Document_Select_AddOption(select, document, document);
 }
  
 select.onchange = Editor_Lesson_PreviewDocument;
  
 
 var container       = UI_Element_Find(submodule, "components-content");
 container.innerHTML = "";
 container.appendChild(display); 
}





async function Editor_Lesson_UploadDocuments(event)
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 var files = await Storage_File_Select({accept:".pdf"}) || [];
 if(files.length == 0) return;
 
 var file = files[0];
 var name = file["name"];
 
 var id   = Core_State_Get("editor", ["lessons", "selected-lesson"]);
 var path = "content/lessons/" + id + "/documents/";
 var dest = path + "/" + name;
 
 await Storage_Files_Upload(files, "api.php?direct&f=Storage_File_Upload&dest=" + dest, {});
 
 // UPDATE INDEX IN MEMORY
 var documents = await Core_Api("Lesson_Files", {source:id, folder:"documents"});
 Core_State_Set("editor", ["documents",  "index"], documents); 
 
 // UPDATE EDITOR SOURCES
 var editor = Core_State_Get("editor", ["lesson", "editor"]);
 Editor_Sources_Update(editor, {documents});
 
 Editor_Lesson_DisplayDocuments();
 
 
 
 // AUTOCREATE DOCUMENT IN LESSON
 var data   = Document_Element_GetObject(editor, "data");
 var config = Document_Element_GetObject(editor, "config");
 
 var section = Data_Section_Add(data, config, "document NN");
 var doc     = section["data"];
 var id      = section["id"];  console.log(id);
 
 doc["file"] = name;
 doc["en"]   = Path_RemoveExtension(name); 
  
 editor = Editor_Data_Refresh(editor);
 Core_State_Set("editor", ["lesson", "editor"], editor);
 
 var section = Editor_Data_FindSection(editor, id);
 section.scrollIntoView({behavior: "smooth", block: "end"});

 // SAVE 
 Editor_Lesson_Save(editor);
}





function Editor_Lesson_PreviewDocument(event)
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 var select = UI_Element_Find(submodule, "documents-list");
 var option = Document_Select_SelectedOption(select);
 
 var id   = Core_State_Get("editor", ["lessons", "selected-lesson"]);
 var path = "content/lessons/" + id + "/documents";
 
 var container = UI_Element_Find(submodule, "document-preview");
 container.src = "content/lessons/" + id + "/documents/" + option.value;
}









// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      D I A L O G U E                                           //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



async function Editor_Lesson_DisplayDialogue(event)
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 var lesson = Core_State_Get("editor", ["lessons", "selected-lesson"]);
 var source = "content/lessons/" + lesson + "/dialogue";
 
 var dialogue = await Dialogue_Read(source);
 var display  = await Dialogue_Display(dialogue);
 
 var frame    = UI_Element_Create("editor/lesson-dialogue");
 frame.appendChild(display);

 var container       = UI_Element_Find(submodule, "components-content");
 container.innerHTML = "";
 container.appendChild(frame);
}



async function Editor_Lesson_EditDialogue(event)
{
 await Editor_Lesson_EditComponent("dialogue");
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      B O O K   P A G E                                         //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Editor_Lesson_DisplayBookpage(event)
{
 // READ EXTRAS
 var editor     = Core_State_Get("editor", ["lesson", "editor"]);
 var lesson     = Document_Element_GetObject(editor, "data");

 var source     = Core_State_Get("editor", ["lessons", "selected-lesson"]);
 
 var page       = await Lesson_Bookpage_Render(source);
 

 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
  
  
 // RENDER PAGE
 var container       = UI_Element_Find(submodule, "components-content");
 container.innerHTML = "";
 container.appendChild(page);
 
 Document_Element_FitContent(page);
 Bookpage_Adjust(page);
}







async function Editor_Lesson_EditBookpage(event)
{
 await Editor_Lesson_EditComponent("bookpage");
}


async function Editor_Lesson_PreviewBookpage(event)
{
 var lesson_id = Core_State_Get("editor", ["lessons", "selected-lesson"]);
 window.open("?framework=null&module=bookpage&lesson=" + lesson_id, "_", "popup, width="+ screen.width + ", height=" + screen.height + ", fullscreen=yes");
}
