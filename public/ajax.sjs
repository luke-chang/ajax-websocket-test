const Cc = Components.classes;
const CC = Components.Constructor;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import('resource://gre/modules/XPCOMUtils.jsm');

function simpleIME_callback(aTIP, aNotification)
  {
    try {
      switch (aNotification.type) {
        case "request-to-commit":
          aTIP.commitComposition();
          break;
        case "request-to-cancel":
          aTIP.cancelComposition();
          break;
        case "notify-focus":
          this._hasFocus = true;
          break;
        case "notify-blur":
          this._hasFocus = false;
          break;
        case "notify-detached":
          this._hasFocus = false;
          this._hasRightsToCompose = false;
          break;
      }
      return true;
    } catch (e) {
      return false;
    }
 }

function handleTouchEvent (event)
{
	let type = 'navigator:browser';
	let shell = Services.wm.getMostRecentWindow(type);
	let document = shell.document;
	let systemApp = document.getElementsByTagName("HTML:IFRAME")[0];
	var domWindowUtils = shell.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                     .getInterface(Components.interfaces.nsIDOMWindowUtils);


	let etype;
	switch (event.type) {
		case "start":
			etype = "mousedown";
			break;
		case "move":
			etype = "mousemove";
			break;
		case "end":
			etype = "mouseup";
			break;
		default:
			return;
	}

	//etype = "contextmenu";

	/*
	var mouseEvent = document.createEvent ("MouseEvent");
	mouseEvent.initMouseEvent (
		etype,
		true,
		true,
		shell,
		0,
		event.width,
		event.height,
		event.dx,
		event.dy,
		false,
		false,
		false,
		false,
		0,
		null
	);
	//shell.dispatchEvent(mouseEvent);
	var successed = domWindowUtils.dispatchDOMEventViaPresShell (systemApp, mouseEvent, true);
	*/
	domWindowUtils.sendMouseEvent (
		etype,
		event.dx,
		event.dy,
		0,
		0,
		0,
		true
	);
}

function handleKeyboardEvent (keyCodeName)
{
  const nsIDOMKeyEvent = Ci.nsIDOMKeyEvent;
  let type = 'navigator:browser';
  let shell = Services.wm.getMostRecentWindow(type);

  var utils = shell.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                     .getInterface(Components.interfaces.nsIDOMWindowUtils);

  ["keydown",  "keyup"].forEach(function(keyType) {
    var keyCode = nsIDOMKeyEvent[keyCodeName];
    var modifiers = 0;
    var happened = utils.sendKeyEvent(keyType, keyCode, 0, modifiers);
  });
}

function handleRequest(request, response)
{
	response.setHeader("Content-Type", "text/html", false);
	response.write(request.queryString);

	// Split JSON header "message="
	var event = JSON.parse (decodeURIComponent(request.queryString.substring(8)));

	switch (event.type) {
		case "keypress":
			handleKeyboardEvent (event.key);
			break;
		case "start":
		case "move":
		case "end":
			handleTouchEvent (event);
			break;
	}
}
