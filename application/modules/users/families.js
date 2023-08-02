async function Users_Family_DisplayMain(id, options = {})
{
 var data = await Core_Api("Family_Read", {id, options:{manager:true}});
 console.log(data);
 
 Core_State_Set("users", "family-id", id);
 Core_State_Set("users", "family-data", data);
 
 var display = UI_Element_Create("users/family-main", {}, {language:"users/family-main"});
 
 // DROPDOWN SOURCES
 
 // 1. CENTERS
 var element = UI_Element_Find(display, "family-center");
 Document_Select_AddOption(element, "", ""); 
 var centers = Centers_Available();
 for(var center of centers) Document_Select_AddOption(element, center["name"], center["id"]);

 // 2. STATUSES
 var element = UI_Element_Find(display, "family-status");
 Document_Select_AddOption(element, "", ""); 
 UI_Select_FromDatapage(element, "families/statuses"); 
 
 // 3. TYPES
 var element = UI_Element_Find(display, "family-type");
 Document_Select_AddOption(element, "", ""); 
 UI_Select_FromDatapage(element, "families/types"); 


 // STANDARD FIELDS
 for(var field in data)
 {
  var element = UI_Element_Find(display, "family-" + field);
  
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
	
	var id      = Core_State_Get("users", "family-id");
	
    await Core_Api("Family_Update_Field", {id, field, value});
   }
   
  }
 
 }
 
 
 // JSON DATA FIELDS
 var more   = data["data"] || {};
 var inputs = Document_Element_FindChildren(display, "type", "data", ["recurse"]);
 
 for(var element of inputs)
 {
  var field = Document_Element_GetData(element, "uid");
  
  if(field)
  {
   if(typeof more[field] != "undefined") Document_Input_Set(element, more[field]);
   Document_Element_SetData(element, "field", field);
   
   // ON VALUE CHANGE - UPDATE
   element.onchange =
   async function(event)
   {
	console.log("update");
	
    var element = event.currentTarget;
    var field   = Document_Element_GetData(element, "field");
	var value   = Document_Input_Get(element);
	
	var id      = Core_State_Get("users", "family-id");
	
    await Core_Api("Family_Update_Data", {id, field, value});
   }
   
  }
 
 }
 
 
 // MANAGER
 var element = UI_Element_Find(display, "family-manager_id");
 Document_CSS_SetClass(element, "style-clickable");
 var manager = data["manager"];
 if(manager)
 {
  var firstname = manager["firstname"] || "";
  var lastname  = manager["lastname"]  || "";
  
  element.value = [firstname, lastname].join(" ").trim();
 }
 element.onclick = Users_Family_ChangeManager;
 
 
 
 // APPLY PERMISSIONS
 var editable = User_Config("edit-family-fields", "").split(",");
 
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



async function Users_Family_DisplayMore(family, maindisplay = false)
{
 var display = UI_Element_Create("users/family-more");
 if(maindisplay) Document_Element_SetObject(display, "main-display", maindisplay);
 
 var view   = User_Config("view-family-more", "").split(",");
 var items  = {};
 
 var header_dispatcher =
 async function(item)
 {
  console.log(item);
  
  var f    = Safe_Function("Users_Family_Display" + String_Capitalize_Initial(item["display"]), function(){});
  var data = await f(item["family"], maindisplay);

  var container = UI_Element_Find(display, "data");
  container.innerHTML = "";
  container.appendChild(data);
 }
 
 // BUILD HEADER BASED ON MORE.DAT INFORMATION + PARTNER CONFIGURATION
 var more   = Core_Data_Page("users/family-more");
 for(var field in more)
 { 
  // IS THE CURRENT USER ALLOWED TO SEE THIS PAGE?
  if(view.includes(field))
  {
   var item        = {};
   item["text"]    = UI_Language_String("users/family-more", field);
   item["icons"]   = [];
   item["family"]  = family;
   item["display"] = field;
   item["onclick"] = header_dispatcher;
   items[field]    = item;
  }
 }
 
 var header = UI_Header("header-more", items, {selectfirst:false, css:"color-noted", template:"standard"}); 
 
 UI_Element_Find(display, "header").appendChild(header);
 return display;
}




async function Users_Family_DisplayUsers(family, maindisplay)
{
 if(typeof family == "object") var users = family["users"] || []; else var users = await Core_Api("Family_Users", {id:family});
 
 users     = Object.values(users);
 var table = UI_Table_Data(users, {id:true, firstname:true, lastname:true}, "users/table-fields",
 // EVENTS
 {
  row:
  async function(event)
  {
   var element = event.currentTarget;
   var user    = Document_Element_GetObject(element, "item");
   
   if(maindisplay)
   {
    var display           = await Users_User_DisplayMain(user["id"]);
	maindisplay.innerHTML = "";
	maindisplay.appendChild(display);
   }
  }
 },
 
 // ACTIONS
 {
  delete:
  {
   icon:"trash-can",
   onclick: async function(item, row)
   {
	console.log(item);
	
	var name    = [item["firstname"] || "", item["lastname"] || ""].join(" ").trim();
    var title   = UI_Language_String("users/popups", "family removeuser title"); 
    var text    = UI_Language_String("users/popups", "family removeuser text", {name}); 
    var picture = Resources_URL("images/cover-alert.jpg");
 
    var confirm  = await UI_Popup_Confirm(title, text, picture);
    if(!confirm) return; 
	
	await Core_Api("User_Update_Field", {user_id:item["id"], field:"family_id", value:null});
	row.remove();
   }
  }
 });
 
 return table;
}




async function Users_Family_ChangeManager(event)
{
 var element = event.currentTarget;
 var family  = Core_State_Get("users", "family-data")
 var role    = Module_Config("families", "managed-by", "").split(",");

 var center = Array_From_Fields(Centers_Available(), "id");
 if(center.length == 0) center = [User_Center()];

 var users   = await Core_Api("Users_List_ByCenter", {role, center, fields:"id,firstname,lastname", order:"firstname,lastname"});
 var manager = await Users_Popup_SelectFromList(users, {firstname:true, lastname:true}, "users/table-fields");

 if(manager && manager["id"] != family["manager_id"])
 {
  // UPDATE DB
  Core_Api("Family_Update_Field", {id:family["id"], field:"manager_id", value:manager["id"]});// UPDATE DISPLAY
  
  // UPDATE MEMORY
  family["manager_id"] = manager["id"];
  
  // UPDATE DISPLAY
  var firstname = manager["firstname"] || "";
  var lastname  = manager["lastname"]  || "";
  
  element.value = [firstname, lastname].join(" ").trim(); 
 }
}
