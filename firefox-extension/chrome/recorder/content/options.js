/**
 * Copyright(c) 2004-2005, SpikeSource Inc. All Rights Reserved.
 * Licensed under the Open Software License version 2.1
 * (See www.spikesource.com/license.html)
 * 
 * author: Vinay Srini (vsrini@spikesource.com)
 */

com.spikesource.tg4w.Tg4wOptions = function() {
    this.prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
    this.tg4w_pref_prefix = "extensions.recorder.";

    this.tg4w_debug_hilight_objects               = "debug-hilight-objects";
    this.tg4w_debug_hilight_intermediate_objects  = "debug-hilight-intermediate-objects";
    this.tg4w_debug_display_messages              = "debug-display-messages";

    this.tg4w_view_text_with_buttons          = "view-text-with-buttons";
    this.tg4w_view_play_progress_bar          = "view-play-progress-bar";

    this.tg4w_record_add_verify_page_title    = "record-add-verify-page-title";
    this.tg4w_record_no_xpath                 = "record-no-xpath";

    this.tg4w_play_scroll_to_object           = "play-scroll-to-object";
    this.tg4w_play_delay                      = "play-delay";
    this.tg4w_max_time_allowed_for_page_load  = "max-time-allowed-for-page-load";

    this.tg4w_favorite_list                   = "favorite-list";
    this.tg4w_favorite_dont_ask               = "favorite-dont-ask";
    this.tg4w_favorite_always_add             = "favorite-always-add";
    this.tg4w_favorite_play_on_load           = "favorite-play-on-load";
    this.tg4w_favorite_play_on_load_ask       = "favorite-play-on-load-ask";

    this.tg4w_fancy_typing_enabled   = "fancy-typing-enabled";
    this.tg4w_fancy_typing_interval  = "fancy-typing-interval";

    this.tg4w_ignore_xpath_id = "ignore-xpath-id";
    this.tg4w_record_mode = "record-mode";

    this.tg4w_inline_editor_size = "inline-editor-size";

    this.tg4w_show_always     = "always-show";
}

com.spikesource.tg4w.Tg4wOptions.prototype.changeValue = function (event, id, ll, ul) {
    // if it does not validate, just return
    if (! this.validate()) {
        return;
    }

    var value = document.getElementById(id).value;
    var original = value;

    var change = 100;
    if (event.ctrlKey) {
        change = 10;
    } else if (event.shiftKey) {
        change = 1000;
    }

    if (event.keyCode == event.DOM_VK_UP) {
        value = parseInt(value) + change;
    } else if (event.keyCode == event.DOM_VK_DOWN) {
        value = parseInt(value) - change;
    }

    if (value < ll) value = ll;
    if (value > ul) value = ul;

    document.getElementById(id).value = value;
}

com.spikesource.tg4w.Tg4wOptions.prototype.isBoolean = function(id) {
    if (id == this.tg4w_play_delay) return false;
    if (id == this.tg4w_fancy_typing_interval) return false;
    if (id == this.tg4w_max_time_allowed_for_page_load) return false;
    if (id == this.tg4w_record_mode ) return false;
    if (id == this.tg4w_inline_editor_size) return false;
    else return true;
}

com.spikesource.tg4w.Tg4wOptions.prototype.getDefaultValue = function (id) {
    if (id == this.tg4w_debug_display_messages)       return true;
    if (id == this.tg4w_debug_hilight_objects )       return true;
    if (id == this.tg4w_debug_hilight_intermediate_objects) return false;

    //if (id == record_add_verify_links)      return false;
    if (id == this.tg4w_record_add_verify_page_title) return true;
    if (id == this.tg4w_record_no_xpath)              return false;

    if (id == this.tg4w_view_text_with_buttons)       return false;
    if (id == this.tg4w_view_play_progress_bar)       return false;

    if (id == this.tg4w_play_scroll_to_object)        return true;
    if (id == this.tg4w_play_delay)                   return "1500";
    if (id == this.tg4w_inline_editor_size)           return "300px";
    if (id == this.tg4w_max_time_allowed_for_page_load) return "10000";
    if (id == this.tg4w_favorite_dont_ask)            return false;
    if (id == this.tg4w_favorite_always_add)          return false;
    if (id == this.tg4w_favorite_play_on_load)        return false;
    if (id == this.tg4w_favorite_play_on_load_ask)    return true;

    if (id == this.tg4w_fancy_typing_interval)        return "100";
    if (id == this.tg4w_fancy_typing_enabled)         return false;

    if (id == this.tg4w_ignore_xpath_id)              return false;
    if (id == this.tg4w_record_mode)                  return "this.tg4w_smart";

//    if (id == this.tg4w_show_in_toolbar)              return false;
//    if (id == this.tg4w_show_old_editor)              return false;
    if (id == this.tg4w_show_always)                  return true;
}

