// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

$(document).ready(function() {
  var s = document.createElement("script");
  s.type = "text/javascript";
  s.src = "app/javascript/jstree.js";
  $("head").append(s);
  
  $('#btn-select-source').on('click', function() {
    $('#treeview-modal').modal('show');

    var treeview = new TreeView({
      $el: $('#treeview-modal').find('.treeview')
    })
  });
})