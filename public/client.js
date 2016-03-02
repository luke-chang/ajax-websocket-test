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
    socket: new WebSocket('wss://localhost:8080/', 'echo-protocol'),
    ajax: new AJAX('https://localhost:8080/ajax.html')
  };

  $.each(protocols, function(key, value) {
    value.onmessage = function(evt) {
      var data = evt.data;
      console.log(key + ' echo: ' + data);
    };
  });

  function sendMessage(type, detail) {
    var protocol = protocols[$('input[name="protocol"]:checked').val()];
    if(protocol.readyState != 1) {
      console.log('ERROR: readyState=' + socket.readyState);
      return;
    }

    data = {
      type: type,
      detail: $.isPlainObject(detail) ? detail : detail.toString()
    };

    console.log(data);
    protocol.send(JSON.stringify(data));
  }

  //////////////////////////////////////

  $('#btnEcho').click(function() {
    sendMessage('echo', new Date());
  });
});