com.spikesource.tg4w.Tg4wOptions.prototype.validate = function() {

    var valid = true;

    if (! this.validateInt(this.tg4w_max_time_allowed_for_page_load)) {
        this.showError(this.tg4w_max_time_allowed_for_page_load);
        valid = false;
    } else {
        this.hideError(this.tg4w_max_time_allowed_for_page_load);
    }

    if (! this.validateInt(this.tg4w_play_delay)) {
        this.showError(this.tg4w_play_delay);
        valid = false;
    } else {
        this.hideError(this.tg4w_play_delay);
    }

    return valid;
}

com.spikesource.tg4w.Tg4wOptions.prototype.hideError = function (elemname) {
    document.getElementById(elemname).style.color = "black";
    document.getElementById(elemname + "-label").style.color = "black";
}

com.spikesource.tg4w.Tg4wOptions.prototype.showError = function (elemname) {
    document.getElementById(elemname).style.color = "red";
    document.getElementById(elemname + "-label").style.color = "red";
}

com.spikesource.tg4w.Tg4wOptions.prototype.validateInt = function(id) {
    var val = document.getElementById(id).value
    return com.spikesource.tg4w.tg4wcommon.isInteger(val);
}

com.spikesource.tg4w.Tg4wOptions.prototype.setDomValue = function(id) {
    var val = this.getPreference(id);

    if (this.isBoolean(id)) {
        if (val) {
            document.getElementById(id).setAttribute("checked", "true");
        } else {
            document.getElementById(id).removeAttribute("checked");
        }
    } else {
        document.getElementById(id).value = val;
    }
}

com.spikesource.tg4w.Tg4wOptions.prototype.getPreference = function(id) {
    try {
        if (this.isBoolean(id)) {
            return this.prefs.getBoolPref(this.tg4w_pref_prefix + id);
        } else {
            return this.prefs.getComplexValue(this.tg4w_pref_prefix + id, Components.interfaces.nsISupportsString).data;
        }
    } catch (e) {
        return this.getDefaultValue(id);
    }
}

com.spikesource.tg4w.Tg4wOptions.prototype.setPreference = function(id, value) {
    if (this.isBoolean(id)) {
        this.prefs.setBoolPref(this.tg4w_pref_prefix + id, value);
    } else {
        this.prefs.setCharPref(this.tg4w_pref_prefix + id, value);
    }
}

com.spikesource.tg4w.Tg4wOptions.prototype.setConfig = function(id) {
    if (this.isBoolean(id)) {
        this.setPreference(id, document.getElementById(id).hasAttribute("checked"));
    } else {
        this.setPreference(id, document.getElementById(id).value);
    }
}

com.spikesource.tg4w.Tg4wOptions.prototype.resetConfig = function(id) {
    this.setPreference(id, this.getDefaultValue(id));
}

com.spikesource.tg4w.Tg4wOptions.prototype.onDisplayLoad = function() {
    // Get the root branch
    this.setDomValue(this.tg4w_debug_display_messages);
    this.setDomValue(this.tg4w_debug_hilight_objects);
    this.setDomValue(this.tg4w_debug_hilight_intermediate_objects);

    //this.setDomValue(record_add_verify_links);
    this.setDomValue(this.tg4w_record_add_verify_page_title);
    this.setDomValue(this.tg4w_record_no_xpath);


    this.setDomValue(this.tg4w_view_text_with_buttons);
    this.setDomValue(this.tg4w_view_play_progress_bar);

    this.setDomValue(this.tg4w_play_scroll_to_object);
    this.setDomValue(this.tg4w_play_delay);
    this.setDomValue(this.tg4w_max_time_allowed_for_page_load);

    this.setDomValue(this.tg4w_favorite_dont_ask);
    this.setDomValue(this.tg4w_favorite_always_add);
    this.setDomValue(this.tg4w_favorite_play_on_load);
    this.setDomValue(this.tg4w_favorite_play_on_load_ask);

    this.setDomValue(this.tg4w_fancy_typing_interval);
    this.setDomValue(this.tg4w_fancy_typing_enabled);

    this.setDomValue(this.tg4w_ignore_xpath_id);
    this.setDomValue(this.tg4w_record_mode);

//    this.setDomValue(this.tg4w_show_in_toolbar);
//    this.setDomValue(this.tg4w_show_old_editor);
    this.setDomValue(this.tg4w_show_always);

    this.disableFavoritePlayOnLoadAsk();
}

