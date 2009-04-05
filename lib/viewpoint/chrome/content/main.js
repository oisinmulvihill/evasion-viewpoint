// This file uses mochikit. It'll need to be included before it in main.xul
//

// nsIWebProgressListener implementation to monitor activity in the browser.
function WebProgressListener() {
}

WebProgressListener.prototype = {

  _requestsStarted: 0,
  _requestsFinished: 0,

  // We need to advertize that we support weak references.  This is done simply
  // by saying that we QI to nsISupportsWeakReference.  XPConnect will take
  // care of actually implementing that interface on our behalf.
  QueryInterface: function(iid) 
  {
    if (iid.equals(Components.interfaces.nsIWebProgressListener) || iid.equals(Components.interfaces.nsISupportsWeakReference) || iid.equals(Components.interfaces.nsISupports))
    {
      return this;
    }
    
    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  // This method is called to indicate state changes.
  onStateChange: function(webProgress, request, stateFlags, status) 
  {
    const WPL = Components.interfaces.nsIWebProgressListener;

    var progress = document.getElementById("progress");

    if (stateFlags & WPL.STATE_IS_REQUEST) 
    {
      if (stateFlags & WPL.STATE_START) 
      {
        this._requestsStarted++;
      } 
      else if (stateFlags & WPL.STATE_STOP) 
      {
        this._requestsFinished++;
      }

      if (this._requestsStarted > 1) 
      {
        var value = (100 * this._requestsFinished) / this._requestsStarted;
        progress.setAttribute("mode", "determined");
        progress.setAttribute("value", value + "%");
      }
    }

    if (stateFlags & WPL.STATE_IS_NETWORK) 
    {
      var stop = document.getElementById("stop");
      if (stateFlags & WPL.STATE_START) 
      {
        stop.setAttribute("disabled", false);
        progress.setAttribute("style", "");
      } 
      else if (stateFlags & WPL.STATE_STOP) 
      {
        stop.setAttribute("disabled", true);
        progress.setAttribute("style", "display: none");
        this.onStatusChange(webProgress, request, 0, "Done");
        this._requestsStarted = this._requestsFinished = 0;
      }
    }
  },

  // This method is called to indicate progress changes for the currently loading page.
  onProgressChange: function(webProgress, request, curSelf, maxSelf, curTotal, maxTotal) 
  {
    if (this._requestsStarted == 1) 
    {
      var progress = document.getElementById("progress");
      if (maxSelf == -1) 
      {
        progress.setAttribute("mode", "undetermined");
      } 
      else 
      {
        progress.setAttribute("mode", "determined");
        progress.setAttribute("value", ((100 * curSelf) / maxSelf) + "%");
      }
    }
  },

  // This method is called to indicate a change to the current location.
  onLocationChange: function(webProgress, request, location) 
  {
    var urlbar = document.getElementById("urlbar");
    urlbar.value = location.spec;

    var browser = document.getElementById("browser");
  },

  // This method is called to indicate a status changes for the currently
  // loading page.  The message is already formatted for display.
  onStatusChange: function(webProgress, request, status, message) {
    var status = document.getElementById("status");
    status.setAttribute("label", message);
  },

  // This method is called when the security state of the browser changes.
  onSecurityChange: function(webProgress, request, state) {
    const WPL = Components.interfaces.nsIWebProgressListener;

    var sec = document.getElementById("security");

    if (state & WPL.STATE_IS_INSECURE) {
      sec.setAttribute("style", "display: none");
    } else {
      var level = "unknown";
      if (state & WPL.STATE_IS_SECURE) {
        if (state & WPL.STATE_SECURE_HIGH)
          level = "high";
        else if (state & WPL.STATE_SECURE_MED)
          level = "medium";
        else if (state & WPL.STATE_SECURE_LOW)
          level = "low";
      } else if (state & WPL_STATE_IS_BROKEN) {
        level = "mixed";
      }
      sec.setAttribute("label", "Security: " + level);
      sec.setAttribute("style", "");
    }
  }
};


var listener;

function go(homepage) 
{
  var URL = homepage;

  try 
  {
    var urlbar = document.getElementById("urlbar");
    var browser = document.getElementById("browser");

    if (urlbar.value) 
    {
      URL = urlbar.value;
    }
  }
  catch (e) 
  {
    // urlbar maybe disabled, just use the given url.
  }

  browser.loadURI(URL, null, null);
}

function reload() 
{
  var browser = document.getElementById("browser");
  browser.reload();
}

function stop() 
{
  var browser = document.getElementById("browser");
  browser.stop();
}


function initialise() 
{
  // Get access to the preferences in "pref.js":
  var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);


  // Display the development panel if its turned on in the
  // configuration. The development bar contains the url bar, 
  // go and stop buttons.
  //
  if (prefs.getPrefType("browser.development") == prefs.PREF_STRING)
  {
    var development = prefs.getCharPref("browser.development");
    if (development == 'no')       
    {
      // LIVE Situation: remove the developer helper controls.
      setElementClass('development_bar', 'hidden');
      setElementClass('development_status', 'hidden');
    }
    try { window.forceRedraw = true } catch (e) { alert('window: '+e); }
  }


  // Start the control service so the app manager and web presence can send us messages:
  var port = 7055
  try 
  {
      if (prefs.getPrefType("browser.controlport") == prefs.PREF_STRING)
      {
          port = prefs.getCharPref("browser.controlport");

          if (isNaN(parseInt(port))) 
          {   
              alert("initialise: The control port '"+port+"' from 'prefs.js' is not a number! Using default 7055.");
          }
      }

      // Start with the XUL Control Frame Handler. This will handle 
      // command requests comming from remote clients.
      obc.start(port, xch.inputReceived);
  }
  catch (e) 
  {
      alert("initialise: obc start FAILED: "+e)
  }


  // Make the window take up all available space on the screen.
  // This will cover the window start menu leaving on the xul
  // app window visible on the screen.
  //
  if (prefs.getPrefType("browser.startup.homepage") == prefs.PREF_STRING)
  {
    var full_screen = prefs.getCharPref("browser.fullscreen");
    if (full_screen == 'yes') 
    {   
       window.fullScreen = true;
    }
  }


  listener = new WebProgressListener();
  var browser = document.getElementById("browser");
  browser.addProgressListener(listener, Components.interfaces.nsIWebProgress.NOTIFY_ALL);

  // Recover our start page from the prefs.js. This will have been 
  // updated by the appmanager to the correct uri of the running
  // web presence. Once we've got it, go to it and 'start' the app. 
  var homepage;
  if (prefs.getPrefType("browser.startup.homepage") == prefs.PREF_STRING)
  {
    homepage = prefs.getCharPref("browser.startup.homepage");
  }
  go(homepage);

  log.info("Hello there, mochitkit is active!");
}

// Set up the environment ready roll once the xul app is ready:
addLoadEvent(initialise);

// Close the control service cleanly.
connect(window, 'onunload', obc.stop()); 
