// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                             M O R E                                            //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Users_User_DisplayMore(user)
{
 if(typeof user != "object") var user = await Core_Api("User_Read", {user_id:user, options:{fields:"id,role"}});
  
 var display = UI_Element_Create("users/user-more");
 
 var edit   = User_Config("edit-user-data", "").split(",");
 var items  = {};
 
 // BUILD HEADER BASED ON ROLE INFORMATION + PARTNER CONFIGURATION
 var data = User_Role_Config(user["role"], "user-data", "").split(",");
 for(var field of data)
 { 
  // IS THE CURRENT USER ALLOWED TO SEE THIS PAGE?
  if(edit.includes(field))
  {
   var item        = {};
   item["text"]    = UI_Language_String("users/user-more", field);
   item["icons"]   = [];
   item["onclick"] = Safe_Function("Users_More_Display" + String_Capitalize_Initial(field), function(){});
   items[field]    = item;
  }
 }
 
 var header = UI_Header("header-more", items, {selectfirst:false, css:"color-noted", template:"standard"}); 
 
 UI_Element_Find(display, "header").appendChild(header);
 return display;
}



async function Users_More_DisplayFamily(event)
{
 var element  = event.currentTarget;
 var user     = Core_State_Get("users", "user-data");
 
 // DISPLAY
 var container = UI_Element_Find("user-more");
 
 // BUTTONS
 var buttons           = UI_Element_Find(container, "buttons");
 buttons.innerHTML     = "";
 buttons.style.display = "none";
 
 if(user["family_id"])
 {
  var display    = await Users_Family_DisplayMain(user["family_id"]);
  
  var data       = UI_Element_Find(container, "data");
  data.innerHTML = "";
  data.appendChild(display);
 }
 else
 {
 }
 
}



async function Users_More_DisplayClasses(event)
{
 var user    = Core_State_Get("users", "user-data");
 var classes = await Core_Api("Classes_List_ByStudent", {student_id:user["id"]});
 
 for(var item of classes)
 {
  item["period"] = Date_Format_Period(Date_Now(), item["date_start"], {locale:UI_Language_Current(true), conversational:true});
 }
 
 var list = UI_List_Items(classes, ["style-outlined-accented", "outline-inner"], Users_More_DisplayClass, {style:"vertical", overflow:true, sections:"period"},
 // ITEMS
 function(item)
 {
  var info    = Class_Info(item);
  
  var element = UI_Element_Create("users/more-class-item", info);
  Document_Element_SetObject(element, "item", item);
  
  return element;
 },

 // SECTIONS
 function(section, item)
 {
  var element = UI_Element_Create("users/more-class-section", {period:section.toUpperCase()});  
  return element;
 });
 
 
 // DISPLAY
 var container = UI_Element_Find("user-more");
 
 // BUTTONS
 var buttons           = UI_Element_Find(container, "buttons");
 buttons.innerHTML     = "";
 buttons.style.display = "none";


 var data       = UI_Element_Find(container, "data");
 data.innerHTML = "";
 data.appendChild(list);
}



async function Users_More_DisplayPlacements(event)
{
 var user    = Core_State_Get("users", "user-data");
 var classes = await Core_Api("Classes_List_ByStudent", {student_id:user["id"], options:{types:["placement"]}});
 
 for(var item of classes)
 {
  item["period"] = Date_Format_Period(Date_Now(), item["date_start"], {locale:UI_Language_Current(true), conversational:true});
 }
 
 var list = UI_List_Items(classes, ["style-outlined-accented", "outline-inner"], Users_More_DisplayClass, {style:"vertical", overflow:true, sections:"period"},
 // ITEMS
 function(item)
 {
  var info    = Class_Info(item);
  
  var element = UI_Element_Create("users/more-class-item", info);
  Document_Element_SetObject(element, "item", item);
  
  return element;
 },

 // SECTIONS
 function(section, item)
 {
  var element = UI_Element_Create("users/more-class-section", {period:section.toUpperCase()});  
  return element;
 });

 
 // DISPLAY
 var container  = UI_Element_Find("user-more");
 
 // DATA
 var data       = UI_Element_Find(container, "data");
 data.innerHTML = "";
 data.appendChild(list);

 // BUTTONS
 var buttons           = UI_Element_Find(container, "buttons");
 buttons.innerHTML     = "";
 buttons.style.display = "flex";
 
 var text       = UI_Language_String("users/user-more", "button book placement");
 var button     = UI_Element_Create("core/button-medium-plain", {text});
 button.onclick = 
 async function()
 {
  var student = user["id"];
  var center  = User_Center(); // CURRENTLY SELECTED CENTER ONLY
  
  var seat    = await User_More_BookPlacement(student, center);
  console.log("booked " + seat);
  
  // IF BOOKED, RELOAD DATA
  if(seat)
  {
   Users_More_DisplayPlacements();
  }
 }
 
 buttons.appendChild(button);
}




async function User_More_BookPlacement(student, center)
{ 
 // CONFIGURE AND LAUNCH A CLASS SEARCH POPUP WITH AUTOSEARCH AND BOOKING
 var seat = await Classes_Search_Popup(
 {
  type:      "placement", 
  center,
  datefrom:  Date_Now(),
  dateto:    Date_Add_Days(Date_Now(), 60),
  seats:     "yes"
 },
    
 {
  autosearch:true,
  book:true
 },

 {
  student
 });
 
 return seat;
}




async function Users_More_DisplayClass(element)
{
 var item = Document_Element_GetObject(element, "item");
 await Class_Display(item["id"]);
}




async function Users_More_DisplayFiles(event)
{
 // DISPLAY
 var container  = UI_Element_Find("user-more");
  
 // BUTTONS
 var buttons           = UI_Element_Find(container, "buttons");
 buttons.innerHTML     = "";
 buttons.style.display = "none";
 
 var user       = Core_State_Get("users", "user-data");
 var files      = await Core_Api("User_Files_List", {id:user["id"], folder:"documents"});
 
 var list       = UI_List_Files(files, "download", {style:"icons"});
  
 var data       = UI_Element_Find(container, "data");
 data.innerHTML = "";
 data.appendChild(list);
}




async function Users_More_DisplayPermissions(event)
{
 var user_id = Core_State_Get("users", "user-id");
  
 // READ PERMISSIONS
 var permissions = await Core_Api("User_Config_Read", {user_id, file:"permissions"});
 
 
 // DISPLAY
 var container  = UI_Element_Find("user-more");
  
 // BUTTONS
 var buttons           = UI_Element_Find(container, "buttons");
 buttons.innerHTML     = "";
 buttons.style.display = "none";
 
 
 // CENTERS
 var page       = UI_Element_Create("users/user-more-permissions", {}, {language:"users/user-more"});
 
 var allcenters = Centers_List();
 var centers    = [];
 for(var id in allcenters)
 {
  var item      = {};
  
  item["id"]    = id;
  item["text"]  = allcenters[id]["name"] || id;
  item["value"] = Safe_Get(permissions, ["centers", id]);
  
  centers.push(item);
 }
 
 var list    = UI_List_Checks(centers, "plain",
 async function(item, items)
 {
  var user_id = Core_State_Get("users", "user-id");
  var centers = {};
  
  for(var item of items)
  {
   if(item["value"])
   {
	var id = item["id"];
	centers[id] = true;
   }
  }
  
  await Core_Api("User_Config_WriteSection", {user_id, file:"permissions", section:"centers", data:centers});
 });
 
 
 UI_Element_Find(page, "centers").appendChild(list);
  
 var data       = UI_Element_Find(container, "data");
 data.innerHTML = "";
 data.appendChild(page);
}