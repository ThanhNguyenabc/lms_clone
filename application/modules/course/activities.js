// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                  A C T I V I T I E S                                           //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Course_Class_ActivityVideo(data, state, source)
{
 var row       = UI_Element_Create("course/class-row-content");
 
 var lesson_id = Safe_Get(data, ["lesson", "source"]);
 var path      = "content/lessons/" + lesson_id + "/" + source;
 var results   = Safe_Get(data, ["activities", lesson_id + "/" + source], []);
    
 // COVER PICTURE
 var url           = path + "/cover.png";
 var element       = UI_Element_Find(row, "cover");
 var fallback      = Resources_URL("");
 Document_Image_Load(element, [url, fallback]);
  
  
 // COVER CAPTION
 var element       = UI_Element_Find(row, "caption");
 element.innerHTML = UI_Language_String("course/activities", "video");
  
  
 // ACTIONS
 var actions = UI_Element_Find(row, "actions");
 for(var activity of ["watch", "learn", "readspeak", "listenspeak", "listenwrite"])
 { 
  var icon   = Core_Data_Value("course/activities", "video activity " + activity, "icon") || Core_Data_Value("course/activities", "video", "icon");
  icon       = "<li class = 'fa fa-" + icon + "'></li>";
  
  var text   = icon + "&nbsp;&nbsp;&nbsp;" + UI_Language_String("course/activities", "video activity " + activity);
  var cfg    = Core_Data_Section("video/modes", activity);
   
  var action = Course_Class_DisplayAction(actions, text, activity, state, path, "content");
  Document_Element_SetObject(action, "config", cfg);
 }
  
 
 // EMPTY CHART
 var chart                = Course_Class_DisplayChart([], state);
 var element              = UI_Element_Find(row, "row-chart");
 Document_Element_Disable(element, "style-disabled");
 element.appendChild(chart);
 
 
 return row;
}




function Course_Class_ActivityTest(data, state, source)
{
 var row       = UI_Element_Create("course/class-row-content");
 
 var lesson_id = Safe_Get(data, ["lesson", "source"]);
 var path      = "content/lessons/" + lesson_id + "/" + source;
 var results   = Safe_Get(data, ["activities", lesson_id + "/" + source], []);
 var classdate = Safe_Get(data, ["class", "date_end"], Date_Now());
 
 // COVER PICTURE
 var url           = "content/lessons/" + lesson_id + "/cover.png";
 var element       = UI_Element_Find(row, "cover");
 var fallback      = Resources_URL("images/cover-test.jpg");
 Document_Image_Load(element, [url, fallback]);
  
 // COVER CAPTION
 var element       = UI_Element_Find(row, "caption");
 element.innerHTML = UI_Language_String("course/activities", "test");
  
  
 // ACTIONS
 var actions = UI_Element_Find(row, "actions");
  
  
 // PRE-LESSON ASSESSMENT
 var icon   = Core_Data_Value("course/activities", "test action prelesson", "icon") || Core_Data_Value("course/activities", "test", "icon");
 icon       = "<li class = 'fa fa-" + icon + "'></li>";
  
 var text   = icon + "&nbsp;&nbsp;&nbsp;" + UI_Language_String("course/activities", "test action prelesson");
 var action = Course_Class_DisplayAction(actions, text, "test", state, path, "content");
 if(User_Role() == "student" && (results.length != 0 || state == "post")) Document_Element_Disable(action, "style-disabled"); 
    
	
 // FREE PRACTICE: IF BEFORE CLASS AND NO RESULT YET, DISALLOW
 var icon   = Core_Data_Value("course/activities", "test action practice", "icon") || Core_Data_Value("course/activities", "test", "icon");
 icon       = "<li class = 'fa fa-" + icon + "'></li>";
 
 var text   = icon + "&nbsp;&nbsp;&nbsp;" +UI_Language_String("course/activities", "test action practice");
 var action = Course_Class_DisplayAction(actions, text, "practice", state, path, "nocontent");
 if(User_Role() == "student" && results.length == 0 && state == "pre") Document_Element_Disable(action, "style-disabled"); 
  
  
 // POST-LESSON ASSESSMENT
 var icon   = Core_Data_Value("course/activities", "test action postlesson", "icon") || Core_Data_Value("course/activities", "test", "icon");
 icon       = "<li class = 'fa fa-" + icon + "'></li>";
 
 var text   = icon + "&nbsp;&nbsp;&nbsp;" + UI_Language_String("course/activities", "test action postlesson");
 var action = Course_Class_DisplayAction(actions, text, "test", state, path, "content", {classdate});
 if(User_Role() == "student" && state == "pre") Document_Element_Disable(action, "style-disabled"); 
  
  
 // CHART
 var chart   = Course_Class_DisplayChart(results, state);
 var element = UI_Element_Find(row, "row-chart");
 element.appendChild(chart);
  
 // CHART TEXT
 Course_Class_DisplayChartText(row, results, state);
  
 return row;
}





