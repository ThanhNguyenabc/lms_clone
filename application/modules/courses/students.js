// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      S T U D E N T S                                           //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

function Courses_Students_Display()
{
 var course   = Core_State_Get("courses", "selected-course", {});
 var display  = Core_State_Get("courses", "course-display");
 
 var box       = UI_Element_Find(display, "course-students");
 box.innerHTML = "";

 var page = Core_Data_Page("courses/course-staff");
 // SCAN ALL STAFF ROLES (NATIVE TEACHER, LOCAL TEACHER ETC.)
 for(var user of course["students"])
 {     
  var user_name = user["firstname"] + " " + user["lastname"];
  
  var element = UI_Element_Create("courses/course-student-item", {name:user_name});  
   
  UI_Element_Find(element, "view").onclick   = Courses_Students_View;
  UI_Element_Find(element, "delete").onclick = Courses_Students_Remove;

  Document_Element_SetObject(element, "student", user);
    
  box.appendChild(element);
 }
 
}



async function Courses_Students_Remove(event)
{
 var course   = Core_State_Get("courses", "selected-course", {});
 
 var element  = event.currentTarget;
 var parent   = Document_Element_FindParent(element, "item", "student");
 var student  = Document_Element_GetObject(parent, "student"); 

 var students = course["students"] || [];
 Array_Element_Delete(students, student);

//  await Courses_Students_Update();

 await Core_Api("Courses_Students_Remove", {id:course["id"], student_id: student["id"]});
 Courses_Students_Display();
}




async function Courses_Students_View(event)
{ 
 var element  = event.currentTarget;
 var parent   = Document_Element_FindParent(element, "item", "student");
 var student  = Document_Element_GetObject(parent, "student"); 

 await User_View_Popup(student["id"]);
}




async function Courses_Students_Update()
{
 var course   = Core_State_Get("courses", "selected-course", {});
 
 // UPDATE DB
 var data = [];
 for(var student of course["students"])
 {
  data.push(student["id"]);
 }
 
 await Core_Api("Courses_Update_Field", {id:course["id"], field:"students", value:data, json:true});
}