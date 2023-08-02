// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                  H O M E  /  T E A C H E R                                     //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


async function Home_Teacher(page)
{ 
 // GET CLASS ASSESSMENT DATA UP TO 7 DAYS PRIOR
 var date_from = Date_Portion(Date_Add_Days(Date_Now(), -300), "no-seconds");
 var date_to   = Date_Portion(Date_Now(), "no-seconds");
 var data      = await Core_Api("Classes_Assessment_Data", {date_from, date_to});


 var info      = await Classes_Assessment_Map(data); 
 info.reverse();
 
 
 var container = UI_Element_Find(page, "outstanding-classes");
 
 for(var item of info)
 {
  if(item["attention"])
  {
   var title    = UI_Language_Object(Safe_Get(item, ["lesson", "title"], {})) || "";
   //var date     = Date_Format_Period(Date_Now(), item["date_start"], "");
   var date     = Date_Format(item["date_start"], undefined, "date-time-compact");
   var element  = UI_Element_Create("home/teacher-outstanding-class", {title, date});
   var cover    = UI_Element_Find(element, "cover");
   var source   = "content/lessons/" + item["lesson_id"] + "/cover.png";
   var fallback = Resources_URL("images/cover-lesson.jpg");
   Document_Image_Load(cover, [source, fallback]);
   
   var lines = UI_Element_Find(element, "outstanding-seats");
   for(var seat of item["seats"])
   {
	if(seat["attention"])
	{
     var name     = "";  console.log(seat);
     var line     = UI_Element_Create("home/teacher-outstanding-seat", {name});
	 var sections = UI_Element_Find(line, "sections");
	 
	 for(var missing of seat["missing"]) 
	 {
      var text    = UI_Language_String("home/teacher", "missing " + missing);
	  var icon    = Core_Data_Value("home/attention", missing, "icon");
	  var section = UI_Element_Create("home/teacher-outstanding-item", {icon, text});
	  
	  Document_Element_SetData(section, "section", missing);
	  section.onclick = Home_Teacher_DisplaySeat;
	  
      sections.appendChild(section);	  
	 }
	 
	 var picture  = UI_Element_Find(line, "picture");
	 var source   = Resources_URL("propic.jpg", "user", seat["student_id"]);
	 var fallback = Resources_URL("images/default/propic-student.png");
	 Document_Image_Load(picture, [source, fallback]); 
	 picture.onclick = Home_Teacher_DisplaySeat;
	 
	 
     Document_Element_SetObject(line, "seat",  seat);
	 Document_Element_SetData(line,   "title", title);
	 Document_Element_SetData(line,   "date",  item["date_start"]);
	 
	 
	 lines.appendChild(line);
	}
   }
   
   element.style.visibility = "hidden";
   container.appendChild(element);
  }
 }

 
 
 Document_Element_AnimateChildren(container, "slideInLeft 0.5s 1 ease-out", 
 {
  delay:    0, 
  interval: 250, 
  onstart:
  function(element) 
  {
   element.style.visibility = "visible";
  }
 });
 
}





async function Home_Teacher_DisplaySeat(event)
{
 var element         = event.currentTarget;
 var section         = Document_Element_GetData(element, "section");
    
 var container       = Document_Element_FindParent(element,  "uid", "seat");
 var seat            = Document_Element_GetObject(container, "seat");
 var title           = Document_Element_GetData(container,   "title");
 var date            = Document_Element_GetData(container,   "date");
 
 var current         = Core_State_Get("home", ["current-seat"]);
 if(current != seat["id"])
 {
  var page            = await Assessment_Assess_Seat(seat["id"]);
 
  var container       = UI_Element_Find("seat-title");
  container.innerHTML = title.toUpperCase() + ", " + Date_Format(date, UI_Language_Current(true));
 
  var container       = UI_Element_Find("seat-assessment");
  container.innerHTML = "";
  container.appendChild(page);
 }
 
 if(section) Home_Teacher_HighlightSection(section);
 
 Core_State_Set("home", ["current-seat"], seat["id"]);
}




async function Home_Teacher_HighlightSection(section)
{
 var container = UI_Element_Find("seat-assessment"); 
 var section   = UI_Element_Find(container, "section-" + section);
 if(!section) return;
 
 section.scrollIntoView({behavior: "smooth", block: "center"});
 Document_Element_Animate(section, "flash 1s 2");
}