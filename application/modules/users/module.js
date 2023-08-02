// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          U S E R S                                             //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Users_OnLoad(module, data)
{ 
 // CREATE MENU HEADER
 var menus = Core_Data_Page("users/menus");
 var items = {};
 for(var key in menus)
 {
  items[key]            = {};
  items[key]["text"]    = UI_Language_Object(menus[key]);
  items[key]["icons"]   = [];
  items[key]["onclick"] = Safe_Function("Users_" + String_Capitalize_Initial(key), function(){});
 }
 
 var header = UI_Header("users-menu", items, {selectfirst:false, css:"color-noted", template:"standard"});
  
 UI_Element_Find(module, "module-header").appendChild(header);
 
 
 
 // CREATE STAFF SUBMENU
 var items   = {};
 var roles   = User_Config("edit-staff", "").split(",");
 for(var role of roles)
 {
  var item      = [];
  item["icon"]  = "";
  item["text"]  = UI_Language_Object(Core_Config(["roles", role], {}));
  item["state"] = "enabled";
  item["func"]  = Users_Staff_List;
  item["tag"]   = role;

  items[role]   = item;
 }
 var menu = UI_Menu_Create("staff-submenu", items);
 Core_State_Set("users", ["menus", "staff"], menu);
}



async function Users_OnUnload()
{
}



async function Users_OnShow(module, data)
{
}




function Users_ClearDisplay()
{
 var element = UI_Element_Find("user-main");
 element.style.visibility = "hidden";
 element.innerHTML        = "";
 
 var element = UI_Element_Find("user-more");
 element.style.visibility = "hidden";
 element.innerHTML        = "";
}






async function Users_Students()
{
 Users_ClearDisplay();
 
 var operations = 
 {
  message : 
  {
   icon    : "envelope",
   onclick : Users_List_Message
  }
 }
 
 var display   = Database_View_Create("Users_List_ByCenter", Module_Config("users", "page"), {id:true, firstname:true, lastname:true, email:true}, "users/table-fields", Users_User_Select, false, {export_fields:"id,firstname,lastname,email,mobile,center", operations});
 
 var scope = User_Config("operate-on-users");
 switch(scope)
 {
  case "all":
  
	var center = User_Center();
 
	await Database_View_Query(display,
	{
	 center,
	 fields : "id,firstname,lastname",
	 role   : "student",
	 order  : "lastname, firstname",
	}); 
  break;
  
  case "managed":	
	
	var manager = User_Id();
	
	await Database_View_Query(display,
	{		
	 manager,
	 fields : "id,firstname,lastname",
	 role   : "student",
	 order  : "lastname, firstname",
	}); 
  break;
 }
 
 Core_State_Set("users", "list-display", display);

 var container       = UI_Element_Find("list-display");
 container.innerHTML = "";
 container.appendChild(display);
 container.style.visibility = "visible";
}




async function Users_List_Message(display)
{
 // GET ALL DISPLAY STUDENTS IDS
 var users = await Database_View_Data(display, "all", "id");
 var ids   = Array_From_Fields(users, "id");
 
 await Messages_Popup_SendMultiple(ids);
}




async function Users_Staff()
{ 
 var menu     = Core_State_Get("users", ["menus", "staff"]);
 var position = Document_Element_Corner(UI_Element_Find("staff"), "bottom"); 
 
 setTimeout(
 function()
 {
  UI_Menu_Show(menu, position["left"], position["top"] + parseInt(Document_CSS_GetValue("gap-medium", "gap")) * 2, {direction:"bottom"});
 }, 125);
}




async function Users_Staff_List(item)
{  
 Users_ClearDisplay();
 
 var operations = 
 {
  message : 
  {
   icon    : "envelope",
   onclick : Users_List_Message
  }
 }
  
 var display = Database_View_Create("Users_List_ByCenter", Module_Config("users", "page"), {id:true, firstname:true, lastname:true, email:true}, "users/table-fields", Users_User_Select, false, {export_fields:"id,firstname,lastname,email,mobile,center", operations});
 
 var role = Document_Element_GetObject(item, "tag");
 var center = User_Center();
 
 await Database_View_Query(display,
 {
  center,
  role,
  order  : "lastname, firstname",
 }); 
 
 Core_State_Set("users", "list-display", display);

 var container       = UI_Element_Find("list-display");
 container.innerHTML = "";
 container.appendChild(display);
 container.style.visibility = "visible";
}




