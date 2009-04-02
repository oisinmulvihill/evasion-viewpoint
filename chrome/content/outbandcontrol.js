//
//  'Out Of Band' communication module for the XUL APP.
//
//  This allows the appmanager and the webapp to control
//  the xul app, outside of page refreshes. This allows
//  immediate responses to card swipes and other POS type
//  hardware events.
//
//  Oisin Mulvihill
//  2007-07-24
//

// namespace to protect all the code in here:
var obc = {};

// Internals used for IN/OUT communications:
obc.outstream = 0;
obc.instream = 0;
obc.serverSocket = 0;
// default port set up is 7055:
obc.serverPort = 7055;


// The user provides their own function we'll
// call once we received data.
obc.userReceivedHandler = null;


// Data received, handle and respond:
obc.inputReceived = 
{
    failure: function(message) 
    {
	alert("InputError: "+messge);
    },


    // Handle command frame commands and then return 
    // the return object in the form:
    //
    // returned = {
    //     'result' : 'ok' | 'error',
    //     'replyto' : 'SENDER:xyz' | '',
    //     'data' : '..response..' | '..error message..'
    // }
    //
    // This function will catch any exceptions and 
    // set the result to 'error' with the data 
    // containing the error message.
    //
    // If were given 'SENDER:xyz' then the replyto 
    // will be set to this.
    //
    //
    success: function(data) 
    {
        // The returned data format:
	var rc = {'result':'ok', 'data':'', 'replyto':''};

	try 
	{
	    log.info("calling user handler for: " + data);

	    // Recover the control frame:
	    var data = evalJSON(data);

	    log.info("replyto: " + data['replyto']);
	    log.info("control_frame: " + data['data']);
	    rc['data'] = obc.userReceivedHandler(data['data']);

	    if (data['replyto'] != '')
	    {
  	        rc['replyto'] = data['replyto'];
	    }
	}
	catch (e) 
	{
	    log.info("obc.userReceivedHandler exception - " + e);
	    rc['result'] = 'error';
	    rc['data'] = e;
	}

	return rc;
    }
};



// Internal handler for dealing with socket data pumping actions:
obc.dataRecover = {

    onStartRequest: function(request, context)
    {
    },

    onStopRequest: function(request, context, status)
    {
        // The connection to us has been closed.
	log.info("onDataAvailable: socket connection closed, goodbye.");

	// Finished receiving data, now hand this over to the end user:
        obc.instream.close();
        obc.outstream.close();
    },

    onDataAvailable: function(request, context, inputStream, offset, count)
    {
        // Data has been received, this will be a control frame.
        // Process the frame and then return the response.
        var data = obc.instream.read(count);

	log.info("onDataAvailable: data so far - " + data);
	var returned = obc.inputReceived.success(data);

	// Convert to JSON ready for transmission:
	returned = serializeJSON(returned);

	log.info("onDataAvailable: returning response - " + returned);
	obc.outstream.write(returned, returned.length);
    }
};


obc.acceptListener =
{
    onSocketAccepted : function(socket, transport)
    {
	try 
	{
	    log.info("Got a socket connection from: " + transport.host + ":" + transport.port);

	    // Setup up communications from APP (Manger/Web)->XUL Browser.
	    c = Components.classes["@mozilla.org/scriptableinputstream;1"];
	    var stream = transport.openInputStream(0,0,0);
	    obc.instream = c.createInstance(Components.interfaces.nsIScriptableInputStream);
	    obc.instream.init(stream);

	    // Set up the output stream ready for the reply:
	    obc.outstream = transport.openOutputStream(0,0,0);

	    // Set up the full data recovery so the user doesn't need to
	    // worry about this. The end user will receive the complete
	    // message after all data is in.
	    c = Components.classes["@mozilla.org/network/input-stream-pump;1"];
	    var pump = c.createInstance(Components.interfaces.nsIInputStreamPump);
	    pump.init(stream, -1, -1, 0, 0, false);
	    pump.asyncRead(obc.dataRecover, null);
	    log.info("Set up async reader to handle incomming.");
	} 
	catch(ex2)
	{ 
	    alert("acceptListener: Unable to start receiving remote data: "+ex2); 
	}
    },

    onStopListening : function(socket, status)
    {
	alert("acceptListener: Server stopped listening because - "+status);
    }
};


// Start accepting socket connections from the client or retry an earlier set up attempt.
obc.startAccepting = function()
{
    try 
    {
	// Start listening for control request from APP (Manger/Web)->XUL Browser.
	var c = Components.classes["@mozilla.org/network/server-socket;1"]
	serverSocket = c.createInstance(Components.interfaces.nsIServerSocket);
	serverSocket.init(obc.serverPort, false,-1);
	serverSocket.asyncListen(obc.acceptListener);
    }
    catch (e)
    {
	alert("startAccepting: OBC creation <I:" + host + ", P:" + port + ", IN> err: "+e);
	return false;
    } 
};




// Set up the service for 'out of band' communication. The given host,port 
// should be what the xul app will listen for connections on. The WebApp
// and the AppManager will control the xul browser via this.
//
obc.start = function(port, input_handler) 
{
    if (input_handler)
    {
	log.info("Adding user input handler.");
	obc.userReceivedHandler = input_handler;
    }
    else
    {
	log.info("NO User Handler Provided! One is requred.");
	var msg = "A user handler must be provided!";
	throw new Error(msg, msg);
    }

    obc.serverPort = port;
    log.info("Ready to roll. Starting on port: "+port);
    obc.startAccepting();
};


// Stop receiving requests and clean up. Start could be called again.
obc.stop = function()
{
    if (obc.serverSocket) 
    {
	obc.serverSocket.close();
	obc.serverSocket = 0;
    }
};


