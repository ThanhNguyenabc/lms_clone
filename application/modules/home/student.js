// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                  H O M E  /  S T U D E N T                                     //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Home_Student(page)
{ 
 var data              = await Core_Api("Home_Student_Data", {}); console.log(data);
 var boxes             = [];

 // LAST CLASS TAKEN
 if(Safe_Get(data, ["last-class", "lesson_id"]))
 {
  var title            = UI_Language_String("home/student", "lastclass title");
  var subtitle         = UI_Language_Object(Safe_Get(data, ["last-class", "lesson", "title"], {})) || "";
  var date             = Date_Format_Period(Date_Now(), Safe_Get(data, ["last-class", "date_start"], ""));
  var action           = UI_Language_String("home/student", "lastclass action");
 
  var box              = UI_Element_Create("home/student-class", {title, subtitle, date, action});
  box.style.visibility = "hidden";
 
  var cover    = UI_Element_Find(box, "cover");  
  var source   = Safe_Get(data, ["last-class", "lesson_id"]);
  source       = "content/lessons/" + source + "/cover.png";
  var fallback = Resources_URL("images/cover-lesson.jpg");
  Document_Image_Load(cover, [source, fallback]);
 
  Document_Element_SetData(box, "seat", Safe_Get(data, ["last-class", "id"]));
  page.appendChild(box);
  boxes.push(box);
 }
 
 // NEXT CLASS TO ATTEND
 if(Safe_Get(data, ["next-class", "lesson_id"]))
 {
  var title            = UI_Language_String("home/student", "nextclass title");
  var subtitle         = UI_Language_Object(Safe_Get(data, ["next-class", "lesson", "title"], {}));
  var date             = Date_Format_Period(Date_Now(), Safe_Get(data, ["next-class", "date_start"], ""));
  var action           = UI_Language_String("home/student", "nextclass action");
 
  var box              = UI_Element_Create("home/student-class", {title, subtitle, date, action});
  box.style.visibility = "hidden";
 
  var cover    = UI_Element_Find(box, "cover");  
  var source   = Safe_Get(data, ["next-class", "lesson_id"]);
  source       = "content/lessons/" + source + "/cover.png";
  var fallback = "";
  Document_Image_Load(cover, [source, fallback]);
 
  Document_Element_SetData(box, "seat", Safe_Get(data, ["next-class", "id"]));
  page.appendChild(box);
  boxes.push(box);
 }
 
 // ANIMATE LESSONS POPPING UP
 Document_Element_AnimateChildren(page, "zoomIn 0.5s 1 ease-out", 
 {
  delay:    0, 
  interval: 250, 
  onstart:
  function(element) 
  {
   element.style.visibility = "visible";
  }
 });
 
 
 // LESSONS' ACTION BOXES POPPING OUT
 var time = 1000;
 for(var box of boxes)
 {
  let action     = UI_Element_Find(box, "action-view");
  var seat_id    = Document_Element_GetData(box, "seat");
 
  action.onclick = Home_Student_ViewSeat;
  Document_Element_SetData(action, "seat", seat_id); 
 
  setTimeout(
  function()
  {
   action.style.visibility = "visible";
  
   Document_Element_Animate(action, "rubberBand 0.5s");
  
  }, time);
  
  time = time + 1000;
 }

}




async function Home_Student_ViewSeat(event)
{
 var element = event.currentTarget;
 var seat_id = Document_Element_GetData(element, "seat");  console.log(seat_id);
 
 Module_Preload_Set("course", "viewseat", true);
 await Module_Load("course");
 await Course_Class_Display(false, seat_id);
}