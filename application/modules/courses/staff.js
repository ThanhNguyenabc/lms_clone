// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         S T A F F                                              //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Courses_Staff_Display()
{
 var course   = Core_State_Get("courses", "selected-course", {});
 var display  = Core_State_Get("courses", "course-display");
 
 var box       = UI_Element_Find(display, "course-staff");
 box.innerHTML = "";

 var page = Core_Data_Page("courses/course-staff");
 // SCAN ALL STAFF ROLES (NATIVE TEACHER, LOCAL TEACHER ETC.)
 for(var place in page)
 {     
  var user      = Safe_Get(course, ["staff", place], false);
  
  var user_place = UI_Language_Object(page[place]);
  var user_role  = page[place]["role"];
  var user_id    = user["id"];
  var user_name  = user["firstname"] + " " + user["lastname"];
  
  // IS THIS STAFF MEMBER LOADED?
  if(user)
  {
   var element = UI_Element_Create("courses/course-staff-item", {name:user_name});
   
   UI_Element_Find(element, "name").onclick   = Courses_Staff_View;
   UI_Element_Find(element, "delete").onclick = Courses_Staff_Unset;
  }	  
  else
  {
   var element = UI_Element_Create("courses/course-staff-placeholder", {role:user_place});
   
   UI_Element_Find(element, "add").onclick = Courses_Staff_Set;
  }
  
  Document_Element_SetData(element,   "id",    user_id); 
  Document_Element_SetData(element,   "name",  user_name);
  Document_Element_SetData(element,   "place", place);
  Document_Element_SetData(element,   "role",  user_role);
  
  box.appendChild(element);
 }
 
}



async function Courses_Staff_Set(event)
{
 var course = Core_State_Get("courses", "selected-course", {});
 var config = Safe_Get(course, ["config"], []);


 // 1. DETERMINE WHAT PLACE = ROLE ARE WE SELECTING FOR (EXAMPLE:  ta2 = ta)
 var element = event.currentTarget;
 var parent  = Document_Element_FindParent(element, "item", "staff");
 var place   = Document_Element_GetData(parent, "place");
 var role    = Core_Data_Value("courses/course-staff", place, "role");
 var field   = Core_Data_Value("courses/course-staff", place, "field");
 
 

 // 2. COMPLETENESS CHECK: THE COURSE MUST BE WELL COMPILED BEFORE WE CAN ADD STAFF
 for(var check of ["center_id", "classes"])
 {
  if(!Safe_Validate(course[check]))
  {
   var picture = Resources_URL("images/cover-deny.png");
   var title   = UI_Language_String("courses/popups", "addstaff cant title"); 
   var content = UI_Language_String("courses/popups", "addstaff missing " + check);
  
   await UI_Popup_Alert(title, content, picture);
   
   Courses_Course_HighlightMissing("addstaff", check);
  
   return;
  }
 }
 
 
 
 // 3. PACKAGE CLASSES INTO DATE_START DATE_END ARRAY.
 var dates = [];
 for(var item of course["classes"])
 {
  // WE NEED TO TAKE TEACHER TYPE INTO ACCOUNT TO DETERMINE, FOR EACH DATE, IF WE ARE HAVING A NATIVE OR LOCAL TEACHER
  // IF THE TYPE OF EXPECTED TEACHER DOESN'T MATCH THE PATTERN, DO NOT ADD
  var skip = (place == "local_id" && item["teacher_type"] == "native") || (place == "teacher_id" && item["teacher_type"] == "local");
  
  if(!skip)
  {
   var date_start = item["date_start"];
   var date_end   = item["date_end"];
   var id         = item["id"];
  
   // KEEP DATES LINKED TO THEIR CLASS INDEX BECAUSE LATER WE MIGHT NEED TO FLTER THE DATES ARRAY
   dates.push({date_start, date_end, id});
  }
 }

 
 
 // 4. GET CENTERS RELATED TO THIS COURSE'S CENTER (WE CAN PICK STAFF FROM OTHER CENTERS, TOO)
 var centers  = Centers_Related(course["center_id"], true);
 
   
 // 5. CALL API TO LIST AVAILABLE USERS FOR THE PROVIDED DATES
 //var users    = await Core_Api("Users_List_ByCenter", {role:[role], center:centers, fields:"id,firstname,lastname", order:"firstname,lastname"});
 var users = await Core_Api("Users_Available_Teach", {centers, roles:[role], dates, 
 options:
 {
  info:"firstname,lastname",
  utc: true
 }});
 
 users = Object_To_Array(users);
 
 
 // 6. POPUP WITH AVAILABLE USERS
 var user = await Users_Popup_SelectFromList(users, {id:true, firstname:true, lastname:true}, "users/table-fields");
 if(!user) return;
  
  
 // 7. ASSIGN THE SELECTED USER
 
 
 // 7.1 ASSIGN USER TO CLASSES (ONLY CLASSES THAT ARE NOT IN THE PAST)
 var filtered = [];
 var now      = Date_Now();
 for(var item of dates) if(item["date_start"] > now) filtered.push(item);
 
 var classes = Array_From_Fields(filtered, "id");
 await Core_Api("Courses_Staff_Set", {classes, field, user_id:user["id"]});
 
 
 // 7.2 UPDATE COURSE STAFF
 var staff    = course["staff"];
 staff[place] = user;
 await Courses_Staff_Update();
 Courses_Staff_Display();
 
 
 Courses_Course_UpdateUI();
}