function Course_Class_ActivityVocabulary(data, state, source)
{
 var row        = UI_Element_Create("course/class-row-content");
 
 var lesson_id  = Safe_Get(data, ["lesson", "source"]);
 var path       = "content/lessons/" + lesson_id + "/" + source;
 var results    = Safe_Get(data, ["activities", lesson_id + "/" + source], []);
 var classdate  = Safe_Get(data, ["class", "date_end"], Date_Now());
 var vocabulary = Safe_Get(data, ["lesson", "vocabulary"], {});
 
 
 // COVER PICTURE
 // TRY TO USE FIRST VOCABULARY TERM AS COVER
 var values        = Object.values(vocabulary);
 var url           = "content/vocabulary/" + values[0] + "/picture.png";
 var element       = UI_Element_Find(row, "cover");
 var fallback      = Resources_URL("images/cover-dictionary.jpg");
 Document_Image_Load(element, [url, fallback]);
  
 // COVER CAPTION
 var element       = UI_Element_Find(row, "caption");
 element.innerHTML = UI_Language_String("course/activities", "vocabulary");
  
  
 // ACTIONS
 var actions = UI_Element_Find(row, "actions");
  
 // PRE-LESSON ASSESSMENT
 var icon   = Core_Data_Value("course/activities", "vocabulary action prelesson", "icon") || Core_Data_Value("course/activities", "vocabulary", "icon");
 icon       = "<li class = 'fa fa-" + icon + "'></li>";
 
 var text   = icon + "&nbsp;&nbsp;&nbsp;" + UI_Language_String("course/activities", "vocabulary action prelesson");
 var action = Course_Class_DisplayAction(actions, text, "test", state, path, "content");
 if(User_Role() == "student" && (results.length != 0 || state == "post")) Document_Element_Disable(action, "style-disabled"); 
	
 
 // FREE PRACTICE: IF BEFORE CLASS AND NO RESULT YET, DISALLOW
 var icon   = Core_Data_Value("course/activities", "vocabulary action practice", "icon") || Core_Data_Value("course/activities", "vocabulary", "icon");
 icon       = "<li class = 'fa fa-" + icon + "'></li>";
 
 var text   = icon + "&nbsp;&nbsp;&nbsp;" + UI_Language_String("course/activities", "vocabulary action practice");
 var action = Course_Class_DisplayAction(actions, text, "practice", state, path, "nocontent");
 if(User_Role() == "student" && results.length == 0 && state == "pre") Document_Element_Disable(action, "style-disabled");
  
 
 // POST-LESSON ASSESSMENT
 var icon   = Core_Data_Value("course/activities", "vocabulary action postlesson", "icon") || Core_Data_Value("course/activities", "vocabulary", "icon");
 icon       = "<li class = 'fa fa-" + icon + "'></li>";
 
 var text   = icon + "&nbsp;&nbsp;&nbsp;" + UI_Language_String("course/activities", "vocabulary action postlesson");
 var action = Course_Class_DisplayAction(actions, text, "test", state, path, "content", {classdate});
 if(User_Role() == "student" && state == "pre") Document_Element_Disable(action, "style-disabled"); 
  
  
 // CHART
 var chart   = Course_Class_DisplayChart(results, state);
 var element = UI_Element_Find(row, "row-chart");
 element.appendChild(chart);
  
 // CHART TEXT
 Course_Class_DisplayChartText(row, results, state)
  
  
 return row;
}





