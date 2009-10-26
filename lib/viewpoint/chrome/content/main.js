// This file uses Mochikit. It'll need to be included before it in main.xul
//
// nsIWebProgressListener implementation to monitor activity in the browser.
// This is based on an example I took from somewhere a few years ago, so I 
// don't have a link for it :( I suspect it comes from the XUL development
// site as an example snippet or I took it from the mozilla code base.
//
function WebProgressListener() {
}

WebProgressListener.prototype = {

  _busyFlag: false,
  _requestsStarted: 0,
  _requestsFinished: 0,
  
  // When this is set it will contain an object in the form:
  //
  //    {'func':xyzFunc, 'data':data}
  //
  _actionWhenReady: null,

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
    }

    if (stateFlags & WPL.STATE_IS_NETWORK) 
    {
      var stop = document.getElementById("stop");
      if (stateFlags & WPL.STATE_START) 
      {
        stop.setAttribute("disabled", false);
        progress.setAttribute("style", "");

	this._busyFlag = true;
      } 
      else if (stateFlags & WPL.STATE_STOP) 
      {
	// all activity has stopped in the browser window we're listening too.
	//
	this._busyFlag = false;

        stop.setAttribute("disabled", true);
        progress.setAttribute("style", "display: none");
        this.onStatusChange(webProgress, request, 0, "Done");
        this._requestsStarted = this._requestsFinished = 0;

	if (this._actionWhenReady)
	{
	  // Browser ready to handle any waiting command:
	  log.info("onStateChange: calling when ready function.");
	  try 
	  {
	    this._actionWhenReady['func'](this._actionWhenReady['args']);
	  }
	  catch (e)
	  {
	    log.info("onStateChange: cannot call when ready function - "+e);
	  }

	  // clear for next callback:
	  log.info("onStateChange: ready function called ok.");
	  this._actionWhenReady = null;
	}
      }
    }
  },

  // Run the given function with args when the browser is ready.
  // This will allow the function to perform actions against a
  // page that has actually loaded.
  executeWhenReady: function(ready, args)
  {
    var returned = false;

    if (this._busyFlag)
    {
      // The browser is busy right now, store this function and data 
      // to be executed at a later stage.
      log.info("executeWhenReady: browser busy, storing callback for later.");
      this._actionWhenReady = {'func':ready, 'args':args};
    }
    else
    {
      // The browser isn't actually busy so run the function 
      // straight away.
      log.info("executeWhenReady: browser not busy, running callback.");
      ready(args);
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
    var browser = document.getElementById("content");
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


// The outofbandcontrol:obc.onDataAvailable uses this to hand
// actions to the browser listener to determine when the browser
// is ready i.e. not loading a new request.
var browserListener = null;

function go(homepage) 
{
  var URL = homepage;

  try 
  {
    var urlbar = document.getElementById("urlbar");
    var browser = document.getElementById("content");

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
  var browser = document.getElementById("content");
  browser.reload();
}

function stop() 
{
  var browser = document.getElementById("content");
  browser.stop();
}


function initialise() 
{
  log.info("Xulcontrol Init Begin");

  var port = 7055
  var browser_uri = null;

  // Get access to the preferences in "pref.js":
  var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

  // setup Defaults via prefs.js
  var default_startport = '7055';
  if (prefs.getPrefType("browser.controlport") == prefs.PREF_STRING)
  {
    default_startport = prefs.getCharPref("browser.controlport");
  }
  var default_starturi = 'chrome://viewpoint/content/static/startup.html';
  if (prefs.getPrefType("browser.startup.homepage") == prefs.PREF_STRING)
  {
    default_starturi = prefs.getCharPref("browser.startup.homepage");
  }
  var default_nofullscreen = 'no';
  if (prefs.getPrefType("browser.nofullscreen") == prefs.PREF_STRING)
  {
    default_nofullscreen = prefs.getCharPref("browser.nofullscreen");
  }
  var default_development = 'no';
  if (prefs.getPrefType("browser.development") == prefs.PREF_STRING)
  {
    default_development = prefs.getCharPref("browser.development");
  }
  var default_width = 1024;
  if (prefs.getPrefType("browser.width") == prefs.PREF_STRING)
  {
    default_width = prefs.getCharPref("browser.width");
  }
  var default_height = 768;
  if (prefs.getPrefType("browser.height") == prefs.PREF_STRING)
  {
    default_height = prefs.getCharPref("browser.height");
  }
  var default_hidestatus = 'no';
  if (prefs.getPrefType("browser.hidestatus") == prefs.PREF_STRING)
  {
    default_hidestatus = prefs.getCharPref("browser.hidestatus");
  }

  var cmd_line = {
    'startport' : default_startport,
    'starturi' : default_starturi,
    'nofullscreen' : default_nofullscreen,
    'development' : default_development,
    'width' : default_width,
    'height' : default_height,
    'hidestatus' : default_hidestatus
  };

  // Command line argument handling:
  var args = window.arguments[0].QueryInterface(Components.interfaces.nsICommandLine);
  for(var i in cmd_line)
  {
    var value = null
    try {
      value = args.handleFlagWithParam(i, false);
    }
    catch (e) {
      alert('Unable to recover command line argument value for argument :'+i);
    }

    if (value != null)
    {
      cmd_line[i] = value;
    }
  }
  

  // Display the development panel if its turned on in the
  // configuration. The development bar contains the url bar, 
  // go and stop buttons.
  //
  //  alert("development: "+cmd_line['development']);
  if (cmd_line.development == 'no')
  {
    // LIVE Situation: remove the developer helper controls.
    setElementClass('development_bar', 'hidden');
    try { window.forceRedraw = true } catch (e) { alert('window: '+e); }
  }

  // Hide the status bar if we're explicitly old to.
  //
  if (cmd_line.hidestatus == 'yes')
  {
    setElementClass('development_status', 'hidden');
    try { window.forceRedraw = true } catch (e) { alert('window: '+e); }
  }

  // Start the control service so the app manager and web presence can send us messages:
  try 
  {
    if (isNaN(parseInt(cmd_line.startport))) 
    {   
      alert("initialise: The control port '"+cmd_line.startport+"' from 'prefs.js' is not a number! Using default 7055.");
      cmd_line.startport = 7055;
    }

    // Start with the XUL Control Frame Handler. This will handle 
    // command requests comming from remote clients.
    obc.start(cmd_line.startport, xch.inputReceived);
  }
  catch (e) 
  {
      alert("initialise: obc start FAILED: "+e)
  }


  // Make the window take up all available space on the screen.
  // This will cover the window start menu leaving on the xul
  // app window visible on the screen.
  //
  if (cmd_line.nofullscreen == 'no')
  {
    window.fullScreen = true;
    document.documentElement.setAttribute("sizemode", "maximized");     
  }
  else 
  {
    document.documentElement.setAttribute("sizemode", "restore");     
    try {
        window.resizeTo(cmd_line.width, cmd_line.height);
    }
    catch (e) {
        alert("initialise: unable to set window size> "+e);
    }
  }

  
  try 
  {
      // Reference: 
      //    https://developer.mozilla.org/en/nsIWebProgressListener
      //
      browserListener = new WebProgressListener();
      var browser = document.getElementById("content");
      
      // Reference: https://developer.mozilla.org/en/XUL/browser
      //
      // Allow the browser more control:
      browser.setAttribute("disablesecurity", true);
      // no dropdown history to text boxes:
      browser.setAttribute("disablehistory", true);
      
      browser.addProgressListener(browserListener, Components.interfaces.nsIWebProgress.NOTIFY_ALL);
  }
  catch (e)
  {
      alert("XulControl Listener setup failure - "+e);
  }

  // Recover our start page from the prefs.js. This will have been 
  // updated by the appmanager to the correct uri of the running
  // web presence. Once we've got it, go to it and 'start' the app. 
  if (cmd_line.starturi != null)
  {
    log.info("Redirecting browser to: " + cmd_line.starturi);
    try {
      log.info("Redirecting browser too: " + cmd_line.starturi);
      go(cmd_line.starturi);
    }
    catch (e) {
      alert('start uri parse failure. ' + e);
    }
  }

  log.info("Hello there, mochitkit is active. Xul Control Init End - OK");
}

// Set up the environment ready roll once the xul app is ready:
function catcherror_on_init() {
  try {
    initialise();
  }
  catch (e) {
    alert("Initialise Failure: "+e);
  }
}
addLoadEvent(catcherror_on_init);

// Close the control service cleanly.
connect(window, 'onunload', obc.stop()); 
