<html>
    <head>
        <script>
        var count = 0;
        function add() {
            var dup = $("test");
            var cloned = dup.cloneNode(true);
            var form = $("f1");

            cloned.removeAttribute("id");
            form.appendChild(cloned);

            var count = document.getElementsByTagName("INPUT").length;

            var input = cloned.getElementsByTagName("INPUT")[0];
            input.setAttribute("name", "test" + (++count));
        }

        function $(id) {
            return document.getElementById(id);
        }
        </script>
    </head>
<body>
    <form id="f1" name="f1">
        <input type="button" value="Add" onclick="add();"/>
        <div id="test">
            <input type="text" name="test0"/>
        </div>
    </form>
</body>
</html>
