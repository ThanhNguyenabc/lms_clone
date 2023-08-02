function Debug_Elements_Outline()
{
 var elements = Document_Element_Children(document.body, true);
 
 for(var element of elements) 
 { 
  element.style.outline = "1px solid rgba(1, 0, 1, 0.5)"; 
  element.style.outlineOffset = -1;
 }
}
