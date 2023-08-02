<?PHP

function Client_PublishVar($name, &$data, $local = false)
{
 $json = json_encode($data);
 
 if($local)
 {
  echo "var $name = $json;";
 }
 else
 {
  echo "<script>var $name = $json;</script>";
 }
}


// 1. LOAD PARTNER CONFIGURATION	
$config = file_get_contents("application/data/" . $_SESSION["partner"] . ".cfg");
$config = json_decode($config, true);

Client_PublishVar("application_config", $config);
$_SESSION["config"] = $config;


// 2. LOAD HTML
$html = file_get_contents("application/data/html.dat");
$html = json_decode($html, true);

Client_PublishVar("application_html", $html);


// 3. LOAD DATA FILES
$data = file_get_contents("application/data/data.dat");
$data = json_decode($data, true);

Client_PublishVar("application_data", $data);


// 4. INCLUDE CSS
$css = file_get_contents("application/data/client.css");
echo "<link rel='stylesheet' href='application/data/client.css'/>";


// 5. OUTPUT JAVASCRIPT
$js  = file_get_contents("application/data/client.js");
echo "<script>$js</script>";
	

?>