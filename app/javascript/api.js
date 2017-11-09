BASE_API_URL = "https://api.smartsheet.com/2.0";

var SmartsheetApi = function(options){
  self.apiToken = $('#api-key').val();
}

SmartsheetApi.prototype.send = function(method, uri, options = {}, callback) {
  $.ajax({
    url: BASE_API_URL + uri,
    type: method,
    data: options.data,
    beforeSend: function(xhr){
      xhr.setRequestHeader('Authorization', 'Bearer ' + self.apiToken);
      xhr.setRequestHeader('Content-Type', 'application/json')
    },
    success: function(data) {
      callback(data);
    }
  })
}