// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         U S E R S                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function User_Folder(id)
{
 var folder = id;
 
 return folder;
}



function User_Role()
{
 return Safe_Get(application, ["user", "role"], "none");
}



function User_Center()
{
 return Safe_Get(application, ["user", "center"], "none");
}




function User_Settings_Get(section, field, def)
{
 return Safe_Get(application, ["user", "settings", section, field], def);
}



async function User_Settings_Set(section, field, value)
{
 Safe_Set(application, ["user", "settings", section, field], value);
 
 await Core_Api("User_Config_WriteValue", {file:"settings", section, field, value});
}





async function User_Read(current, options = {settings:true, permissions:true})
{
 var user = Safe_Get(application, ["user"], {});
 
 if(!current)
 {
  var data = await Core_Api("User_Read", {options});
  Object.assign(user, data);
 }
 
 return user;
}




function User_Id()
{
 var id = Safe_Get(application, ["user", "id"]);
 
 return id;
}




function User_Can(what, def = "no")
{
 var role  = User_Role();
 
 var value = Core_Config(["roles", role, "can-" + what], def);
 
 // EXPLICIT RETURN OF CAN STRING
 if(def == "what")
 {
  var can = value;
 }
 else
 // RETURN BOOLEAN EVALUATION
 {
  var can = (value == "yes");
 }
 
 return can;
}




function User_Config(what, def = false)
{
 var role  = User_Role();
 
 var value = Core_Config(["roles", User_Role(), what], def);
 
 return value;
}



function User_Role_Config(role, what, def = false)
{ 
 var value = Core_Config(["roles", User_Role(), what], def);
 
 return value;
}







async function User_View_Popup(id, options = {})
{
 var user  = await Core_Api("User_Read", {user_id:id, options:{fields:"id,firstname,lastname,role,center,mobile,email"}});
 var popup = await UI_Popup_Create({}, [], "users/popup-view", {open:false, escape:true});
 
 User_Picture_Load(UI_Element_Find(popup, "propic"), user);
 
 UI_Element_Find(popup, "name").innerHTML = user["firstname"] + " " + user["lastname"];
 UI_Element_Find(popup, "id").innerHTML   = id;

 UI_Element_Find(popup, "data-role").innerHTML   = UI_Language_Object(Core_Config(["roles", user["role"] || ""], {}), "");
 UI_Element_Find(popup, "data-center").innerHTML = Centers_Name(user["center"] || "");
 UI_Element_Find(popup, "data-mobile").innerHTML = user["mobile"] || "";
 UI_Element_Find(popup, "data-email").innerHTML  = user["email"]  || "";

 await UI_Popup_Show(popup);
}




function User_Card(user, template = "standard", more = false)
{
 var card = UI_Element_Create("users/card-" + template);
 
 // PICTURE
 var element = UI_Element_Find(card, "picture");
 if(user["id"])
 {
  User_Picture_Load(element, user);
 }
 else
 {
  element.style.visibility = "hidden";
 }
 
 // NAME
 for(var field of ["firstname", "lastname"])
 {
  var element = UI_Element_Find(card, field);
  
  if(element)
  {
   element.innerHTML = user[field] || "";
  }
 }
 
 // MORE
 if(more)
 {
  var element = UI_Element_Find(card, "more");
  element.style.display = "flex";
  element.appendChild(more);
 }
 
 Document_Element_SetObject(card, "user", user);
 
 return card;
}




async function Users_Popup_SelectFromList(users = [], fields = {firstname:true, lastname:true}, language, title = false)
{
 var promise = new Promise((resolve, reject) =>
 {
  var title   = title || UI_Language_String("users/popups", "select list title");
  var text    = UI_Language_String("users/popups", "select list button");
  
  var content = UI_Element_Create("users/popup-select-box");
  var table   = UI_Table_Data(users, fields, language)
  content.appendChild(table);
 
  var onclick = 
  function(popup)
  {
   UI_Popup_Close(popup);
   
   var row = Document_Element_GetObject(table, "selected-row");
   if(row)
   {
	var user = Document_Element_GetObject(row, "item");
   }
   else
   {
	var user = false;
   }
   
   resolve(user);
  }

  var onescape =
  function()
  {
   resolve(false);
  }
 
  UI_Popup_Create({title, content}, [{text, onclick}], "flexi", {escape:true, open:true, onescape});  
 });
 
 return promise;
}




