// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                    V O C A B U L A R Y                                         //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



async function Editor_Vocabulary()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 // TERMS LIST
 var list = UI_Element_Find(submodule, "terms-list");
 list.onclick = Editor_Vocabulary_Select;
 
 
 // ICONS
 UI_Element_Find(submodule, "vocab-new").onclick    = Editor_Vocabulary_New;
 UI_Element_Find(submodule, "vocab-delete").onclick = Editor_Vocabulary_Delete;
 UI_Element_Find(submodule, "vocab-find").onclick   = Editor_Vocabulary_Find;
 

 // PICTURE UPLOAD
 UI_Element_Find(submodule, "term-picture").onclick = Editor_Vocabulary_UploadPicture;

 // AUDIO UPLOAD
 UI_Element_Find(submodule, "term-audio-upload").onclick = Editor_Vocabulary_UploadAudio;
 
 // AUDIO PLAYBACK
 UI_Element_Find(submodule, "term-audio-listen").onclick = Editor_Vocabulary_PlayAudio;


 // DISPLAY VOCABULARY TERMS
 await Editor_Vocabulary_List();
 
 
 // READ WIP
 var wip = await Core_Api("User_Config_Read", {file:"editor", section:"wip", field:"vocabulary"});
 if(wip)
 {
  var list = UI_Element_Find(submodule, "terms-list");
  Document_Select_SelectByValue(list, wip);
 
  Editor_Vocabulary_Select();
 }
}



async function Editor_Vocabulary_List()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
	
	
 // STORE LIST FOR LATER USE
 var terms = await Resources_Vocabulary(false, "list");
 
 // DISPLAY
 var list       = UI_Element_Find(submodule, "terms-list");
 list.innerHTML = "";
 for(var term of terms)
 {
  Document_Select_AddOption(list, term, term);
 }
}




async function Editor_Vocabulary_Select(event)
{ 
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 var container = UI_Element_Find(submodule, "term-edit");
 var list      = UI_Element_Find(submodule, "terms-list");
 
 Document_Element_Disable(container, "style-disabled");
 Document_Element_Disable(list,      "style-disabled");
 
 
 
 if(list.selectedIndex == -1) return;
 
 var option = list.options[list.selectedIndex];
 var id     = option.value;
 var path   = "content/vocabulary/" + id;
 
 Core_State_Set("editor", ["vocabulary", "selected-term"], id);
  
 var data     = await Core_Api("Vocabulary_Read_Term", {source:"content/vocabulary/" + id});
 var config   = Core_Data_Page("vocabulary/template");
 var template = Data_Page_FromConfig(config);
 var term     = Data_Page_Complete(data, template);
 
 
  
 // DISPLAY DATA
 Editor_Data(container, term, config, {}, Editor_Vocabulary_Save);
 
 // DISPLAY PICTURE
 UI_Element_Find(submodule, "term-picture").src = path + "/picture.png" + "?c=" + Date.now();
  
 UI_Element_Find(submodule, "term-panel-edit").style.visibility    = "visible";
 UI_Element_Find(submodule, "term-media-preview").style.visibility = "visible";
 
 // STORE AS LAST TERM EDITED
 await Core_Api("User_Config_WriteValue", {file:"editor", section:"wip", field:"vocabulary", value:id});
 
 Document_Element_Restore(list);
 Document_Element_Restore(container);
}




async function Editor_Vocabulary_Unselect()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 var list           = UI_Element_Find(submodule, "terms-list");
 list.selectedIndex = -1;

 UI_Element_Find(submodule, "term-panel-edit").style.visibility    = "hidden";
 UI_Element_Find(submodule, "term-media-preview").style.visibility = "hidden";
 
 UI_Element_Find(submodule, "term-edit").innerHTML = "";
}




async function Editor_Vocabulary_New()
{
 var title       = UI_Language_String("editor/vocabulary", "popup new title");
 var placeholder = UI_Language_String("editor/vocabulary", "popup new placeholder");
 var id          = await UI_Popup_Input(title, undefined, undefined, placeholder);
 if(!id) return;
 
 
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 var path   = "content/vocabulary/" + id;
 
 var config = Core_Data_Page("vocabulary/template");
 var data   = Data_Page_FromConfig(config);
 
 // AUTOSET MAIN LANGUAGE FIELD
 Safe_Set(data, ["main", "en"], id);

 await Core_Api("Vocabulary_Write_Term", {path:path, data:data});
 await Resources_Vocabulary(true);
 
 var list   = UI_Element_Find(submodule, "terms-list");
 var option = Document_Select_AddOption(list, id, id); 
 Document_Select_Sort(list);
 
 // AUTOSELECT
 option.scrollIntoView({behavior: "smooth", block: "center"});
 option.selected = true; 
 list.dispatchEvent(new Event("click"));
}




async function Editor_Vocabulary_Delete()
{
 var id   = Core_State_Get("editor", ["vocabulary", "selected-term"]);
  
 var title    = UI_Language_String("editor/vocabulary", "popup delete title");
 var subtitle = UI_Language_String("editor/vocabulary", "popup delete subtitle", {id});
 var confirm  = await UI_Popup_Code(title, subtitle, undefined, id);
 if(!confirm) return;
 
 
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();

 var path = "content/vocabulary/" + id;
 
 Editor_Vocabulary_Unselect();

 await Core_Api("Vocabulary_Delete", {path:path});
 await Resources_Vocabulary(true);
 
 var list = UI_Element_Find(submodule, "terms-list"); 
 var option = Document_Select_OptionByValue(list, id);
 if(option) option.remove();
}


async function Editor_Vocabulary_Find()
{
 
}




async function Editor_Vocabulary_Save(editor)
{
 Document_Element_Disable(UI_Element_Find("terms-list")); 
 Core_State_Set("editor", "saving", true);
 
 
 if(!User_Can("modify-content")) return;
 
 
 var data = Document_Element_GetObject(editor, "data", {});
 
 var id   = Core_State_Get("editor", ["vocabulary", "selected-term"]);
 var path = "content/vocabulary/" + id;
 
 await Core_Api("Vocabulary_Write_Term", {path:path, data:data});
 
 Core_State_Set("editor", "saving", false);
 Document_Element_Restore(UI_Element_Find("terms-list")); 
}



async function Editor_Vocabulary_UploadPicture(event)
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 var files = await Storage_File_Select({accept:".png"}) || [];
 if(files.length == 0) return;
 
 var id   = Core_State_Get("editor", ["vocabulary", "selected-term"]);
 var path = "content/vocabulary/" + id + "/picture.png";
 await Storage_Files_Upload(files, "api.php?direct&f=Storage_File_Upload&dest=" + path, {});
 
 UI_Element_Find(submodule, "term-picture").src = path + "?c=" + Date.now();
}



async function Editor_Vocabulary_UploadAudio(event)
{
 var files = await Storage_File_Select({accept:".mp3"}) || [];
 if(files.length == 0) return;
 
 var id   = Core_State_Get("editor", ["vocabulary", "selected-term"]);
 var path = "content/vocabulary/" + id + "/audio.mp3";
 await Storage_Files_Upload(files, "api.php?direct&f=Storage_File_Upload&dest=" + path, {});
}



async function Editor_Vocabulary_PlayAudio(event)
{
 var id   = Core_State_Get("editor", ["vocabulary", "selected-term"]);
 var path = "content/vocabulary/" + id + "/audio.mp3";
 
 Media_Audio_Play(path);
}
