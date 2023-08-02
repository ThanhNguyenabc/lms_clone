// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     D I A L O G U E                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Editor_Dialogue()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 
 // SET BY ANOTHER MODULE? 
 if(!source)
 {
  var source = Core_State_Get("editor", ["edit-dialogue"], false);
  if(source)
  {
   // UNSET
   Core_State_Set("editor", ["edit-dialogue"], false);
  }
 }
 
 // JUST SET IT TO THE USER'S TEMP FOLDER
 if(!source)
 {
  var user_id = Safe_Get(application, ["user", "id"]); 
  var source  = Resources_URL("temp/editor/dialogue", "user", user_id);
 }

 Core_State_Set("editor", ["current-source"], source);
 
 // READ WIP DIALOGUE 
 var dialogue = await Dialogue_Read(source);
   
 // SET AS CURRENTLY EDITED
 Core_State_Set("editor", ["dialogue", "dialogue"], dialogue);
 
 // STORE AS LAST DIALOGUE EDITED
 Core_Api("User_Config_WriteValue", {file:"editor", section:"wip", field:"dialogue", value:source});


 // SET UP UI


 // IF NOT LOADED PREVIOUSLY, LOAD AVAILABLE CHARACTERS LIST
 var characters = Core_State_Get("editor", ["characters"]);
 if(!characters)
 {
  var characters = [];
 
  var list = await Core_Api("Characters_List"); 
  for(var id in list)
  {
   var name = list[id];
   characters.push({id, name});
  }

  Core_State_Set("editor", ["characters"],      characters);
 }
 
 
 // EXPORT
 UI_Element_Find(submodule, "dialogue-export").onclick = Editor_Dialogue_Export;
 
 // HEADER EDITOR
 var container = UI_Element_Find(submodule, "dialogue-header");
 var info      = Safe_Get(dialogue, "info", {}) || {};
 var config    = Core_Data_Page("dialogue/template");
 var template  = Data_Page_FromConfig(config);
 var header    = Data_Page_Complete(info, template);
 
 Data_Page_Sanitize(header, config);

 var editor    = Editor_Data(container, header, config, {characters}, Editor_Dialogue_Save);
 Core_State_Set("editor", ["dialogue", "editor"], editor);
 
 
 // SCRIPT EDITOR
 var container       = UI_Element_Find(submodule, "dialogue-script");
 
 var page            = UI_Element_Create("editor/dialogue-script");
 Core_State_Set("editor", ["dialogue", "script"], page);
 
 var languages       = Partner_Languages();
 var ids             = Object.keys(languages);
 var items           = {};
 for(var id of ids)
 {
  var item        = {};
  item["text"]    = UI_Language_Object(languages[id]).toUpperCase();
  item["onclick"] = Editor_Dialogue_SwitchLanguage;
  
  items[id] = item;
 }
 
 var header = UI_Header("languages", items, {selectfirst:true, css:"color-noted"});
 UI_Element_Find(submodule, "dialogue-language").appendChild(header);

 
 container.innerHTML = "";
 container.appendChild(page); 
}




function Editor_Dialogue_SelectCharacters(select, characters)
{
 Document_Select_Clear(select);
 Document_Select_AddOption(select, "", "");
  
 for(var character of characters)
 {
  Document_Select_AddOption(select, character["name"], character["id"]);
 }
}




function Editor_Dialogue_SwitchLanguage(item)
{ 
 var language = Safe_Get(item, ["id"], "en");
 
 var dialogue = Core_State_Get("editor", ["dialogue", "dialogue"]);
 var page     = Core_State_Get("editor", ["dialogue", "script"]);
 
 Editor_Dialogue_DisplayScript(dialogue, page, language);
}





function Editor_Dialogue_UsedCharacters()
{
 var editor     = Core_State_Get("editor", ["dialogue", "editor"]);
 var data       = Document_Element_GetObject(editor, "data", {});
 var characters = Core_State_Get("editor", ["characters"]);
 
 // FILTER ONLY CHARACTERS THAT ARE ACTUALLY USED HERE
 var options = []; 
 var used    = Safe_Get(data, "characters", {});
 for(var i in used)
 {
  var id = used[i];
  
  for(var character of characters) if(character["id"] == id)
  {	  
   options.push(character);
   break;
  }   
 }
 
 return options;
}




function Editor_Dialogue_UpdateScript()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
 // GET USED CHARACTERS
 var characters   = Editor_Dialogue_UsedCharacters(); 

 // UPDATE
 var container = UI_Element_Find(submodule, "dialogue-script");
 var elements  = Document_Element_FindChildren(container, "uid", "character", ["recurse"]);
 for(var select of elements)
 {
  var value    = select.value;
  
  Editor_Dialogue_SelectCharacters(select, characters);
  
  select.value = value;
 }
}




async function Editor_Dialogue_UpdateLine(event)
{
 var element       = event.currentTarget;
 var element       = Document_Element_FindParent(element, "uid", "line");
 
 var data          = Document_Element_GetObject(element, "line");
 var n             = Document_Element_GetData(element, "n");
 var language      = Document_Element_GetData(element, "language");
 
 data["character"] = UI_Element_Find(element, "character").value;
 data[language]    = UI_Element_Find(element, "text").value;
 
 var dialogue      = Core_State_Get("editor", ["dialogue"], []);
 var lines         = dialogue["lines"] || [];
 if(!lines[n])
 {
  lines[n] = data;
 }
  
 var path = Core_State_Get("editor", ["current-source"]);
 await Core_Api("Dialogue_WriteLine", {path, n, data});
}




async function Editor_Dialogue_Save(editor)
{
 Editor_Dialogue_UpdateScript();
 
 var data = Document_Element_GetObject(editor, "data");
 var path = Core_State_Get("editor", ["current-source"]);
 
 // APPARENTLY SOME CONVERSION IS NEEDED
 data = Array_To_Object(data);
 
 await Core_Api("Dialogue_WriteHeader", {path, data});
}




async function Editor_Dialogue_Export()
{
 var path = Core_State_Get("editor", ["current-source"]);
 
 await Core_Api("Dialogue_Export", {path});
 
 var icon = UI_Element_Find("dialogue-export");
 Document_Element_Animate(icon, "flash 1.5s");
}




function Editor_Dialogue_DisplayScript(dialogue, container, language = "en", native = "en")
{ 
 container.innerHTML = "";
 
 // GET USED CHARACTERS
 var characters = Editor_Dialogue_UsedCharacters(); 
 
 var lines = Safe_Get(dialogue, "lines", []) || [];

 for(var n = 0; n<100; n++)
 {
  var line      = lines[n] || {};
  var row       = UI_Element_Create("editor/dialogue-line", {n});
  
  
  // CHARACTER
  var select      = UI_Element_Find(row, "character");
  Editor_Dialogue_SelectCharacters(select, characters);
  select.value    = Safe_Get(line, "character", "");
  select.onchange = Editor_Dialogue_UpdateLine;
    
  // TEXT
  var edit      = UI_Element_Find(row, "text");
  var text      = Safe_Get(line, language, "");
  edit.value    = text;
  edit.onchange = Editor_Dialogue_UpdateLine;
  
  
  // NATIVE
  if(language != native)
  {
   var text         = Safe_Get(line, native, "");
   edit.title       = text;
   edit.setAttribute("placeholder", text);
  }
  
  
  Document_Element_SetObject(row, "line", line);
  Document_Element_SetData(row, "n", n);
  Document_Element_SetData(row, "language", language);
  
  container.appendChild(row);
 }
}