com.spikesource.tg4w.Tg4wOptions.prototype.reset = function() {
    this.resetConfig(this.tg4w_debug_display_messages);
    this.resetConfig(this.tg4w_debug_hilight_objects);
    this.resetConfig(this.tg4w_debug_hilight_intermediate_objects);

    //this.resetConfig(record_add_verify_links);
    this.resetConfig(this.tg4w_record_add_verify_page_title);
    this.resetConfig(this.tg4w_record_no_xpath);

    this.resetConfig(this.tg4w_view_text_with_buttons);
    this.resetConfig(this.tg4w_view_play_progress_bar);

    this.resetConfig(this.tg4w_play_scroll_to_object);
    this.resetConfig(this.tg4w_play_delay);
    this.resetConfig(this.tg4w_max_time_allowed_for_page_load);

    this.resetConfig(this.tg4w_favorite_dont_ask);
    this.resetConfig(this.tg4w_favorite_always_add);
    this.resetConfig(this.tg4w_favorite_play_on_load);
    this.resetConfig(this.tg4w_favorite_play_on_load_ask);

    this.resetConfig(this.tg4w_fancy_typing_interval);
    this.resetConfig(this.tg4w_fancy_typing_enabled);

    this.resetConfig(this.tg4w_ignore_xpath_id);
    this.resetConfig(this.tg4w_record_mode);

//    this.resetConfig(this.tg4w_show_in_toolbar);
//    this.resetConfig(this.tg4w_show_old_editor);
    this.resetConfig(this.tg4w_show_always);
    this.resetConfig(this.tg4w_inline_editor_size);

    this.onDisplayLoad();
}

com.spikesource.tg4w.Tg4wOptions.prototype.onSave = function() {

    if (! this.validate()) {
        return false;
    }

    this.setConfig(this.tg4w_debug_display_messages);
    this.setConfig(this.tg4w_debug_hilight_objects);
    this.setConfig(this.tg4w_debug_hilight_intermediate_objects);

    //this.setConfig(record_add_verify_links);
    this.setConfig(this.tg4w_record_add_verify_page_title);
    this.setConfig(this.tg4w_record_no_xpath);

    this.setConfig(this.tg4w_view_text_with_buttons);
    this.setConfig(this.tg4w_view_play_progress_bar);

    this.setConfig(this.tg4w_play_scroll_to_object);
    this.setConfig(this.tg4w_play_delay);
    this.setConfig(this.tg4w_max_time_allowed_for_page_load);

    this.setConfig(this.tg4w_favorite_dont_ask);
    this.setConfig(this.tg4w_favorite_always_add);
    this.setConfig(this.tg4w_favorite_play_on_load);
    this.setConfig(this.tg4w_favorite_play_on_load_ask);

    this.setConfig(this.tg4w_fancy_typing_interval);
    this.setConfig(this.tg4w_fancy_typing_enabled);

    this.setConfig(this.tg4w_ignore_xpath_id);
    this.setConfig(this.tg4w_record_mode);

//    this.setConfig(this.tg4w_show_in_toolbar);
//    this.setConfig(this.tg4w_show_old_editor);
    this.setConfig(this.tg4w_show_always);

    return true;
}

com.spikesource.tg4w.Tg4wOptions.prototype.disableFavoritePlayOnLoadAsk = function() {
    if (document.getElementById(this.tg4w_favorite_play_on_load).hasAttribute("checked")) {
        document.getElementById(this.tg4w_favorite_play_on_load_ask).removeAttribute("disabled");
    } else {
        document.getElementById(this.tg4w_favorite_play_on_load_ask).setAttribute("disabled", "true");
    }
}

// External getter methods
com.spikesource.tg4w.Tg4wOptions.prototype.doHilightObjects = function() {
    return this.getPreference(this.tg4w_debug_hilight_objects);
}

// External getter methods
com.spikesource.tg4w.Tg4wOptions.prototype.doHilightIntermediateObjects = function() {
    return this.getPreference(this.tg4w_debug_hilight_intermediate_objects);
}

com.spikesource.tg4w.Tg4wOptions.prototype.printDebug = function () {
    return this.getPreference(this.tg4w_debug_display_messages);
}

