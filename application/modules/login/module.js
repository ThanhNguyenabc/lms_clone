// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          L O G I N                                             //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Login_OnLoad(module, data)
{
 // LOGO
 var image   = UI_Element_Find(module, "logo");
 var source  = Resources_URL("images/login-logo.png", "partner");
 Document_Image_Load(image, [source]);
 
 // BACKGROUND
 var video = UI_Element_Find(module, "background-video");
 video.src = Resources_URL("video/login-loop.mp4", "partner");
 
 // SETUP LOGIN BUTTON
 var button       = UI_Element_Find(module, "button-login");
 button.innerHTML = UI_Language_String("login", "login button text");
 button.onclick   = Login_Login;
 
 // SETUP SSO LOGIN BUTTON
  var container = UI_Element_Find(module, "button");
  var text    = UI_Language_String("login", "ssologin button text");
  let element = UI_Element_Create("login/button-ssologin-plain", {text:text});
  
  // MENU ITEM ID
  Document_Element_SetData(element, "uid", "button-ssologin");
  
  // MENU ITEM ICON
  var sources = [];
  var icon    = UI_Element_Find(element, "icon");
  var image   = Module_Data("login", "ssologin button text", "ssologin-icon");
  sources.push(Resources_URL("images/" + image) + ".png");
  
  Document_Image_Load(icon, sources);
  
  //Document_Element_SetData(element, "module", item);
  element.onclick           = Login_SSOLogin;  
  //element.style.visibility  = "hidden";
  container.appendChild(element);
 
 // SETUP FIELDS TO SUBMIT LOGIN EVENT ON ENTER KEY PRESSED
 Document_Handler_EnterKey(UI_Element_Find(module, "username"), Login_Login);
 Document_Handler_EnterKey(UI_Element_Find(module, "password"), Login_Login);
}




async function Login_OnShow(module, data)
{
 // LOGO
 var logo  = UI_Element_Find(module, "logo");
 var login = UI_Element_Find(module, "login");
 
 UI_Element_Find("background-video").play()
 
 await Document_Element_Animate(logo,  "fadeInUp 1.5s ease-out 1");
 
 Document_Element_Show(login);
 Document_Element_Animate(login, "fadeIn 0.5s linear 1");
}




async function Login_OnUnload()
{
}







// -----------------------------------------------------------------------------------------------//
//                                                                                                //
//                                          M O R E                                               //
//                                                                                                //
// -----------------------------------------------------------------------------------------------//

async function Login_Login()
{
 var login    = UI_Element_Find("login");
 var username = UI_Element_Find("username");
 var password = UI_Element_Find("password");
 
 var response = await Core_Api("Core_Login", {user_id:username.value, password:password.value});
 
 if((typeof response == "object") && (response["id"]))
 {
  // ANIMATE DISAPPEARANCE
  var box = UI_Element_Find("box-main");
  
  await Document_Element_Animate(box, "fadeOutUp 1.75s ease-out 1 normal forwards");
  await Module_Load("main", document.body);
  await Module_Load("home");
 }
 else
 {
  Document_Element_Animate(login, "headShake 0.75s linear 1");
 }
 
}

async function Login_SSOLogin()
{
  window.location.href = "ssologin.php?goauth=y&crossUser=google";
}