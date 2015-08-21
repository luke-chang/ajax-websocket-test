$(function() {
  var socket = new WebSocket('ws://localhost:8080/', 'echo-protocol');

  socket.onmessage = function(evt) {
    var data = evt.data;
    console.log('WebSocket Echo: ' + data);
  };

  $('#btnWs').click(function() {
    if(socket.readyState != 1) {
      console.log('WebSocket readyState=' + socket.readyState);
      return;
    }

    socket.send(new Date());
  });

  //////////////////////////////////////

  $('#btnAjax').click(function() {
    $.ajax('ajax.html', {
      method: 'get',
      data: {
        'message': new Date().toString()
      },
      dataType: 'text',
      success: function(data) {
        console.log('Ajax Echo: ' + data);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log('Ajax Error: ' + errorThrown);
      }
    });
  });

  /////////////////////////////////////

  (function TouchPanel() {
    var CLICK_TIME_THRESHOLD = 200;
    var CLICK_MOVE_THRESHOLD = 5;

    var startTime = 0, waitForClick = false;
    var startX, startY, panelX, panelY, panelWidth, panelHeight;
    var identifier = undefined, prevDx, prevDy;

    var $touchPanel = $('#touchPanel');

    $touchPanel
      .mousedown(function(evt) {
        if (evt.button != 0) {
          return true;
        }
        return onStart(evt.clientX, evt.clientY);
      })
      .mousemove(function(evt) {
        if (! startTime) {
          return true;
        }
        return onMove(evt.clientX, evt.clientY);
      })
      .mouseup(function(evt) {
        if (evt.button != 0) {
          return true;
        }
        return onEnd(evt.clientX, evt.clientY);
      })
      .bind('touchstart', function(evt) {
        if (identifier !== undefined) {
          return false;
        }
        var touches = evt.originalEvent.changedTouches;
        if (touches.length > 1) {
          return true;
        }
        var touch = touches[0];
        identifier = touch.identifier;
        return onStart(touch.pageX - panelX, touch.pageY - panelY);
      })
      .bind('touchmove', function(evt) {
        var touches = evt.originalEvent.changedTouches;
        var touch = Array.from(touches).find(function(elem) {
          return elem.identifier == identifier;
        });
        if (!touch) {
          return false;
        }
        return onMove(touch.pageX - panelX, touch.pageY - panelY);
      })
      .bind('touchend', function(evt) {
        var touches = evt.originalEvent.changedTouches;
        var touch = Array.from(touches).find(function(elem) {
          return elem.identifier == identifier;
        });
        if (!touch) {
          return false;
        }
        identifier = undefined;
        return onEnd(touch.pageX - panelX, touch.pageY - panelY);
      });

    $(window).resize(function() {
      panelX = Math.round($touchPanel.offset().left);
      panelY = Math.round($touchPanel.offset().top);
      panelWidth = $touchPanel.width();
      panelHeight = $touchPanel.height();
    }).triggerHandler('resize');

    function onStart(x, y) {
      startTime = Date.now();
      waitForClick = true;
      startX = x;
      startY = y;
      prevDx = undefined;
      prevDy = undefined;
      return false;
    }

    function onMove(x, y) {
      var dx = x - startX;
      var dy = y - startY;

      if (waitForClick) {
        if (Date.now() - startTime <= CLICK_TIME_THRESHOLD &&
            Math.abs(dx) <= CLICK_MOVE_THRESHOLD &&
            Math.abs(dy) <= CLICK_MOVE_THRESHOLD) {
          return false;
        }
        waitForClick = false;
        handleTouch('start', 0, 0);
      }

      handleTouch('move', dx, dy);
      return false;
    }

    function onEnd(x, y) {
      var dx = x - startX;
      var dy = y - startY;

      if (waitForClick) {
        if (Date.now() - startTime <= CLICK_TIME_THRESHOLD) {
          handleTouch('click');
        }
      } else {
        handleTouch('end', dx, dy);
      }

      startTime = 0;
      return false;
    }

    function handleTouch(type, dx, dy) {
      if (type == 'move' && dx === prevDx && dy === prevDy) {
        return;
      }

      prevDx = dx;
      prevDy = dy;

      var detail = {
        type: type,
        dx: dx,
        dy: dy,
        width: panelWidth,
        height: panelHeight
      };

      console.log(detail);
    }
  })();
});
