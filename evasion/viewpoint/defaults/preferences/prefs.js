// Viewpoint Specific option defaults:
//
pref("browser.startup.homepage", "chrome://viewpoint/content/static/startup.html");
pref("toolkit.defaultChromeURI", "chrome://viewpoint/content/main.xul");
pref("browser.controlport", "7055");
pref("browser.nofullscreen", "yes");
pref("browser.development", "no");
pref("browser.width", "1024");
pref("browser.height", "768");

// Disable caching to prevent js/css upgrade problems and aid in development:
// based on: http://www.eng.uwaterloo.ca/twiki/bin/view/Linux/FirefoxLockdown
// useful: http://www.mozilla.org/unix/customizing.htmlpref("accessibility.typeaheadfind.autostart", false); 
//
pref("applications.rlogin", ""); 
pref("applications.rlogin_with_user", ""); 
pref("applications.telnet", ""); 
pref("applications.tmp_dir", "");
pref("applications.tn3270", ""); 
pref("network.cookie.enableForCurrentSessionOnly", true);
pref("security.warn_entering_secure", false);
pref("security.warn_entering_secure.show_once", false);
pref("security.warn_entering_weak", false);
pref("security.warn_entering_weak.show_once", false);
pref("security.warn_leaving_secure", false);
pref("security.warn_leaving_secure.show_once", false);
pref("security.warn_submit_insecure", false);
pref("security.warn_submit_insecure.show_once", false);
pref("security.warn_viewing_mixed", false);
pref("security.warn_viewing_mixed.show-once", false);
pref("security.security.warn_viewing_mixed", false);
pref("update_notifications.enabled", false);
pref("browser.urlbar.autocomplete.enabled", false);
pref("browser.urlbar.showPopup", false);
pref("browser.urlbar.showSearch", false);
//pref("browser.cache.disk.enable", false); 
//pref("browser.cache.memory.enable", false); 
//pref("browser.cache.disk.enable", false);
//pref("browser.cache.disk.capacity", 0);
//pref("browser.cache.offline.capacity", 0);
//pref("browser.cache.memory.enable", false);
//pref("browser.cache.disk_cache_ssl", false);
//pref("network.http.use-cache", false);

// if i disable caching then the problem is image intensive pages 
// take a long time to reload. The best way to get new content
// is to delete old profile and cached files.
//
pref("browser.cache.disk.enable", true); 
pref("browser.cache.memory.enable", true); 
pref("browser.cache.disk.enable", true);
pref("browser.cache.disk.capacity", 51246);
pref("browser.cache.offline.capacity", 0);
pref("browser.cache.memory.enable", true);
pref("browser.cache.disk_cache_ssl", true);
pref("network.http.use-cache", true);



// debug options:
//pref("browser.dom.window.dump.enabled", true);
//pref("javascript.options.showInConsole", true);
//pref("javascript.options.strict", true);
//pref("nglayout.debug.disable_xul_cache", true);
//pref("nglayout.debug.disable_xul_fastload", true); 
 