// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       P R O F I L E                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Profile_OnLoad(module, data)
{
 var user     = await Core_User();

  
 var picture = UI_Element_Find(module, "profile-picture");	
 User_Picture_Load(picture, user);
 picture.onclick = Profile_Picture_Upload;
 
 var container = UI_Element_Find(module, "profile-settings");
 
 
 var languages = Partner_Data("localization", "languages").split(",");
 var options   = {};
 for(var language of languages) options[language] = UI_Language_String("core/languages", language, {}, language); // DISPLAY EACH LANGUAGE NAME IN ITS NATIVE NAME
 var panel     = Profile_Preferences_Panel("language", options, 
 async function()
 {
  Profile_Preferences_ApplyLanguage();
  
  await Core_Reload();
  Module_Load("profile");
 })
 
 UI_Element_Find(panel, "options").value = User_Settings_Get("preferences", "language") || "en";
 
 container.appendChild(panel); 


 var panel     = Profile_Preferences_Panel("size", false, Profile_Preferences_ApplySize);
 container.appendChild(panel);


 var panel     = Profile_Preferences_Panel("sound");
 container.appendChild(panel); 
 
 
 var panel     = Profile_Preferences_Panel("music");
 container.appendChild(panel);  
 
 
 var text      = UI_Language_String("profile/settings", "password change text");
 var action    = UI_Language_String("profile/settings", "password change action");
 var panel     = UI_Element_Create("profile/settings-action", {text, action});
 panel.onclick = Profile_Password_Change;
 container.appendChild(panel); 
 
 
 var text      = UI_Language_String("profile/settings", "account logout text");
 var action    = UI_Language_String("profile/settings", "account logout action");
 var panel     = UI_Element_Create("profile/settings-action", {text, action});
 panel.onclick = Profile_Account_Logout;
 container.appendChild(panel); 
 
 
 // ABOUT ME
 var element      = UI_Element_Find(module, "profile-about");
 Document_Element_SetData(element, "field", "about");
 element.value    = Safe_Get(user, ["about"]) || "";
 element.onchange = Profile_User_Set; 
 
 
 // ANIMATE ELEMENTS
 var container = UI_Element_Find(module, "profile-settings");
 for(var element of container.children) element.style.visibility = "hidden";
 
 Document_Element_AnimateChildren(container, "slideInRight 0.250s ease-in-out", 
 {
  delay:    125, 
  interval: 125, 
  onstart:
  function(element) 
  {
   element.style.visibility = "visible";
  }
 });

 
 var container = UI_Element_Find(module, "profile-user");
 for(var element of container.children) element.style.visibility = "hidden";
 
 Document_Element_AnimateChildren(container, "zoomIn 0.250s ease-in-out", 
 {
  delay:    125, 
  interval: 125, 
  onstart:
  function(element) 
  {
   element.style.visibility = "visible";
  }
 });
}



async function Profile_OnShow(module, data)
{
}




async function Profile_OnUnload()
{
}








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          M O R E                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Profile_Preferences_Panel(preference, options, onchange)
{
 var text      = UI_Language_String("profile/settings", "preferences " + preference + " text");
 var panel     = UI_Element_Create("profile/settings-options", {text});
 
 var select   = UI_Element_Find(panel, "options");
 Document_Element_SetData(select, "preference", preference);
 
 if(options)
 {
  for(var value in options) Document_Select_AddOption(select, options[value], value);
 }
 else
 {
  UI_Select_FromDatapage(select, "profile/settings-" + preference);
  select.value = User_Settings_Get("preferences", preference);
 }
 
 select.onchange = 
 async function(event)
 {
  await Profile_Preferences_Set(event);
  
  if(onchange) onchange();
 }
 
 return panel;
}




async function Profile_Account_Logout()
{
 var title    = UI_Language_String("profile", "logout popup title"); 
 var content  = UI_Language_String("profile", "logout popup text"); 
 var picture  = Resources_URL("images/cover-logout.png");

 var confirm  = await UI_Popup_Confirm(title, content, picture);
 if(!confirm) return;
 
 await Core_Logout();
 
 Module_Load("login", document.body);
}





