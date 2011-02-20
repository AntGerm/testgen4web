package com.spike.tg4w.htmlunit;

import javax.swing.*;
import javax.swing.event.*;
import java.awt.*;
import java.awt.event.*;
import java.net.*;
import java.io.*;
import java.util.*;

public class HTMLView extends JFrame implements ActionListener {
    private JEditorPane htmlPane;
    JButton backButton = new JButton("Back");
    JButton forwardButton = new JButton("Forward");
    JLabel filenameLabel = new JLabel("Filename");

    java.util.List urls = new LinkedList();
    int currentIndex = -1;

    private void addUrl(String url) {
        urls.add(url);
    }

	public void actionPerformed(ActionEvent e) {
        try {
            if (e.getActionCommand().equals("Back")) {
                updateUI(currentIndex - 1);
            } else if (e.getActionCommand().equals("Forward")) {
                updateUI(currentIndex + 1);
            }
        } catch (IOException ex) {
            ex.printStackTrace();
        }
    }

    private void updateUI(int newindex) throws IOException {
        currentIndex = newindex;

        backButton.setEnabled(currentIndex != 0);
        forwardButton.setEnabled(currentIndex != (urls.size() - 1));

        String newurl = getUrl(newindex);
        filenameLabel.setText(newurl);
        htmlPane.setPage(newurl);
    }

    private String getUrl(int index) {
        return (String) urls.get(index);
    }

    public HTMLView() {
        super("Simple Swing HTMLView");

        JPanel topPanel = new JPanel();
        topPanel.setBackground(Color.lightGray);
        topPanel.setAlignmentX(topPanel.LEFT_ALIGNMENT);
        getContentPane().add(topPanel, BorderLayout.NORTH);

        htmlPane = new JEditorPane();
        htmlPane.setEditable(false);
        JScrollPane scrollPane = new JScrollPane(htmlPane);
        topPanel.add(backButton);
        topPanel.add(forwardButton);
        topPanel.add(filenameLabel);
        backButton.addActionListener(this);
        forwardButton.addActionListener(this);

        getContentPane().add(topPanel, BorderLayout.NORTH);
        getContentPane().add(scrollPane, BorderLayout.CENTER);

        Dimension screenSize = getToolkit().getScreenSize();
        int width = screenSize.width * 8 / 10;
        int height = screenSize.height * 8 / 10;
        setBounds(width/8, height/8, width, height);
        setVisible(true);
    }

    public void changeUrl(String newurl) {
        try {
            addUrl(newurl);
            this.currentIndex ++;
            updateUI(this.currentIndex);
        } catch(IOException ioe) {
            warnUser("Can't follow link to " + newurl + ": " + ioe);
        }
    }

    private void warnUser(String message) {
        JOptionPane.showMessageDialog(this, message, "Error", 
                JOptionPane.ERROR_MESSAGE);
    }
}
