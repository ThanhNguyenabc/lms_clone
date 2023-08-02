// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                         I N P U T                                              // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

var input = {};









// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      K E Y B O A R D                                           // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

const KEY_BACKSP = 8;
const KEY_DEL    = 46;
const KEY_ESC    = 27;
const KEY_END    = 35;
const KEY_PGUP   = 33;
const KEY_PGDN   = 34;
const KEY_LSHIFT = 16;
const KEY_LALT   = 18;
const KEY_LEFT   = 37;
const KEY_RIGHT  = 39;
const KEY_UP     = 38;
const KEY_DOWN   = 40;
const KEY_PLUS   = 107;
const KEY_MINUS  = 109;
const KEY_LCTRL  = 17;
const KEY_RCTRL  = 17;


input["keyboard"]             = {};
input["keyboard"]["keys"]     = {};
input["keyboard"]["codes"]    = {};




function Input_Keyboard_Assign(element, onupdate)
{
 input["keyboard"]["controller"]  = element;
 input["keyboard"]["onupdate"]    = onupdate;
 
 input["keyboard"]["controller"].onkeydown = Input_Keyboard_Down;
 input["keyboard"]["controller"].onkeyup   = Input_Keyboard_Up;
 
 /*
 window.addEventListener("keydown", Input_Keyboard_Down, true);
 window.addEventListener("keyup",   Input_Keyboard_Up,   true);
 */
}



function Input_Keyboard_Release()
{
 if(!input["keyboard"]["controller"]) return;
	 
 input["keyboard"]["controller"].onkeydown = false;
 input["keyboard"]["controller"].onkeyup   = false;
 
 input["keyboard"]["controller"]  = false;
 input["keyboard"]["onupdate"]    = false;
}




function Input_Keyboard_Lock()
{
 input["keyboard"]["locked"] = true;
}




function Input_Keyboard_Unlock()
{
 input["keyboard"]["locked"] = false;
}




function Input_Keyboard_Update()
{
 if(input["keyboard"]["onupdate"]) 
 {
  input["keyboard"]["onupdate"]();
 }
}





function Input_Keyboard_Down(event)
{
 if(input["keyboard"]["locked"]) return;
 
 input["keyboard"]["keys"][String.fromCharCode(event.keyCode)] = true;
 input["keyboard"]["codes"][event.keyCode]                     = true;
 
 Input_Keyboard_Update();
}





function Input_Keyboard_Up(event)
{
 if(input["keyboard"]["locked"]) return;
 
 delete input["keyboard"]["keys"][String.fromCharCode(event.keyCode)];
 delete input["keyboard"]["codes"][event.keyCode];
 
 Input_Keyboard_Update();
}





function Input_Keyboard_Pressed(key, codes)
{
 if(codes) for(var code of codes) if(!input["keyboard"]["codes"][code]) return false;
 
 if(key && !input["keyboard"]["keys"][key]) return false;
 
 return true;
}






function Input_Keyboard_Reset()
{
 input["keyboard"]["keys"]  = {};
 input["keyboard"]["codes"] = {};
}






// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                           M O U S E                                            // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//




function Input_Mouse_Bind(element, onmousemove, onmouseup, onmousedown, onwheel)
{
 // MOUSE MOVE
 element.onmousemove = 
 function(event)
 {
  var element = event.currentTarget;
  if(!element) return;
  
  var rect   = element.getBoundingClientRect();
  var x      = event.clientX - rect.left;
  var y      = event.clientY - rect.top;
 
  var dx = x - parseInt(element.getAttribute("lastx") || 0);
  var dy = y - parseInt(element.getAttribute("lasty") || 0);
 
  element.setAttribute("lastx", x)
  element.setAttribute("lasty", y)
  
  var button = element.getAttribute("button");
 
  if(onmousemove) onmousemove(dx, dy, button);
 }


 // MOUSE DOWN 
 element.onmousedown = 
 function(event)
 {
  var element = event.currentTarget;
  if(!element) return;
  
  element.setAttribute("mousedown", true);
  element.setAttribute("button",    event.button);
  
  if(onmousedown) onmousedown(element);
 }
 
 
 // MOUSE UP
 element.onmouseup = 
 function(event)
 {
  var element = event.currentTarget;
  if(!element) return;
  
  element.setAttribute("mousedown", false);
  element.setAttribute("button",    false);

  if(onmouseup) onmouseup(element);
 }
 
}








// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                           T O U C H                                            // 
//                                                                                                //
// -----------------------------------------------------------------------------------------------//


function Input_Touch_Handler(event)
{
 var touches = event.changedTouches;
 var first   = touches[0];
 var type    = "";
 
 switch(event.type)
 {
  case 
	"touchstart": 
		type = "mousedown"; 
	break;
        
	case "touchmove":  
		type = "mousemove"; 
	break;        
        
	case "touchend":   
		type = "mouseup";   
	break;
    
	default:           
	return;
 }

 // initMouseEvent(type, canBubble, cancelable, view, clickCount, 
 //                screenX, screenY, clientX, clientY, ctrlKey, 
 //                altKey, shiftKey, metaKey, button, relatedTarget);

 var simulatedEvent = document.createEvent("MouseEvent");
 
 simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0/*left*/, null);

 first.target.dispatchEvent(simulatedEvent);
 event.preventDefault();
}





function Input_Touch_Remap(element) 
{
 if(!element) var element = document;
 
 element.addEventListener("touchstart",  Input_Touch_Handler, true);
 element.addEventListener("touchmove",   Input_Touch_Handler, true);
 element.addEventListener("touchend",    Input_Touch_Handler, true);
 element.addEventListener("touchcancel", Input_Touch_Handler, true);    
}





function Input_Touch_Unmap(element)
{
 if(!element) var element = document;
 
 element.removeEventListener("touchstart",  Input_Touch_Handler, true);
 element.removeEventListener("touchmove",   Input_Touch_Handler, true);
 element.removeEventListener("touchend",    Input_Touch_Handler, true);
 element.removeEventListener("touchcancel", Input_Touch_Handler, true);    
}