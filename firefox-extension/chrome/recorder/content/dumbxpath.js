com.spikesource.tg4w.FindObject.prototype.tg4w_dumb_getObject = function(obj, parentDocument, xpath) {
    var nodes = parentDocument.evaluate(xpath, obj, null, 0, null);
    var node = null;
    if (nodes) {
        node = nodes.iterateNext();
    }
    return node;
}

com.spikesource.tg4w.FindObject.prototype.tg4w_dumb_getXpath = function(n, limitUntilNode) {
    if (!limitUntilNode) {
        limitUntilNode = null;
    }

    // abort early
    if (null == n) return null;

    // declarations
    var p = null;
    var hierarchy = new Array();
    var buffer = "";

    // push element on stack
    hierarchy.push(n);

    p = n.parentNode;
    while (null != p && p.nodeType != p.DOCUMENT_NODE && (limitUntilNode == null || p != limitUntilNode)) {
        // push on stack
        hierarchy.push(p);

        // get parent of parent
        p = p.parentNode;
    }


    // construct xpath
    var obj = null;
    while (hierarchy.length != 0 && null != (obj = hierarchy.pop())) {
        var node = obj;
        var handled = false;

        // only consider elements
        if (node.nodeType == node.ELEMENT_NODE) {
            var e = node;

            // is this the root element?
            if (false && buffer.length == 0) {
                // root element - simply append element name
                buffer += "/" + node.localName.toUpperCase();
            } else {
                // child element - append slash and element name
                buffer += "/";
                buffer += node.localName.toUpperCase();

                if (node.hasAttributes()) {
                    // see if the element has a name or id attribute
                    if (e.hasAttribute("id")) {
                        // id attribute found - use that
                        buffer += ("[@id=\"" + e.getAttribute("id") + "\"]");
                        handled = true;
                    } else if (e.hasAttribute("name")) {
                        // name attribute found - use that
                        buffer += ("[@name=\"" + e.getAttribute("name") + "\"]");
                        handled = true;
                    }
                }

                if (!handled) {
                    // no known attribute we could use - get sibling index
                    var prev_siblings = 1;
                    var prev_sibling = node.previousSibling;
                    while (null != prev_sibling) {
                        if (prev_sibling.nodeType == node.nodeType) {
                            if (prev_sibling.localName.toUpperCase() == node.localName.toUpperCase()) {
                                prev_siblings++;
                            }
                        }
                        prev_sibling = prev_sibling.previousSibling;
                    }
                    buffer += ("[" + prev_siblings + "]");
                }
            }
        }
    }

    // return buffer
    return buffer;
}