async function Profile_Picture_Upload()
{
 var files = await Storage_File_Select({accept:".jpg"});
 var file  = files[0];
 
 var data = await Storage_File_Read(file, {whole:true});
 
 var blob = await Document_Image_Resize(data, 
 {
  constraints:
  {
   width:  400, 
   height: 400
  }, 
  
  format:"image/jpg", 
  
  quality:0.5
 });
 
 //var user_id = 1;
 //var dest    = Resources_URL("propic.jpg", "user", user_id); 
 
 // READ DATA ONLY AND STORE
 var data = await Storage_File_Read(blob, {whole:false}); 
 Storage_File_Upload("propic.jpg", data, "image/jpg", "api.php?direct&f=User_Files_Upload", {});
 
 // READ AS A WHOLE INCLUDING BASE64 HEADER, AND DISPLAY ON BIG PICTURE AND PROPIC IN THE MENU BAR
 var picture = await Storage_File_Read(blob, {whole:true});  
 
 var element = UI_Element_Find("user-propic");
 Document_Element_Animate(element, "rubberBand 0.5s linear 1");
 element.src = picture;
 
 var element = UI_Element_Find("profile-picture");
 Document_Element_Animate(element, "rubberBand 0.5s linear 1");
 element.src = picture;
}






async function Profile_Password_Change(event)
{
 var popup    = false;
 
 var picture  = Resources_URL("images/cover-password.png");
 var title    = UI_Language_String("profile", "password change title");
 var button   = UI_Language_String("profile", "password change button");
 var subtitle = false;
 
 var text        = {};
 text["current"] = UI_Language_String("profile", "password change current");
 text["new"]     = UI_Language_String("profile", "password change new");
 text["repeat"]  = UI_Language_String("profile", "password change repeat");
 var content     = UI_Element_Create("profile/password-change", text); 
 
 var change   =
 async function()
 {  
  var current = UI_Element_Find(content, "current");
  var newpass = UI_Element_Find(content, "new");
  var repeat  = UI_Element_Find(content, "repeat");
  var setpass = newpass.value.trim();
  
  // NEW PASS NOT REPEATED CORRECTLY?
  if(newpass.value != repeat.value)
  {
   repeat.value = UI_Language_String("profile", "password change different");  
   Document_Element_Animate(repeat,  "headShake 0.75s ease-in-out 1");
   
   await Client_Wait(2);
   repeat.value = "";
   
   return;
  }
  
  
  // MINIMUM LENGTH NOT RESPECTED?
  var minlength = 5;
  if(setpass.length < minlength)
  {
   newpass.value = UI_Language_String("profile", "password change tooshort", {n:minlength});  
   Document_Element_Animate(newpass, "headShake 0.75s ease-in-out 1");
   
   await Client_Wait(2);
   newpass.value = setpass;
   
   return;
  }
  

  // TRY CHANGING
  var result = await Core_Api("User_ChangePassword", {old:current.value, new:setpass});
  
  if(result == "ok")
  {
   UI_Popup_Close(popup);
  }
  else
  {  
   current.value = UI_Language_String("profile", "password change wrong", {length:minlength});  
   Document_Element_Animate(current, "headShake 0.75s ease-in-out 1");
   
   await Client_Wait(2);
   current.value = "";
   
   return;
  }
 }
 
 popup = await UI_Popup_Create({title, subtitle, picture, content}, [{text:button, onclick:change}], undefined, {escape:true, open:true});  
}




async function Profile_Preferences_Set(event)
{
 var element = event.currentTarget;
 var field   = Document_Element_GetData(element, "preference");
 var value   = element.value;
 
 await User_Settings_Set("preferences", field, value);
}



async function Profile_User_Set(event)
{
 var element = event.currentTarget;
 var field   = Document_Element_GetData(element, "field");
 var value   = element.value;
  
 await Core_Api("User_Update_Field", {field, value});
}





function Profile_Preferences_ApplySize()
{
 var size = User_Settings_Get("preferences", "size");
 
 var zoom = Core_Data_Value("profile/settings-size", size, "zoom");
 
 document.body.style.zoom = zoom;
}




function Profile_Preferences_ApplyLanguage()
{
 var language = User_Settings_Get("preferences", "language") || "en";
 
 UI_Language_Set(language);
}