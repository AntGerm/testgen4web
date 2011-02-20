<?php
    $term = "Nothing";
    if (isset($_GET["q"])) {
        $term = $_GET["q"];
    }
    ?>
    <html>
        <head>
            <title><?php echo "You searched for ".$term."!";?></title>
        </head>
        <body>
            <h4><?php echo "You searched for ".$term."!";?></h4>
            <form>
                <input type="text" name="q"/>
                <input type="submit" value="Submit"/>
            </form>
        </body>
    </html> 
    
