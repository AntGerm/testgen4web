<?xml version="1.0" encoding="ISO-8859-1"?>
<!--
Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
Licensed under the Open Software License version 2.1

(See http://www.spikesource.com/license/oslicense.html)

author: Vinay Srini (vsrini@spikesource.com)
-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:param name="curtime"/>
    <xsl:template match="/">
        <html>
            <head>
                <link rel="stylesheet" type="text/css" href="default.css"/>
                <title>Summary</title>
            </head>
            <body>
                <h1>HtmlUnit Interpreter Results</h1>
                <h4>Report generated at: <xsl:value-of select="$curtime"/></h4>
                <table class="mainsummary">
                    <tr>
                        <th>Total Run</th>
                        <th>Pass</th>
                        <th>Fail</th>
                        <th>Total Error</th>
                        <th>Percentage Pass</th>
                    </tr>
                    <tr>
                        <td><xsl:value-of select="count(/tests/test)"/></td>
                        <td>-</td>
                        <td>-</td>
                        <td><xsl:value-of select="count(//log[@type = 'ERROR' or @type = 'FATAL'])"/></td>
                        <td>-</td>
                    </tr>
                </table>
                <br/>
                <table class="testsummary">
                    <tr>
                        <th>Test Name</th>
                        <th>Total Actions</th>
                        <th>Actions Run</th>
                        <th>Error count</th>
                        <th>Farthest Run %</th>
                    </tr>
                    <xsl:for-each select="/tests/test">
                        <xsl:variable name="shortfilename">
                            <xsl:call-template name="substring-after-last">
                                <xsl:with-param name="input" select="@name"/>
                                <xsl:with-param name="marker" select="'/'"/>
                            </xsl:call-template>
                        </xsl:variable>
                        <tr>
                            <xsl:variable name="errorCount"
                                select="count(.//log[@type = 'FATAL' or @type='ERROR'])"/>
                            <xsl:if test="$errorCount &gt; 0 or ./action-count/@num &gt; count(step)">
                                <xsl:attribute name="class">error</xsl:attribute>
                            </xsl:if>
                            <td><a href="{$shortfilename}.html"><xsl:value-of select="$shortfilename"/></a></td>
                            <td><xsl:value-of select="./action-count/@num"/></td>
                            <td><xsl:value-of select="count(step)"/></td>
                            <td><xsl:value-of select="$errorCount"/></td>
                            <td><xsl:value-of select="format-number(count(step) div ./action-count/@num * 100,   '#,##0.00')"/>%</td>
                        </tr>
                    </xsl:for-each>
                </table>
                <div class="footer">TestGen4Web - HtmlUnitRunner. &#169; SpikeSource 2004-2006.</div>
            </body>
        </html>
    </xsl:template>

    <xsl:template name="substring-after-last">
        <xsl:param name="input" />
        <xsl:param name="marker" />
        <xsl:choose>
            <xsl:when test="contains($input,$marker)">
                <xsl:call-template name="substring-after-last">
                    <xsl:with-param name="input" 
                        select="substring-after($input,$marker)" />
                    <xsl:with-param name="marker" select="$marker" />
                </xsl:call-template>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$input" />
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
</xsl:stylesheet>

