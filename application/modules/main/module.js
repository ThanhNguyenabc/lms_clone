// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          M A I N                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Main_OnLoad(module, data)
{ 
 // TEXTURE
 UI_Element_Find(module, "texture").style.backgroundImage = "url(" + Resources_URL("images/texture.jpg", "partner") + ")";

  
 // USER PROFILE
 var user     = await Core_User();
 var element  = UI_Element_Create("main/menu-item-user", {username:user["firstname"]});
 
 
 // APPLY USER PREFERENCES
 Profile_Preferences_ApplyLanguage();
 Profile_Preferences_ApplySize();
 
 
 
 var icon     = UI_Element_Find(element, "user-propic");
 User_Picture_Load(icon, user);
 
 icon.onclick = Main_Menu_LoadModule;
 Document_Element_SetData(icon, "module", "profile");
 
 UI_Element_Find(module, "main-user").appendChild(element);
 Document_Element_Animate(element, "slideInLeft 1s 1 ease-out");
 
 	
 // BUILD MENU
 var container = UI_Element_Find(module, "main-menu");

 var modules = Safe_Get(application, ["config", "roles", user["role"], "modules"], "");
 var menu    = Array_From_String(modules);
 for(var item of menu)
 {
  // MENU ITEM TEXT
  var text    = UI_Language_String(item, "module");
  let element = UI_Element_Create("main/menu-item-plain", {text:text});
  
  // MENU ITEM ID
  Document_Element_SetData(element, "uid", "menu-" + item);
  
  // MENU ITEM ICON
  var sources = [];
  var icon    = UI_Element_Find(element, "icon");
  var image   = Module_Data(item, "module", "menu-icon");
  sources.push(Resources_URL("images/" + image) + ".png");
  
  Document_Image_Load(icon, sources);
  
  Document_Element_SetData(element, "module", item);
  element.onclick           = Main_Menu_LoadModule;  
  element.style.visibility  = "hidden";
  
  container.appendChild(element);
 }
  
 Document_Element_AnimateChildren(container, "slideInUp 1s 1 ease-out", 
 {
  delay:    0, 
  interval: 175, 
  onstart:
  function(element) 
  {
   element.style.visibility = "visible"
  }
 });
 
}




async function Main_OnShow(module, data)
{
 //Module_Load("home");
 /*
 var container = UI_Element_Find(module, "main-menu");
 container.style.overflow = "auto hidden";
 Document_Element_FitContent(container, 0.1);
 container.style.overflow = "hidden";
 */
}








async function Main_OnUnload()
{
}




// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          M E N U                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Main_Menu_LoadModule(event)
{
 var element = event.currentTarget;
 var module  = Document_Element_GetData(element, "module");
 
 var container = UI_Element_Find("main-menu");
 Document_Conditional_Class(container, "shadow-sharp-bottom",   element);
 // Document_Conditional_Class(container, "style-highlight-light", element);
 
 Module_Load(module);
}