/*
com.spikesource.tg4w.Tg4wOptions.prototype.doAddVerifyLinks = function () {
    return this.getPreference(record_add_verify_links);
}
*/

com.spikesource.tg4w.Tg4wOptions.prototype.showTextWithButtons = function () {
    return this.getPreference(this.tg4w_view_text_with_buttons);
}

com.spikesource.tg4w.Tg4wOptions.prototype.showProgressBar = function () {
    return this.getPreference(this.tg4w_view_play_progress_bar);
}

com.spikesource.tg4w.Tg4wOptions.prototype.doVerifyPageTitle = function () {
    return this.getPreference(this.tg4w_record_add_verify_page_title);
}

com.spikesource.tg4w.Tg4wOptions.prototype.recordXPath = function () {
    return (! this.getPreference(this.tg4w_record_no_xpath));
}

com.spikesource.tg4w.Tg4wOptions.prototype.doScroll = function () {
    return this.getPreference(this.tg4w_play_scroll_to_object);
}

com.spikesource.tg4w.Tg4wOptions.prototype.getPlayDelay = function () {
    return this.getPreference(this.tg4w_play_delay);
}

com.spikesource.tg4w.Tg4wOptions.prototype.getMaxTimeAllowedForPageLoad = function () {
    return this.getPreference(this.tg4w_max_time_allowed_for_page_load);
}

com.spikesource.tg4w.Tg4wOptions.prototype.askAdd2Favorites = function () {
    return (! this.getPreference(this.tg4w_favorite_dont_ask));
}

com.spikesource.tg4w.Tg4wOptions.prototype.alwaysAdd2Favorites = function () {
    return (this.getPreference(this.tg4w_favorite_always_add));
}

com.spikesource.tg4w.Tg4wOptions.prototype.autoPlayOnFavoriteLoad = function () {
    return (this.getPreference(this.tg4w_favorite_play_on_load));
}

com.spikesource.tg4w.Tg4wOptions.prototype.askBeforeAutoPlayFavorite = function () {
    return (this.getPreference(this.tg4w_favorite_play_on_load_ask));
}

com.spikesource.tg4w.Tg4wOptions.prototype.getFancyTypingInterval = function () {
    return this.getPreference(this.tg4w_fancy_typing_interval);
}

com.spikesource.tg4w.Tg4wOptions.prototype.showInToolbar = function () {
    return false;
    //return this.getPreference(this.tg4w_show_in_toolbar);
}

com.spikesource.tg4w.Tg4wOptions.prototype.showOldEditor = function () {
    return false;
    //return this.getPreference(this.tg4w_show_old_editor);
}

com.spikesource.tg4w.Tg4wOptions.prototype.showAlways = function () {
    return this.getPreference(this.tg4w_show_always);
}

com.spikesource.tg4w.Tg4wOptions.prototype.doFancyTyping = function () {
    return (this.getPreference(this.tg4w_fancy_typing_enabled));
}

com.spikesource.tg4w.Tg4wOptions.prototype.ignoreXpathId = function () {
    return (this.getPreference(this.tg4w_ignore_xpath_id));
}

com.spikesource.tg4w.Tg4wOptions.prototype.getFavorites = function () {
    try {
        return this.prefs.getComplexValue(this.tg4w_pref_prefix + this.tg4w_favorite_list, Components.interfaces.nsISupportsString).data;
    } catch (e) {
        return "";
    }
}

com.spikesource.tg4w.Tg4wOptions.prototype.clearFavorites = function (file) {
    this.prefs.setCharPref(this.tg4w_pref_prefix + this.tg4w_favorite_list, "");
}

com.spikesource.tg4w.Tg4wOptions.prototype.addFavorite = function (file) {
    var currentList = this.getFavorites();
    if (currentList.indexOf(file) == -1) {
        currentList = currentList + "," + file;
        this.prefs.setCharPref(this.tg4w_pref_prefix + this.tg4w_favorite_list, currentList);
    }
}

com.spikesource.tg4w.Tg4wOptions.prototype.getRecordMode = function () {
    return this.getPreference(this.tg4w_record_mode);
}

com.spikesource.tg4w.Tg4wOptions.prototype.setInlineEditorSize = function (height) {
    return this.setPreference(this.tg4w_inline_editor_size, height);
}

com.spikesource.tg4w.Tg4wOptions.prototype.getInlineEditorSize = function () {
    return this.getPreference(this.tg4w_inline_editor_size);
}

com.spikesource.tg4w.tg4woptions = new com.spikesource.tg4w.Tg4wOptions();
