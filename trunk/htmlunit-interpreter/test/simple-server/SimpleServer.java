import simple.http.*;
import simple.http.connect.*;
import simple.http.serve.*;
import simple.http.load.*;
import java.net.*;
import java.util.*;
import java.io.*;

public class SimpleServer implements ProtocolHandler {
    private String basePath;
    private String phpExec;

    public SimpleServer(String phpExec, String basePath) {
        this.phpExec = phpExec;
        this.basePath = basePath;
    }

    public void handle(Request req, Response resp) {
        System.out.println("Request:" + req.getPath().getPath());

        resp.set("Server", "DemoServer/1.0 (Simple)");
        resp.setDate("Date", System.currentTimeMillis());
        resp.setDate("Last-Modified", System.currentTimeMillis());
        resp.set("Content-Type", "text/html");

        FileReader reader = null;
        PrintStream stream = null;
        try {
            File file = new File(this.basePath, req.getPath().getPath());
            stream = resp.getPrintStream();

            if (file.exists() && !file.isDirectory()) {
                if (file.getName().endsWith(".php")) {
                    File varsFile = File.createTempFile("simple-server-", ".php");
                    FileWriter writer = new FileWriter(varsFile);
                    Iterator paramNames = req.getParameters().keySet().iterator();
                    writer.write("<?php\n");
                    writer.write("$_GET= array();\n");
                    writer.write("$_POST= array();\n");
                    while (paramNames.hasNext()) {
                        String key = (String) paramNames.next();
                        String value = (String) req.getParameter(key);

                        key = key.replace("'", "\\'");
                        value = value.replace("'", "\\'");

                        writer.write("$_GET['" + key + "']='" + value + "';\n");
                        writer.write("$_POST['" + key + "']='" + value + "';\n");
                    }
                    writer.write("?>");
                    writer.close();

                    List<String> command = new ArrayList<String>();
                    command.add(this.phpExec);
                    command.add("test/unittest/htmlpages/wrap.php");
                    command.add(varsFile.getAbsolutePath());
                    command.add(req.getPath().getPath().substring(1));

                    System.out.println("Running cmd:");
                    for (String cmd: command) {
                        System.out.print(cmd + " ");
                    }
                    System.out.println("");

                    ProcessBuilder builder = new ProcessBuilder(command);
                    Map<String, String> environ = builder.environment();

                    builder.directory(new File(this.basePath));

                    final java.lang.Process process = builder.start();
                    InputStream is = process.getInputStream();
                    InputStream es = process.getErrorStream();

                    InputStreamReader isr = new InputStreamReader(is);
                    BufferedReader br = new BufferedReader(isr);
                    String line;
                    while ((line = br.readLine()) != null) {
                        stream.println(line);
                    }

                    isr = new InputStreamReader(es);
                    br = new BufferedReader(isr);
                    while ((line = br.readLine()) != null) {
                        stream.println(line);
                    }
                    varsFile.delete();
                } else {
                    reader = new FileReader(file);
                    BufferedReader breader = new BufferedReader(reader);
                    String line = breader.readLine();
                    while (line != null) {
                        stream.println(line);
                        line = breader.readLine();
                    }
                }
            } else if (file.isDirectory()) {
                stream.println("directory listing!<br/>");
                for (File f: file.listFiles()) {
                    stream.println("<a href='" + f.getAbsolutePath().substring(this.basePath.length() - 1) + "'>" + f.getName()+ "</a><br/>");
                }
            } else {
                stream.println("404. not found!");
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (reader != null) { 
                    reader.close(); 
                } 
                if (stream != null) { 
                    stream.close(); 
                } 
                resp.commit();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        if (req.getPath().getPath().equals("/stop-server")) {
            System.exit(0);
        }
    }

    public static void main(String[] list) throws Exception {
        SimpleServer handler = new SimpleServer(list[0], list[1]);
        Connection connection = ConnectionFactory.getConnection(handler);
        connection.connect(new ServerSocket(Integer.parseInt(list[2])));
    }
}

