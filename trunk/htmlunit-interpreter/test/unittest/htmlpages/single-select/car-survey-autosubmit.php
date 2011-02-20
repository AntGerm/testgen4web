<?php
$carSelected = "";
if (isset($_POST["mycar"])) {
    $carSelected = $_POST["mycar"];
}
?>
<html>
    <head>
        <title>Car survey <?php echo $carSelected ?></title>
    </head>
    <body>
        Selected: <?php echo $carSelected ?><br/>
        Take the survey:
        <form method="post" action="car-survey-autosubmit.php">
        <select name="mycar" onchange="JavaScript:submit();">
            <option value="--">--Select--</option>
            <option value="audi">Audi</option>
            <option value="bmw">BMW</option>
            <option value="merc">Mercedes</option>
            <option value="mit">Misubishi</option>
        </select>
        </form>
    </body>
</html>
