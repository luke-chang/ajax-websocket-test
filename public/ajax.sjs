const Cc = Components.classes;
const CC = Components.Constructor;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
const { SystemAppProxy } = Cu.import("resource://gre/modules/SystemAppProxy.jsm");

function handleClickEvent (event)
{
  let type = 'navigator:browser';
  let shell = Services.wm.getMostRecentWindow(type);
  let document = shell.document;
  let systemApp = document.getElementsByTagName("HTML:IFRAME")[0];
  var domWindowUtils = shell.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                     .getInterface(Components.interfaces.nsIDOMWindowUtils);

  var x = isNaN(getState("x")) ? shell.innerWidth/2 : parseInt(getState("x"));
  var y = isNaN(getState("y")) ? shell.innerHeight/2 : parseInt(getState("y"));

  ["mousedown",  "mouseup"].forEach(function(mouseType) {
    domWindowUtils.sendMouseEvent (
      mouseType,
      x,
      y,
      0,
      0,
      0,
      true
    );
   });
}

function handleTouchEvent (event)
{
  let type = 'navigator:browser';
  let shell = Services.wm.getMostRecentWindow(type);
  let document = shell.document;
  let systemApp = document.getElementsByTagName("HTML:IFRAME")[0];
  var domWindowUtils = shell.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                     .getInterface(Components.interfaces.nsIDOMWindowUtils);

  var x = isNaN(getState("x")) ? shell.innerWidth/2 : parseInt(getState("x"));
  var y = isNaN(getState("y")) ? shell.innerHeight/2 : parseInt(getState("y"));
  var startX = 0;
  var startY = 0;

  let etype;
  switch (event.type) {
    case "touchstart":
      etype = "mousedown";
      startX = x;
      startY = y;
      setState("startX", startX.toString());
      setState("startY", startY.toString());
      break;
    case "touchmove":
      etype = "mousemove";
      startX = parseInt(getState("startX"));
      startY = parseInt(getState("startY"));
      break;
    case "touchend":
      etype = "mouseup";
      startX = parseInt(getState("startX"));
      startY = parseInt(getState("startY"));
      break;
    default:
      return;
  }

  let detail = event.detail;
  x = startX + detail.dx;
  y = startY + detail.dy;

  setState ("x", x.toString());
  setState ("y", y.toString());

  domWindowUtils.sendMouseEvent (
    etype,
    x,
    y,
    0,
    0,
    0,
    true
  );
  // Use SystemAppProxy send
  SystemAppProxy._sendCustomEvent('remote-control-event', { x: x, y: y });
}

function handleKeyboardEvent (keyCodeName)
{
  const nsIDOMKeyEvent = Ci.nsIDOMKeyEvent;
  let type = "navigator:browser";
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
  var queryString = decodeURIComponent(request.queryString.replace(/\+/g, "%20"));

  response.setHeader("Content-Type", "text/html", false);
  response.write(queryString);

  // Split JSON header "message="
  var event = JSON.parse(queryString.substring(8));

  switch (event.type) {
    case "echo":
      dump(event.detail + '\n');
      break;
    case "keypress":
      handleKeyboardEvent(event.detail);
      break;
    case "touchstart":
    case "touchmove":
    case "touchend":
      handleTouchEvent (event);
      break;
    case "click":
      handleClickEvent (event);
      break;
    case "input":
      dump(event.detail + '\n');
      break;
  }
}
