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
        <xsl:text> HtmlUnit Interpreter Results</xsl:text>
        <xsl:text>
</xsl:text>
        <xsl:text> Test Name                   ActionsRun Errors
 ---------                   ---------- ------</xsl:text>
        <xsl:text>
</xsl:text>
        <xsl:for-each select="/tests/test">
            <xsl:variable name="shortfilename">
                <xsl:call-template name="substring-after-last">
                    <xsl:with-param name="input" select="@name"/>
                    <xsl:with-param name="marker" select="'/'"/>
                </xsl:call-template>
            </xsl:variable>
            <xsl:variable name="paddedname">
                <xsl:call-template name="append-pad">
                    <xsl:with-param name="padChar" select="'.'"/>
                    <xsl:with-param name="padVar" select="$shortfilename"/>
                    <xsl:with-param name="length" select="25"/>
                </xsl:call-template>
            </xsl:variable>
            <xsl:variable name="errorCount" select="count(.//log[@type = 'FATAL' or @type='ERROR'])"/>
            <xsl:text> </xsl:text>
            <xsl:value-of select="$paddedname"/>
            <xsl:text> </xsl:text>
            <xsl:value-of select="format-number(./action-count/@num, '    00')"/>
            <xsl:text>/</xsl:text>
            <xsl:value-of select="format-number(count(step), '00')"/>
            <xsl:text> </xsl:text>
            <xsl:if test="$errorCount &gt; 0 or ./action-count/@num != count(step)">
                <xsl:text>    </xsl:text><xsl:value-of select="format-number($errorCount, '00')"/>
            </xsl:if>
            <xsl:text>
</xsl:text>
        </xsl:for-each>
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

    <xsl:template name="prepend-pad">    
        <!-- recursive template to right justify and prepend-->
        <!-- the value with whatever padChar is passed in   -->
        <xsl:param name="padChar"> </xsl:param>
        <xsl:param name="padVar"/>
        <xsl:param name="length"/>
        <xsl:choose>
            <xsl:when test="string-length($padVar) &lt; $length">
                <xsl:call-template name="prepend-pad">
                    <xsl:with-param name="padChar" select="$padChar"/>
                    <xsl:with-param name="padVar" select="concat($padChar,$padVar)"/>
                    <xsl:with-param name="length" select="$length"/>
                </xsl:call-template>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of 
                    select="substring($padVar,string-length($padVar) -
                    $length + 1)"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

  <xsl:template name="append-pad">    
  <!-- recursive template to left justify and append  -->
  <!-- the value with whatever padChar is passed in   -->
    <xsl:param name="padChar"> </xsl:param>
    <xsl:param name="padVar"/>
    <xsl:param name="length"/>
    <xsl:choose>
      <xsl:when test="string-length($padVar) &lt; $length">
        <xsl:call-template name="append-pad">
          <xsl:with-param name="padChar" select="$padChar"/>
          <xsl:with-param name="padVar" select="concat($padVar,$padChar)"/>
          <xsl:with-param name="length" select="$length"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="substring($padVar,1,$length)"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
</xsl:stylesheet>

