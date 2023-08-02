// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      B O O K   P A G E                                         //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

var BOOKPAGE_EXTRAS     = ["lesson-id", "title", "vocabulary", "dialogue", "dialogue-title"];


async function Bookpage_Read(source)
{
 var bookpage = await Core_Api("Bookpage_Read", {source});

 var config   = Core_Data_Page("bookpage/template");
 var template = Data_Page_FromConfig(config);
 var bookpage = Data_Page_Complete(bookpage, template, true);
 
 return bookpage;
}





async function Bookpage_Display(bookpage, container, extras = {}, options = {scale:true})
{
 var rendered = await Bookpage_Render(bookpage, extras, options);
 
 container.innerHTML = "";
 container.appendChild(rendered);
 
 if(options["scale"])
 {
  Document_Element_FitContent(container, 0.01, true);
 }
  
 Bookpage_Adjust(rendered);
 
 return rendered;
}





function Bookpage_Adjust(container)
{
 for(var id of BOOKPAGE_EXTRAS)
 {
  var section = UI_Element_Find(container, id);
  
  if(section)
  {
   var element = section.firstElementChild;
   if(element) Document_Element_FitContent(element);
  }
 }
}




async function Bookpage_Render(bookpage, extras = {}, options = {layout:false})
{ 
 // CREATE PAGE BASED ON TEMPLATE
 var template = Safe_Get(bookpage, ["page", "template"], "standard"); console.log(template);
 var page     = await Request_Load("content/templates/bookpages/" + template + ".html" + "?c=" + Date.now(), "text"); 
 
 
 // COVER PICTURE
 var cover = extras["cover"] || "";
 page      = String_Variables_Set(page, {cover});
 
 
 // LESSON TYPE (SHOWN IN "CONTENT" PARAGRAPH)
 var type  = extras["type"] || "";
 page      = String_Variables_Set(page, {type});
 
 
 //var page     = Document_Element_Create(html);
 
 
 // POPULATE PAGE
 
 var paragraphs = [];
 
 // PARAGRAPHS HTML
 for(var id in bookpage)
 {
  if(id != "page")
  {
   var template   = bookpage[id]["template"] || "standard";
   var html       = await Request_Load("content/templates/paragraphs/" + template + ".html" + "?c=" + Date.now(), "text");
   
   // HACK: MARK THE PARAGRAPH'S HTML
   html = html.replace("<div", "<div data-component = 'paragraph' ");
   
   // APPLY TEXT
   var text = {};
   var list = Safe_Get(bookpage, [id, "texts"], []);
   
   for(var n = 1; n <=6; n++)
   {
	var block = list[n] || "";
	block     = block.replaceAll("\r\n", "<br>");
    block     = block.replaceAll("\n",   "<br>"); 
	
	if(block)
	{
     text["text-" + n] = block;
	}
	else
	{
     text["text-" + n] = "";
	}
   }  
   //console.log(text);

   html = String_Variables_Set(html, text);
   
   
   // APPLY TITLE AND SUBTITLE
   var text = {};
   for(var field of ["title", "subtitle"])
   {
    text[field] = Safe_Get(bookpage, [id, field], "");
   }
   
   html = String_Variables_Set(html, text);
   
   
   // APPLY PICTURES
   var pictures = {};
   var list     = Safe_Get(bookpage, [id, "pictures"], []);
   
   for(var n = 1; n <=6; n++)
   {
	var picture = list[n];
	if(picture)
	{
     pictures["picture-" + n] = picture;
	}
	else
	{
     pictures["picture-" + n] = "";
	}
   }
   
   html = String_Variables_Set(html, pictures);
   
   
   // CONFIRM PARAGRAPH
   paragraphs[id] = html;
  }
 }
 

 

 // INJECT PARAGRAPHS 
 var ids = Core_Data_Value("bookpage/paragraphs", "info", "paragraphs").split(",");
 page     = String_Variables_Set(page, paragraphs);
 /*
 for(var id of ids) 
 {
  var html    = paragraphs[id] || "";
  var element = UI_Element_Find(page, id);
  
  page        = String_Variables_Set(html, {type});
  
  if(element) element.innerHTML = html;
 }
 */
 
 // INJECT EXTRAS
 for(var id of BOOKPAGE_EXTRAS) if(!extras[id]) extras[id] = UI_Element_Component("editor/bookpage-placeholder-" + id); 
 page     = String_Variables_Set(page, extras);

 /*
 {
  var html    = extras[id] || UI_Element_Component("editor/bookpage-placeholder-" + id);
  var element = UI_Element_Find(page, id);
  
  if(element) element.innerHTML = html;
 }
 */

 
 // CREATE PAGE
 var page     = Document_Element_Create(page);
 
 // VISUALIZE LAYOUT IF OPTION SET
 if(options["layout"])
 { 
  var columns  = Document_Element_Children(page, false);

  for(var column of columns)
  {
   var elements = Document_Element_Children(column, false);
   for(var element of elements)
   {
    if(element.nodeName == "DIV")
    {
     element.style.outline = "6px dashed red";

     var components = Document_Element_Children(element, true);
     for(var component of components)
     {
      if(["DIV", "IMG"].includes(component.nodeName))
      {
       component.style.outline = "3px dashed blue";
      }
     }
    }
   }
  }
 }
 
 
 // SHADOW (RAISED) PAGES
 if(options["shadow"]) Document_CSS_SetClass(page, "shadow-sharp-bottom");
 
 return page; 
}
