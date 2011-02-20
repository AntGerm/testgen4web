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
        <form method="post" action="car-survey.php">
        <select name="mycar">
            <option value="--">--Select--</option>
            <option value="audi">Audi</option>
            <option value="bmw">BMW</option>
            <option value="merc">Mercedes</option>
            <option value="mit">Misubishi</option>
        </select>
        <input type="submit" value="That's my car"/>
        </form>
    </body>
</html>
