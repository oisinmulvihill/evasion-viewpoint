// This implements the customer XUL Control command handler. This module provides
// an alternate inputReceived handler, to process commands received from the XUL 
// Control client. This module requires Mochikit is included before this file. 

//namespace to protect.
var xch = {};

xch.inputReceived = function(control_frame) 
{
  // Handle the command:
  log.info("inputReceived: control frame " + control_frame);
  return xch.process(control_frame['command'], control_frame['args']);
};


// Perform the required command action and return the result:
xch.process = function(command, args) 
{
    log.info("process: handling command call " + command);

    switch(command)
    {
        case "version":
	    return xch.version();
	    break;

        case "replace":
	    return xch.replace(args['id'], args['content']);
	    break;

        case "set_uri":
	    return xch.setBrowserUri(args['uri']);
	    break;

        case "call":
	    return xch.callFunction(args);
	    break;

        case "get_uri":
	    return xch.getBrowserUri();
	    break;
            
        case "exit":
	    // Shutdown the app, this won't get a chance to reply. 
	    // The other side will need to be aware of this.
	    return xch.exitApplication();
	    break;

        default:
	    break;
    }

    // A function must return otherwise we consider it a handler failure:
    throw new Error("Unknown command '" + command + "'. I don't know what to do with it.");
};


// Recover the browser and check its ok:
xch.getBrowser = function(browser)
{
  var browser = null;

  // Recover the XUL app's main browser window.
  browser = document.getElementById("content"); 

  return browser;
};


// Return the version of this code. This will help when checking what functionality is available across versions.
xch.version = function()
{
    return "Evasion XUL Control Protocol v1.0.0 2008-12-23";
};


// Find the id and replace the content with that given:
xch.replace = function(eid, content)
{
    log.info("replace: looking for element " + eid + " and replacing its content.");

    // Get the browser and then search for the element inside the 
    // the loaded page. I don't want the user code getting the 
    // actual XUL content.
    var browser = xch.getBrowser();

    var ele = window.content.document.getElementById(eid);

    if (ele)
    {
	log.info("replace: found " + eid + " replacing its content.");
	ele.innerHTML = unescape(content);
    }
    else
    {
	var msg = "replace: the element '" + eid + "' was not found!"
	throw new Error(msg, msg);
    }

    return 0;
};


// Point the browser at the new address URL and return the confirmation were looking at it.
xch.setBrowserUri = function(uri)
{
  var browser = xch.getBrowser();
  var currenturi = xch.getBrowserUri();

  
  log.info("setBrowserUri: change from " + currenturi + " to " + uri);

  if (uri)
  {
    //browser.loadURI(uri, null, null);
    // Ref: https://developer.mozilla.org/en/nsIWebNavigation
    // LOAD_FLAGS_BYPASS_CACHE = 256
    //    
    //var nsWebBrowser = Components.classes["@mozilla.org/embedding/browser/nsWebBrowser;1"].getService(Components.interfaces.nsWebBrowser);
    //
    browser.loadURIWithFlags(uri, 256, null); 
  }
  else 
  {
      var msg = "Redirect: No valid URL was given to load '" + uri + "'!"
      throw new Error(msg, msg);
  }

  return uri;
};

 
// Recover the uri the browser is actually looking at.
xch.getBrowserUri = function()
{
  var browser = xch.getBrowser();

  var uri = browser.currentURI.asciiSpec;
  log.info("getBrowserUri: returning URI - " + uri);

  return uri
};


// Call a javascript function inside the browser and return what it doesn.
xch.callFunction = function(args)
{
    var returned = 'fail';

    log.info("call: args " + args + ".");

    var browser = xch.getBrowser();

    try {
      var cmd = "javascript: "+args['call'];
      log.info("call: executing '"+cmd+"'.");
      browser.contentDocument.location = cmd;
      returned = "ok";
    }
    catch(e) {
      log.info("call: fail: "+e);
      returned = "fail: "+e;
    }

    return returned;
};


// Tell the application to exit.
xch.exitApplication = function()
{
  var browser = xch.getBrowser();
  log.info("exitApplication: exiting now. ");

  // Close the socket prior to exiting.
  obc.stop();

  // Close the window.
  window.close();

  // Code taken from the auit example here:
  //
  // * http://developer.mozilla.org/en/docs/How_to_Quit_a_XUL_Application
  //
  var appStartup = Components.classes['@mozilla.org/toolkit/app-startup;1'].getService(Components.interfaces.nsIAppStartup);

  // eAttemptQuit will try to close each XUL window, but the XUL window can cancel the quit
  // process if there is unsaved data. eForceQuit will quit no matter what.
  var quitSeverity = Components.interfaces.nsIAppStartup.eForceQuit;
  appStartup.quit(quitSeverity);

  return 0;
};


