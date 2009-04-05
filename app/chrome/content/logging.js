// Print a message in the jsconsole log.
var log = {};

// Log to the jsconsole in mozilla...
log.info = function(msg)
{
    try 
    {
	var console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
	console.logStringMessage(msg);    
    }
    catch(e) 
    {
	alert("err: "+e);
    }
} 
