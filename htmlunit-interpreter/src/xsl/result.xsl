<?xml version="1.0" encoding="ISO-8859-1"?>
<!--
Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
Licensed under the Open Software License version 2.1

(See http://www.spikesource.com/license/oslicense.html)

author: Vinay Srini (vsrini@spikesource.com)
-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:param name="filename"/>
    <xsl:template match="/">
        <xsl:variable name="shortname">
            <xsl:call-template name="substring-after-last">
                <xsl:with-param name="input" select="$filename"/>
                <xsl:with-param name="marker" select="'/'"/>
            </xsl:call-template>
        </xsl:variable>

        <html>
            <head>
                <link rel="stylesheet" type="text/css" href="default.css"/>
                <title>Detail: <xsl:value-of select="$shortname"/></title>
            </head>
            <body>
                <h1><xsl:value-of select="$shortname"/></h1>
                <h2><xsl:value-of select="$filename"/></h2>
                Jump to:
                <table class="testdetail">
                    <tr>
                        <tr>
                            <td>
                                <a name="top"/>
                                <table class="stepjump">
                                    <tr>
                                        <xsl:for-each select="/tests/test[@name=$filename]/step">
                                            <td>
                                                <xsl:if test="count(.//log[@type = 'ERROR' or @type='FATAL'])">
                                                    <xsl:attribute name="class">error</xsl:attribute>
                                                </xsl:if>
                                                <a href="#step{@num}"><xsl:value-of select="@num"/></a>
                                            </td>
                                        </xsl:for-each>
                                        <td style="width:90%;border-right:none;">
                                            -
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <td>
                            <xsl:for-each select="/tests/test[@name=$filename]/*">
                                <xsl:apply-templates select="."/>
                            </xsl:for-each>
                        </td>
                    </tr>
                </table>
                <div class="footer">TestGen4Web - HtmlUnitRunner. &#169; SpikeSource 2004-2006.</div>
            </body>
        </html>
    </xsl:template>

    <xsl:template match="file">
        <div class="outfiles">
            FILE: <a href="{@relpath}"><xsl:value-of select="@name"/></a> 
        </div>
    </xsl:template>

    <xsl:template match="log">
        <div>
            <xsl:attribute name="class">log<xsl:value-of select="@type"/></xsl:attribute>
            <xsl:value-of select="@type"/>:
            <xsl:value-of select="."/>
        </div>
    </xsl:template>

    <xsl:template match="action">
        <pre>
            <xsl:value-of select="."/>
        </pre>
    </xsl:template>

    <xsl:template match="step">
        <a name="step{@num}"/>
        <fieldset>
            <table class="step">
                <tr>
                    <td class="stephead">
                        <table cellpadding="0" cellspacing="0" width="100%">
                            <tr><td>Step <xsl:value-of select="@num"/> - Line: <a href="{../@html-copy}?line={@line}#{@line}"><xsl:value-of select="@line"/></a>, Col: <xsl:value-of select="@col"/></td>
                                <td style="text-align:right;">
                                    <a title="Jump to Top" class="arrow" href="#top">Top</a>&#160;
                                    <a title="Previous Step" class="arrow" href="#step{@num - 1}">&#8593;</a>&#160;
                                    <a title="Next Step" class="arrow" href="#step{@num + 1}">&#8595;</a>
                            </td></tr>
                        </table>
                        
                    </td>
                </tr>
                <xsl:for-each select="./*">
                    <tr>
                        <td>
                            <xsl:apply-templates select="."/>
                        </td>
                    </tr>
                </xsl:for-each>
            </table>
        </fieldset>
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

    <xsl:template name="replace-string">
        <xsl:param name="text"/>
        <xsl:param name="from"/>

        <xsl:choose>
            <xsl:when test="contains($text, $from)">

                <xsl:variable name="before" select="substring-before($text, $from)"/>
                <xsl:variable name="after" select="substring-after($text, $from)"/>

                <xsl:value-of select="$before"/>
                <br/>
                <xsl:call-template name="replace-string">
                    <xsl:with-param name="text" select="$after"/>
                    <xsl:with-param name="from" select="$from"/>
                </xsl:call-template>
            </xsl:when> 
            <xsl:otherwise>
                <xsl:value-of select="$text"/>  
            </xsl:otherwise>
        </xsl:choose>            
    </xsl:template>
</xsl:stylesheet>

