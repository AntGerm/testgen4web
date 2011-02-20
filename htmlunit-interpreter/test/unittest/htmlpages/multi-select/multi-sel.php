<?php
$colors = "";
if (isset($_POST['colors'])) {
    foreach ($_POST['colors'] as $c) {
        $colors = $colors . $c;
    }
}
?>
<html>
    <head>
        <title>Car survey <?php echo $colors ?></title>
        <script>
        function showvalues(elem) {
            if (elem.type == "select-multiple") {
                var value = "";
                for (var i = 0; i < elem.options.length; i++) {
                    if (elem.options[i].selected) {
                        var tmp = elem.options[i].value;
                        tmp = escape(tmp);
                        if (value != "") {
                            value = value + "," + tmp;
                        } else {
                            value = tmp;
                        }
                    }
                }
                alert(value);
                decode(value);
            } else {
                alert(elem.value);
            }
        }

        function decode(value) {
            tmp = value.split(/,/g);
            for (var i = 0; i < tmp.length; i++) {
                alert(value + "\n" + unescape(tmp[i]));
            }
        }
        </script>
    </head>
    <body>
        Selected: <?php echo $colors ?><br/>
        Take the survey, enter your favorite colors:
        <br/>
        <form method="post" action="multi-sel.php">
            <select name="colors[]" multiple ><!-- onchange="showvalues(this);" -->
                <option value="blue">Blue</option>
                <option value="gr,,een">Green</option>
                <option value="orange">Orange</option>
                <option value="ye,ll,ow">Yellow</option>
                <option value="red">Red</option>
                <option value="indigo">Indigo</option>
            </select><br/>
            <input type="submit" value="These are my choices !"/>
        </form>
    </body>
</html>