function Course_Class_ActivityDocuments(data, state, source)
{
 var row       = UI_Element_Create("course/class-row-content");
 
 var lesson_id = Safe_Get(data, ["lesson", "source"]);
 var path      = "content/lessons/" + lesson_id + "/" + source;
 var results   = Safe_Get(data, ["activities", lesson_id + "/" + source], []);
 var documents = Object_Subset(data["lesson"], "document ");
 
 
 // COVER PICTURE
 var url           = Resources_URL("images/cover-presentation.jpg");
 var element       = UI_Element_Find(row, "cover");
 Document_Image_Load(element, [url]);
 
 
 // COVER CAPTION
 var element       = UI_Element_Find(row, "caption");
 element.innerHTML = UI_Language_String("course/activities", "documents");
  
  
 // ACTIONS
 var actions = UI_Element_Find(row, "actions");
 
 // DOCUMENTS
 for(var id in documents)
 {
  var file = documents[id] || {};
  var name = file["file"]  || "";
  
  if(name && Path_Filename(Path_RemoveExtension(name)).toLowerCase() != "plan")
  {
   var icon     = Core_Data_Value("course/activities", "documents", "icon");
   icon         = "<li class = 'fa fa-" + icon + "'></li>";
  
   var text     = icon + "&nbsp;&nbsp;&nbsp;" + UI_Language_Object(file);
   var filename = file["file"]
  
   var action = Course_Class_DisplayAction(actions, text.toLowerCase(), filename, state, path, "nocontent"); 
   action.style.textTransform = "capitalize";
   
   // ENABLE ONLY AFTER LESSON
   if(User_Role() == "student" && state == "pre") Document_Element_Disable(action, "style-disabled"); 
  }
 }
 
 
 // EMPTY CHART
 var chart                = Course_Class_DisplayChart([], state);
 var element              = UI_Element_Find(row, "row-chart");
 Document_Element_Disable(element, "style-disabled");
 element.appendChild(chart);
  
  
 return row;
}




function Course_Class_ActivityPresentation(data, state, source)
{
 var row        = UI_Element_Create("course/class-row-content");
 
 var lesson_id  = Safe_Get(data, ["lesson", "source"]);
 var path       = "content/lessons/" + lesson_id + "/" + source;
 
 // COVER PICTURE
 var element       = UI_Element_Find(row, "cover");
 var url           = Resources_URL("images/cover-presentation.jpg");
 Document_Image_Load(element, [url]);
  
 // COVER CAPTION
 var element       = UI_Element_Find(row, "caption");
 element.innerHTML = UI_Language_String("course/activities", "presentation");
  
  
 // ACTIONS
 var actions = UI_Element_Find(row, "actions");
  
 // ACCESS THE PRESENTATION
 var icon   = Core_Data_Value("course/activities", "presentation", "icon");
 icon       = "<li class = 'fa fa-" + icon + "'></li>";
 
 var text   = icon + "&nbsp;&nbsp;&nbsp;" + UI_Language_String("course/activities", "presentation activity review");
 var path   = "content/lessons/" + lesson_id + "/presentation";
 var action = Course_Class_DisplayAction(actions, text, "test", state, path, "nocontent", {fastexit:true});
 
 // ENABLE ONLY AFTER LESSON
 if(User_Role() == "student" && state == "pre") Document_Element_Disable(action, "style-disabled"); 
  
  
 // EMPTY CHART
 var chart                = Course_Class_DisplayChart([], state);
 var element              = UI_Element_Find(row, "row-chart");
 Document_Element_Disable(element, "style-disabled");
 element.appendChild(chart);
  
  
 return row;
}





function Course_Class_ActivityBookpage(data, state, source)
{
 var row        = UI_Element_Create("course/class-row-content");
 
 var lesson_id  = Safe_Get(data, ["lesson", "source"]);
 var path       = "content/lessons/" + lesson_id + "/" + source;
 

 // COVER PICTURE
 var element       = UI_Element_Find(row, "cover");
 var url           = Resources_URL("images/cover-coursebook.png");
 Document_Image_Load(element, [url]);
  
 // COVER CAPTION
 var element       = UI_Element_Find(row, "caption");
 element.innerHTML = UI_Language_String("course/activities", "bookpage");
  
  
 // ACTIONS
 var actions = UI_Element_Find(row, "actions");
  
 // THIS CONFIGURATION WILL BE PASSED ALL THE WAY TO ACTIVITY_RUN FIRST AND BOOKPAGE RENDERER LATER
 var config =
 {
  fastexit : true,
  popup    : "transparent",
  scale    : true,
  shadow   : true
 }
  
 // ACCESS COURSEBOOK
 var icon   = Core_Data_Value("course/activities", "bookpage", "icon");
 icon       = "<li class = 'fa fa-" + icon + "'></li>";
 
 var text   = icon + "&nbsp;&nbsp;&nbsp;" + UI_Language_String("course/activities", "bookpage activity read");
 var path   = "content/lessons/" + lesson_id + "/bookpage";
 var action = Course_Class_DisplayAction(actions, text, "test", state, path, "nocontent", config);
 //if(User_Role() == "student" && state == "pre") Document_Element_Disable(action, "style-disabled"); 
 
 
 // EMPTY CHART
 var chart                = Course_Class_DisplayChart([], state);
 var element              = UI_Element_Find(row, "row-chart");
 Document_Element_Disable(element, "style-disabled");
 element.appendChild(chart);
  
  
 return row;
}