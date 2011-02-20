inputfile=$1
outdir=$2

xsltproc --stringparam format html list.xsl $inputfile > $outdir/testfiles.html
xsltproc --stringparam format list list.xsl $inputfile > $outdir/files
xsltproc --stringparam curtime "`date`" summary.xsl $inputfile > $outdir/summary.html

files=`cat $outdir/files | xargs`
for file in $files; do
    outfile="`basename $file`.html"
    xsltproc --stringparam filename $file result.xsl $inputfile > $outdir/$outfile
done
