<?xml version="1.0" encoding="ISO-8859-1"?>
<!--
Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
Licensed under the Open Software License version 2.1

(See http://www.spikesource.com/license/oslicense.html)

author: Vinay Srini (vsrini@spikesource.com)
-->

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:param name="format"/>
    <xsl:template match="/">
        <xsl:if test="$format = 'html'">
            <html>
                <head>
                    <link rel="stylesheet" type="text/css" href="default.css"/>
                </head>
                <body>
                    <table width="100%">
                        <tr><td><a target="result" href="summary.html">Overall</a></td></tr>
                        <tr><td>&#160;</td></tr>
                        <xsl:for-each select="/tests/test">
                            <xsl:variable name="shortfilename">
                                <xsl:call-template name="substring-after-last">
                                    <xsl:with-param name="input" select="@name"/>
                                    <xsl:with-param name="marker" select="'/'"/>
                                </xsl:call-template>
                            </xsl:variable>
                            <tr><td>
                                    <xsl:variable name="errorCount"
                                        select="count(.//log[@type = 'FATAL' or @type='ERROR'])"/>
                                    <xsl:if test="$errorCount &gt; 0 or ./action-count/@num &gt; count(step)">
                                        <xsl:attribute name="class">error</xsl:attribute>
                                    </xsl:if>

                                    <a target="result" href="{$shortfilename}.html">
                                        <xsl:value-of select="$shortfilename"/>
                                    </a>
                            </td></tr>
                        </xsl:for-each>
                    </table>
                </body>
            </html>
        </xsl:if>
        <xsl:if test="$format = 'list'">
            <xsl:for-each select="/tests/test">
<xsl:value-of select="@name"/><xsl:text> </xsl:text>
            </xsl:for-each>
        </xsl:if>
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

