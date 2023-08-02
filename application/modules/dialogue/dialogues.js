async function Dialogue_Read(source)
{
 var dialogue = await Core_Api("Dialogue_Read", {source});
 
 return dialogue;
}




async function Dialogue_Display(dialogue, template = "standard", language = "en")
{
 if(typeof dialogue == "string")
 {
  var dialogue = await Dialogue_Read(dialogue);
 }	 
	
	
 var display   = UI_Element_Create("dialogue/display-" + template);
 var container = UI_Element_Find(display, "lines") || display;
 
 
 var lines = Safe_Get(dialogue, "lines", []) || [];
 for(var line of lines)
 {
  var character = line["character"];
  var text      = UI_Language_Object(line);
  var row       = UI_Element_Create("dialogue/line", {character, text});
  
  var picture   = UI_Element_Find(row, "portrait");
  var portrait  = Resources_URL("characters/" + character + "/portrait.png", "content");
  var def       = Resources_URL("images/default/propic-generic.png");
  Document_Image_Load(picture, [portrait, def]);
  
  container.appendChild(row);
 }
 
 return display;
}