async function Users_Search()
{
 var centers = [User_Center()];
 
 var user    = await Users_Popup_SelectFromSearch(centers, [], fields = "id,firstname,lastname", count = 100, order = "id");
 if(!user) return;
  
 Users_ClearDisplay();
 
 var table           = UI_Table_Data([user], {id:true, firstname:true, lastname:true}, "users/table-fields", Users_User_Select);
 var container       = UI_Element_Find("list-display");
 container.innerHTML = ""; 
 container.appendChild(table);
 container.style.visibility = "visible";
 
 Users_User_Select(false, user);
}





// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                     F A M I L I E S                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Users_Families()
{
 Users_ClearDisplay();
  
 var display = Database_View_Create("Families_List_ByCenter", Module_Config("families", "page"), {id:true, name:true, type:Core_Data_Page("families/types")}, "families/table-fields", Users_Family_Select);
 
 var center = User_Center();
 
 await Database_View_Query(display,
 {
  center,
  order  : "name",
 }); 
 
 Core_State_Set("families", "list-display", display);

 var container       = UI_Element_Find("list-display");
 container.innerHTML = "";
 container.appendChild(display);
 container.style.visibility = "visible";
}



async function Users_Family_Select(event)
{
 var element = event.currentTarget;
 var family  = Document_Element_GetObject(element, "item");
    
 var display = await Users_Family_DisplayMain(family["id"]);
 var more    = await Users_Family_DisplayMore(family["id"], UI_Element_Find("user-main"));
  
 var container  = UI_Element_Find("user-main");
 container.innerHTML        = "";
 container.appendChild(display);
 container.style.visibility = "visible";
  
 var container  = UI_Element_Find("user-more");
 container.innerHTML        = "";
 container.appendChild(more);
 container.style.visibility = "visible";
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                            U S E R                                             //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Users_User_Select(event, user)
{ 
 if(!user)
 {
  var element = event.currentTarget;
  var user    = Document_Element_GetObject(element, "item");
 }
 
 var display = await Users_User_DisplayMain(user["id"]);
 var more    = await Users_User_DisplayMore(user["id"]);
  
 var container  = UI_Element_Find("user-main");
 container.innerHTML        = "";
 container.appendChild(display);
 container.style.visibility = "visible";
  
 var container  = UI_Element_Find("user-more");
 container.innerHTML        = "";
 container.appendChild(more);
 container.style.visibility = "visible";
}



async function Users_User_DisplayMain(id, options = {})
{
 var data = await Core_Api("User_Read", {user_id:id, options:{family:true, manager:true}});
 console.log(data);
 
 Core_State_Set("users", "user-id", id);
 Core_State_Set("users", "user-data", data);
 
 var display = UI_Element_Create("users/user-main", {}, {language:"users/user-main"});
 
 // DROPDOWN SOURCES
 
 // 1. ROLES
 var element = UI_Element_Find(display, "user-role");
 Document_Select_AddOption(element, "", ""); 
 UI_Select_FromConfig(element, "roles");
 
 // 2. CENTERS
 var element = UI_Element_Find(display, "user-center");
 Document_Select_AddOption(element, "", ""); 
 var centers = Centers_Available();
 for(var center of centers) Document_Select_AddOption(element, center["name"], center["id"]);

 // 3. STATUSES
 var element = UI_Element_Find(display, "user-status");
 Document_Select_AddOption(element, "", ""); 
 UI_Select_FromDatapage(element, "users/statuses"); 

 // 4. NATIONALITIES
 var element = UI_Element_Find(display, "user-nationality");
 Document_Select_AddOption(element, "", ""); 
 UI_Select_FromConfig(element, "nationalities");
 
 // 5. GENDERS
 var element = UI_Element_Find(display, "user-gender");
 Document_Select_AddOption(element, "", ""); 
 UI_Select_FromDatapage(element, "users/genders"); 
 

 // STANDARD FIELDS
 for(var field in data)
 {
  var element = UI_Element_Find(display, "user-" + field);
  
  if(element)
  {
   Document_Input_Set(element, data[field]);
   Document_Element_SetData(element, "field", field);
   
   // ON VALUE CHANGE - UPDATE
   element.onchange =
   async function(event)
   {
	console.log("update");
	
    var element = event.currentTarget;
    var field   = Document_Element_GetData(element, "field");
	var value   = Document_Input_Get(element);
	
	var user_id = Core_State_Get("users", "user-id");
	
    await Core_Api("User_Update_Field", {user_id, field, value});
   }
   
  }
 
 }
 
 
 // SPECIAL FIELDS
 
 // PICTURE
 var element = UI_Element_Find(display, "user-picture");
 await User_Picture_Load(element, data, undefined, true);
 Document_CSS_SetClass(element, "style-clickable");
 element.onclick =
 function(event)
 {
  var element = event.currentTarget;
  var user_id = Core_State_Get("users", "user-id");
  
  User_Picture_Upload(user_id, {update:[element]});
 }
 
 
 // FAMILY
 var element = UI_Element_Find(display, "user-family_id");
 Document_CSS_SetClass(element, "style-clickable");
 var family = data["family"];
 if(family)
 {
  element.value = family["name"] || family["id"];
 }
 element.onclick = Users_User_ChangeFamily;

 // MANAGER
 var element = UI_Element_Find(display, "user-manager_id");
 Document_CSS_SetClass(element, "style-clickable");
 var manager = data["manager"];
 if(manager)
 {
  var firstname = manager["firstname"] || "";
  var lastname  = manager["lastname"]  || "";
  
  element.value = [firstname, lastname].join(" ").trim();
 }
 element.onclick = Users_User_ChangeManager;
 
 
 
 // APPLY PERMISSIONS
 var editable = User_Config("edit-user-fields", "").split(",");
 
 var elements = Document_Element_FindChildren(display, "field", undefined, ["recurse"]);
 for(var element of elements)
 {
  var field = Document_Element_GetData(element, "field");
  if(!editable.includes(field))
  {
   Document_Element_Disable(element);
  }
 }
 
 
 
 return display;
}



async function Users_User_ChangeFamily(event)
{
 var element  = event.currentTarget;
 var user     = Core_State_Get("users", "user-data");
 
 var center   = User_Center();
 var families = await Core_Api("Families_List_ByCenter", {center});
 
 var title    = UI_Language_String("users/popups", "select family title");
 var family   = await UI_Popup_SelectData(title, families, {id:true, name:true, type:Core_Data_Page("families/types")}, "families/table-fields");
 
 if(family && user["family_id"] != family["id"])
 {  
  // UPDATE DB
  Core_Api("User_Update_Field", {user_id:user["id"], field:"family_id", value:family["id"]});
  
  // UPDATE MEMORY
  user["family_id"] = family["id"];
  
  // UPDATE DISPLAY
  element.value = family["name"] || family["id"];
 }
}


async function Users_User_ChangeManager(event)
{  
 var element = event.currentTarget;
 var user    = Core_State_Get("users", "user-data")
 var role    = Core_Config(["roles", user["role"], "managed-by"], "none").split(",");

 var center = Array_From_Fields(Centers_Available(), "id");
 if(center.length == 0) center = [User_Center()];

 var users   = await Core_Api("Users_List_ByCenter", {role, center, fields:"id,firstname,lastname", order:"firstname,lastname"});
 var manager = await Users_Popup_SelectFromList(users, {firstname:true, lastname:true}, "users/table-fields");

 if(manager && manager["id"] != user["manager_id"])
 {
  // UPDATE DB
  Core_Api("User_Update_Field", {user_id:user["id"], field:"manager_id", value:manager["id"]});
  
  // UPDATE MEMORY
  user["manager_id"] = manager["id"];
  
  // UPDATE DISPLAY
  var firstname = manager["firstname"] || "";
  var lastname  = manager["lastname"]  || "";

  element.value = [firstname, lastname].join(" ").trim(); 
 }
}