async function Users_Popup_SelectFromSearch(centers = [], roles = [], fields = "firstname,lastname", count = 100, order = "id")
{
 var promise = new Promise((resolve, reject) =>
 {
  var title   = UI_Language_String("users/popups", "select list title");
  var text    = UI_Language_String("users/popups", "select list button");
  
  var content = UI_Element_Create("users/popup-select-search", {}, {language:"users/popups"});
  var table   = false;
  
  // DEBOUNCEABLE SEARCH FUNCTION
  var update_timeout = false;
  function update()
  {
   if(update_timeout) clearTimeout(update_timeout);
   
   update_timeout = setTimeout(
   async function()
   {
	var search =
	{
     centers,
	 roles,
	 fields,
	 count,
	 order
	}
	
	// GET OTHER SEARCH VALUES FROM THE POPUP
	for(var field of ["lastname", "firstname", "email", "mobile", "id"]) search[field] = UI_Element_Find(content, field).value;	

    var users       = await Core_Api("Users_Search", {search});
	
	var tablefields = {id:true};
	for(var field of fields.split(",")) tablefields[field] = true;
	table     = UI_Table_Data(users, tablefields, "users/table-fields")
	
    var display = UI_Element_Find(content, "users");
	display.innerHTML = "";
	display.appendChild(table);
  
	update_timeout = false;
   }, 1000);
  }
  
 
  // FIELDS
  for(var field of ["lastname", "firstname", "email", "mobile", "id"])
  {
   var element  = UI_Element_Find(content, field);
    
   element.onkeypress  = update;
   element.onblur      = update;
  }
 
  
  var onclick = 
  function(popup)
  {
   UI_Popup_Close(popup);
   
   var row = Document_Element_GetObject(table, "selected-row");
   if(row)
   {
	var user = Document_Element_GetObject(row, "item");
   }
   else
   {
	var user = false;
   }
   
   resolve(user);
  }


  var onescape =
  function()
  {
   resolve(false);
  }
 
  UI_Popup_Create({title, content}, [{text, onclick}], "flexi", {escape:true, open:true, onescape});  
 });
 
 return promise;
}





async function User_Picture_Load(picture, user, role = "generic", hide = false)
{
 if(typeof user == "object") var id = user["id"]; else var id = user;
 
 var role = user["role"] || role || "generic";
 
 if(hide) picture.style.visibility = "hidden";
 
 var image    = Resources_URL("propic.jpg", "user", id);
 var fallback = Resources_URL("images/default/propic-" + role + ".png"); 
 var generic  = Resources_URL("images/default/propic-generic.png"); 
 
 var result   = await Document_Image_Load(picture, [image, fallback, generic], {nocache:true});
 
 if(hide && result != "hide") picture.style.visibility = "visible";
}





async function User_Picture_Upload(user_id, options)
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
 
 
 // READ DATA ONLY AND STORE
 if(!user_id) var user_id = User_Id();
 
 var data = await Storage_File_Read(blob, {whole:false}); 
 Storage_File_Upload("propic.jpg", data, "image/jpg", "api.php?direct&f=User_Files_Upload&id=" + user_id + "", {});
 
 // READ AS A WHOLE INCLUDING BASE64 HEADER, AND DISPLAY ON BIG PICTURE AND PROPIC IN THE MENU BAR
 var picture = await Storage_File_Read(blob, {whole:true});  
 
 if(options["update"]) 
 {
  var elements = options["update"] || [];
  
  for(var element of elements)
  {
   if(options["animate"]) Document_Element_Animate(element, "rubberBand 0.5s linear 1");
   
   element.src = picture;
  }
 }

}