async function Courses_Staff_Unset(event, user_id)
{
 var course = Core_State_Get("courses", "selected-course", {});
 var staff  = Safe_Get(course, "staff", {});
 
 if(!user_id)
 {
  // USER ID NOT SPECIFIED = UNSET BY USER CLICK
  var element  = event.currentTarget;
  var parent   = Document_Element_FindParent(element, "item", "staff");
  var place    = Document_Element_GetData(parent, "place");
  var role     = Core_Data_Value("courses/course-staff", place, "role");
  var field    = Core_Data_Value("courses/course-staff", place, "field");
  var name     = Document_Element_GetData(parent, "name");
  var user_id  = Document_Element_GetData(parent, "id", user_id); 
 
 
  // CONFIRMATION POPUP
  var text     = UI_Language_Object(Core_Config(["roles"])[role]);
  var title    = UI_Language_String("courses/popups", "staff delete title", {role:text}); 
  var content  = UI_Language_String("courses/popups", "staff delete text",  {name}); 
  var picture  = Resources_URL("images/cover-logout.png");
 
  var confirm  = await UI_Popup_Confirm(title, content, picture);
  if(!confirm) return;
 }
 else
 {
  // USER ID SPECIFIED = UNSET BY DIRECT CALL FROM SOME OTHER FUNCTION
  
  // FIND WHAT PLACE THIS USER IS OCCUPYING
  var place = false;
  
  for(var key in staff)
  {
   if(staff[key]["id"] == user_id)
   {
	var place = key;
	break;
   }
  }
 }
 
 
 // REMOVE FROM ROLLED OUT CLASSES
 await Core_Api("Courses_Staff_Unset", {id:course["id"], field, user_id});
 
 // UNSET IN STAFF
 if(place) delete staff[place];
 
 // UPDATE STAFF
 await Courses_Staff_Update();
 Courses_Staff_Display();
 
 
 Courses_Course_UpdateUI();
}




async function Courses_Staff_Update()
{
 var course   = Core_State_Get("courses", "selected-course", {});
 
 // UPDATE DB
 var data = {};
 for(var place in course["staff"])
 {
  data[place] = course["staff"][place]["id"];
 }
 
 await Core_Api("Courses_Update_Field", {id:course["id"], field:"staff", value:data, json:true});
}




async function Courses_Staff_View(event)
{
 var element  = event.currentTarget;
 var parent   = Document_Element_FindParent(element, "item", "staff");
 var id       = Document_Element_GetData(parent, "id");
 
 await User_View_Popup(id);
}