// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         M A N A G E                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Admin_OnLoad(module, data)
{ 
 // CREATE MENU HEADER
 var menus   = Core_Data_Page("admin/menus");
 var allowed = User_Config("admin-functions", "").split(","); 
 
 var items = {};
 for(var key in menus) if(allowed.includes(key))
 {
  items[key]            = {};
  items[key]["text"]    = UI_Language_Object(menus[key]);
  items[key]["icons"]   = [];
  items[key]["onclick"] = Safe_Function("Admin_" + String_Capitalize_Initial(key), function(){});
 }
 
 var header = UI_Header("module-menu", items, {selectfirst:false, css:"color-noted", template:"standard"});
  
 UI_Element_Find(module, "module-header").appendChild(header);
 
 
 
 // CREATE STAFF SUBMENU
 /*
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
 */
}



async function Admin_OnUnload()
{
}



async function Admin_OnShow(module, data)
{
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                       B O O K I N G                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Admin_Booking()
{
 var display   = await Booking_Search_Display({nohide:true, center:User_Center()}, {});
 
 var container = UI_Element_Find("module-page");
 container.innerHTML = "";
 container.appendChild(display);
}




async function Admin_Courses()
{
 var display   = await Courses_Display();
 
 var container = UI_Element_Find("module-page");
 container.innerHTML = "";
 container.appendChild(display);
}



async function Admin_Lessons()
{
 var display   = await Classes_Search_Display();
 
 var container = UI_Element_Find("module-page");
 container.innerHTML = "";
 container.appendChild(display);
}



async function Admin_Timeoff()
{
 var display   = await Timeoff_Display();
 
 var container = UI_Element_Find("module-page");
 container.innerHTML = "";
 container.appendChild(display);
}




async function Admin_Assessment()
{
 // BASED ON USER ROLE DETERMINE WHAT TO SHOW
 var scope = User_Config("admin-assessment");
 switch(scope)
 {
  case "self":
	var user_id  = User_Id();
	var teachers = false;
  break;
  
  case "center":
	var teachers = await Core_Api("Users_List_ByCenter", {role:["teacher"], center:[User_Center()], fields:"id,firstname,lastname", order:"firstname,lastname"});
	var user_id  = Safe_Get(teachers, [0, "id"], false); // DEFAULT TO FIRST TEACHER IN THE LIST
  break;
  
  case "managed":
	var user_id  = User_Id();
	var teachers = true; // WILL AUTOMATICALLY GET TEACHERS MANAGED BY THE CURRENT USER
  break;
 }
	
	
 var display   = await Assessment_List_Display(user_id, teachers);
 
 var container = UI_Element_Find("module-page");
 container.innerHTML = "";
 container.appendChild(display);
}





async function Admin_Projects()
{
 // BASED ON USER ROLE DETERMINE WHAT TO SHOW
 var scope = User_Config("admin-assessment");
 switch(scope)
 {
  case "self":
	var user_id  = User_Id();
	var teachers = false;
  break;
  
  case "center":
	var teachers = await Core_Api("Users_List_ByCenter", {role:["teacher"], center:[User_Center()], fields:"id,firstname,lastname", order:"firstname,lastname"});
	var user_id  = Safe_Get(teachers, [0, "id"], false); // DEFAULT TO FIRST TEACHER IN THE LIST
  break;
  
  case "managed":
	var user_id  = User_Id();
	var teachers = true; // WILL AUTOMATICALLY GET TEACHERS MANAGED BY THE CURRENT USER
  break;
 }
	
	
 var display   = await Projects_List_Display(user_id, teachers);
 
 var container = UI_Element_Find("module-page");
 container.innerHTML = "";
 container.appendChild(display);
}