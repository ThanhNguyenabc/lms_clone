// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     M O D U L E S                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Module_Load(module, container, configuration = {})
{
 var namespace = String_Capitalize_Initial(module);
 console.log("Loading Module " + module); 
 
 
 // UNLOAD PREVIOUS MODULE   
 await Module_Unload();
 
 // SET SELECTED MODULE
 Safe_Set(application, ["state", "core", "module"], module);
 
 // INIT MODULE STATE IF NEVER LOADED BEFORE
 var state = Core_State_Get(module);
 if(!state) Safe_Set(application, ["state", module], {}, true);
 
 // RESET MODULE STATE IF NOT SET TO PERSIST
 /*
 var persist = Core_State_Get(module, "persist");
 if(!persist) 
 {
  Safe_Set(application, ["state", module], {}, true);
 }
 */
 
 // INITIALIZE MODULE HTML
 var element = UI_Element_Create(module + "/module");
 Core_State_Set("core", "module-body", element);
 
 
 // EXPLICITLY MULTIPAGE MODULE?
 /*
 var pages  = Module_Data(module, "module", "pages", "");
 pages      = pages.split(",");
 
 if(pages.length > 0)
 {
  // CREATE A HEADER TO ACCESS PAGES
  var items = [];
  
  for(let page of pages)
  {  
   var item        = {};
   item["text"]    = UI_Language_Object(Module_Data(module, "page " + page, undefined, {})) || page;
   item["onclick"] = 
   function()
   {
	Module_Page_Set(page);
   }
   
   items[page]     = item;
  }
  
  var header    = UI_Header("module-page-select", items, {selectfirst:false, css:"color-noted"});  
 
  var selector = UI_Element_Find(element, "module-header");
  if(selector) selector.appendChild(header);
 }
 */
 
 
 // ONLOAD (EVERYTHING BEFORE INJECTING MODULE UI)
 var Module_OnLoad = Safe_Function(namespace + "_OnLoad");
 if(Module_OnLoad) 
 {
  var data = await Core_Api(namespace + "_Load", configuration);
  await Module_OnLoad(element, data);
 }
 
 
 // INJECT MODULE UI AND CALL ONSHOW
 if(!container) var container = document.getElementById("main-module");
 container.innerHTML = "";
 container.appendChild(element);
 
 var Module_OnShow = Safe_Function(namespace + "_OnShow");
 if(Module_OnShow) 
 {
  await Module_OnShow(element, data);
 }
}




async function Module_Unload()
{ 
 var module = Module_Current();
 
 if(module)
 {
  var namespace = String_Capitalize_Initial(module);
 
  var Module_OnUnload = Safe_Function(namespace + "_OnUnload");	
  if(Module_OnUnload) 
  {
   await Module_OnUnload();
  }
 }
 
 Safe_Delete(application, ["state", "core", "module"]);
}





function Module_Current()
{
 var module = Safe_Get(application, ["state", "core", "module"], false);
 
 return module;
}




function Module_Data(module, section, field, def)
{
 var get           = ["data", module + "/module"];
 if(typeof section != "undefined") get.push(section);
 if(typeof field   != "undefined") get.push(field);
 	
 var value = Safe_Get(application, get, def);
 
 return value;
}




function Module_Config(module, field, def)
{
 return Safe_Get(application, ["config", "modules", module, field], def);
}





function Module_Preload_Set(module, parameter, value)
{
 Core_State_Set("modules", ["preload", module, parameter], value);
}





function Module_Parameter_Get(parameter, module)
{
 if(!module) var module = Module_Current();
 
 
 // FIRST CHECK IF PARAMETER SET BY URL
 var value = Client_Location_Parameter(parameter);
 
 
 // THEN CHECK IF SET BY ANOTHER MODULE
 if(!value)
 {
  var value = Core_State_Get("modules", ["preload", module, parameter]);
  Core_State_Set("modules", ["preload", module, parameter], undefined);
 }
 
 
 // FINALLY CHECK IF ALREADY PREVIOUSLY SET/STORED 
 if(!value)
 {
  var value = Core_State_Get(module, parameter);
 }
 
 
 return value;
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         P A G E S                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function Module_Page_Get()
{
 var module = Module_Current();
 
 // TRY IN ORDER:
 // - HARD SETTING FROM URL PARAMETER IN module-page FORMAT
 // - CURRENT STATE
 // - DEFAULT AS SPECIFIED BY MODULE CONFIGURATION DATA
 // - USER GIVEN DEFAULT
 var page = Client_Location_Parameter("page") || Core_State_Get(module, ["page"]) || Module_Data(module, "module", "default-page") || "main";
 
 return page;
}





async function Module_Page_Set(page)
{
 var module = Module_Current();
 
 // IF NO PAGE IS GIVEN, TRY A DEFAULT
 if(!page) var page = Module_Page_Get();
 
 console.log("Module Page: ", page);
 
 // STORE STATE
 Core_State_Set(module, ["page"], page); 
 
 // IDENTIFY AND CALL (IF AVAILABLE) PAGE INITIALIZATION FUNCTION
 var page_function = String_Capitalize_Initial(module) + "_" + String_Capitalize_Initial(page);
 var page_function = window[page_function];
 if(page_function) 
 {  
  var body = Core_State_Get("core", "module-body");
  
  // LOAD PAGE HTML
  var submodule = UI_Element_Create(module + "/" + page, {}, {language:module + "/" + page});
  var container = UI_Element_Find(body, "module-page");
  
  Core_State_Set(module, "submodule", submodule);
  await page_function(submodule);
  
  container.innerHTML = "";
  container.appendChild(submodule);
 }
 
}




function Module_Page_Body()
{
 var module = Module_Current();
 
 return Core_State_Get(module, "submodule");	
}