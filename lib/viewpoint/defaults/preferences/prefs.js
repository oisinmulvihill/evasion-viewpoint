// Disable caching to prevent js/css upgrade problems and aid in development:
pref("browser.cache.memory.enable", false);
pref("browser.cache.disk.enable", false);
pref("browser.cache.offline.enable", false);

pref("browser.startup.homepage", "chrome://viewpoint/content/static/startup.html");

pref("browser.controlport", "7055");

pref("browser.fullscreen", "no");

pref("browser.development", "no");

pref("toolkit.defaultChromeURI", "chrome://viewpoint/content/main.xul");
