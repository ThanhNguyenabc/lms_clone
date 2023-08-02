// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      R E S O U R C E S                                         //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//



async function Editor_Presentation_AddResources()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
	
 var files   = await Storage_File_Select({multiple:true});
 var current = Core_State_Get("editor", ["presentation", "resources"], []);
 
 await Editor_Resources_Upload(files, current);
 
 var container = UI_Element_Find(submodule, "slide-panels-panels");
 Editor_Presentation_UpdateControls(container);
 
 var container = UI_Element_Find(submodule, "resources-list"); 
 Editor_Resources_Display(current, container);
}




async function Editor_Presentation_DropResources(files)
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
 
	
 var slide   = Core_State_Get("editor", ["selected-slide"], {}); 
 var current = Core_State_Get("editor", ["presentation", "resources"], []);
 var dropped = await Editor_Resources_Upload(files, current);
 
 var offset  = 16;
 for(var file of dropped)
 {
  Editor_Presentation_ElementFromResource(file["name"], offset, offset);
  
  offset = offset + 16;
 } 
 
 Editor_Presentation_SaveSlide(slide, true);
 
 var container = UI_Element_Find(submodule, "slide-panels-panels");
 Editor_Presentation_UpdateControls(container);
 
 Editor_Presentation_ListResources();
}





function Editor_Presentation_ListResources()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
	
 var container = UI_Element_Find(submodule, "resources-list");
 var list      = Core_State_Get("editor", ["presentation", "resources"], []);
 
 Editor_Resources_Display(list, container);
}








function Editor_Presentation_InsertResource()
{
 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();
	
 var container     = UI_Element_Find(submodule, "resources-list");
  
 var option = Document_Select_SelectedOption(container);
 if(!option) return;
  
 var file = option.value;
 
 var element = Editor_Presentation_ElementFromResource(file, 16, 16);
 
 console.log(element);
}





function Editor_Presentation_ElementFromResource(resource, x, y)
{
 var element = false;
 var type    = Media_Info_Type(resource);
  
 switch(type)
 {
  case "image":
	var element = Editor_Presentation_NewElement("image", false, {src:resource});
   
	element.style.left = x; 
	element.style.top  = y;
  break;
   
  case "video":
	var element = Editor_Presentation_NewElement("video", false, {src:resource});
   
	element.style.left = x; 
	element.style.top  = y; 
  break;
 }
 
 return element;
}




async function Editor_Presentation_PasteText(item)
{
 console.log(item);
}




async function Editor_Presentation_PasteResource(item)
{ 
 // GET PASTED IMAGE AS VIRTUAL FILE
 var file              = item.getAsFile();
 
 
 //var image        = await Document_Image_FromFile(file);
 //var transparency = Document_Image_HasTransparency(image);
 //console.log(transparency);
 //return; 
 file["override-type"] = "image/jpeg"; 


 var title     = UI_Language_String("editor", "popup name title");
 var subtitle  = UI_Language_String("editor", "popup name subtitle");
 var picture   = await Storage_File_Read(file, {whole:true});
 var name      = await UI_Popup_Input(title, subtitle, picture);
 if(!name)name = "image";
 file["override-name"] = name + ".jpg";
 
 
 var current = Core_State_Get("editor", ["presentation", "resources"], []);
 var added   = await Editor_Resources_Upload([file], current);
 var source  = added[0];


 // GET SUBMODULE BODY
 var submodule = Module_Page_Body();

 
 // SWITCH TO RESOURCES PANEL
 var header = UI_Element_Find(submodule, "presentation-selector");
 UI_Header_Set(header, "resources", true);
 
 
 // UPDATE RESOURCES AND SELECT THE PASTED ONE
 var list = UI_Element_Find(submodule, "resources-list");
 
 Editor_Presentation_ListResources();
 Document_Select_SelectByValue(list, source);
 list.click();
}