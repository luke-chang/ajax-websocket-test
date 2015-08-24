$(function() {
  function AJAX(url) {
    this.url = url;
    this.onmessage = null;
    this.readyState = 1;
  }

  AJAX.prototype.send = function(message) {
    var self = this;
    $.ajax(self.url, {
      method: 'get',
      data: {
        'message': message.toString()
      },
      dataType: 'text',
      success: function(data) {
        if (data && self.onmessage) {
          self.onmessage({
            data: data
          });
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log('Ajax Error: ' + errorThrown);
      }
    });
  };

  //////////////////////////////////////

  var protocols = {
    socket: new WebSocket('ws://localhost:8080/', 'echo-protocol'),
    ajax: new AJAX('ajax.html')
  };

  $.each(protocols, function(key, value) {
    value.onmessage = function(evt) {
      var data = evt.data;
      console.log(key + ' echo: ' + data);
    };
  });

  $('#btnEcho').click(function() {
    var protocol = protocols[$('input[name="protocol"]:checked').val()];
    if(protocol.readyState != 1) {
      console.log('ERROR: readyState=' + socket.readyState);
      return;
    }
    protocol.send(new Date());
  });

  $('#secKeyboard button').click(function(evt) {
    var detail = {
      type: 'keydown',
      key: $(this).data('key')
    };
    console.log(detail);
    protocols[$('input[name="protocol"]:checked').val()].send(JSON.stringify(detail));
  });

  /////////////////////////////////////

  (function TouchPanel() {
    var CLICK_TIME_THRESHOLD = 200;
    var CLICK_MOVE_THRESHOLD = 5;

    var waitForClickTimer, identifier;
    var startX, startY, panelX, panelY, panelWidth, panelHeight;
    var prevDx, prevDy, hasMouseDown;

    $('#touchPanel')
      .mousedown(function(evt) {
        if (evt.button != 0) {
          return true;
        }
        hasMouseDown = true;
        return onStart(evt.clientX, evt.clientY);
      })
      .mousemove(function(evt) {
        if (! hasMouseDown) {
          return true;
        }
        return onMove(evt.clientX, evt.clientY);
      })
      .mouseup(function(evt) {
        if (evt.button != 0) {
          return true;
        }
        hasMouseDown = false;
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
      .bind('touchmove touchend', function(evt) {
        var touches = evt.originalEvent.changedTouches;
        var touch = Array.from(touches).find(function(elem) {
          return elem.identifier == identifier;
        });
        if (!touch) {
          return false;
        }
        if (evt.type == 'touchend') {
          identifier = undefined;
          return onEnd(touch.pageX - panelX, touch.pageY - panelY);
        }
        return onMove(touch.pageX - panelX, touch.pageY - panelY);
      });

    $(window).resize(function() {
      var $touchPanel = $('#touchPanel');
      panelX = Math.round($touchPanel.offset().left);
      panelY = Math.round($touchPanel.offset().top);
      panelWidth = $touchPanel.width();
      panelHeight = $touchPanel.height();
    }).triggerHandler('resize');

    function onStart(x, y) {
      startX = x;
      startY = y;

      waitForClickTimer = setTimeout(function() {
        waitForClickTimer = null;
        handleTouch('start', 0, 0);
      }, CLICK_TIME_THRESHOLD);

      return false;
    }

    function onMove(x, y) {
      var dx = x - startX;
      var dy = y - startY;

      if (waitForClickTimer) {
        if (Math.abs(dx) <= CLICK_MOVE_THRESHOLD &&
            Math.abs(dy) <= CLICK_MOVE_THRESHOLD) {
          return false;
        }
        clearTimeout(waitForClickTimer);
        waitForClickTimer = null;
        handleTouch('start', 0, 0);
      }

      handleTouch('move', dx, dy);
      return false;
    }

    function onEnd(x, y) {
      var dx = x - startX;
      var dy = y - startY;

      if (waitForClickTimer) {
        clearTimeout(waitForClickTimer);
        waitForClickTimer = null;
        handleTouch('click');
      } else {
        handleTouch('end', dx, dy);
      }

      return false;
    }

    function handleTouch(type, dx, dy) {
      if (type == 'start') {
        prevDx = undefined;
        prevDy = undefined;
      } else if (type == 'move' && dx === prevDx && dy === prevDy) {
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
      protocols[$('input[name="protocol"]:checked').val()].send(JSON.stringify(detail));
    }
  })();
});
