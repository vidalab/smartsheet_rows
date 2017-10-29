BASE_API_URL = "https://api.smartsheet.com/2.0";

var TreeView = function(options){
  var self = this;
  this.$el = options.$el;

  this.getHomeData(function(data) {
    self.data = data;
    self.treeview = self.renderTreeView(self.$el);
  });
}

TreeView.prototype.getHomeData = function(callback) {
  var apiToken = $('#api-key').val();
  $.ajax({
    url: BASE_API_URL + '/home',
    type: 'GET',
    beforeSend: function(xhr){
      xhr.setRequestHeader('Authorization', 'Bearer ' + apiToken);
      xhr.setRequestHeader('Content-Type', 'application/json')
    },
    success: function(data) {
      callback(data);
    }
  })
}

TreeView.prototype.renderTreeView = function ($el){
  var self = this,
      homeData = this.data;

  console.log(homeData);

  $(".treeview").unbind().removeData().jstree({
    "search": {
      "show_only_matches": true
    },
    "plugins" : ["sort", "wholerow", "search"],
    'core': {
      "multiple" : false,
      'data': [
        {'text': 'Sheets', "state" : {"opened" : true }, "children": self.getTreeviewData({sheets: homeData.sheets, folders: homeData.folders})},
        {'text': 'Workspaces', "state" : {"opened" : true }, "children": self.getTreeviewData(homeData.workspaces, {icon: 'icon-workspace'}), "icon": "icon-workspace" }
      ]

    }
  })
  .on("changed.jstree", function (e, data) {
    console.log(data);
  })
}

TreeView.prototype.getTreeviewData = function(folders, options) {
  var sheets = [], subfolders = [], treeviewData = []
  var self = this

  if (!folders.sheets && !folders.reports && !folders.folders) {
    // first time with folders being workspaces
    subfolders = folders
  } else {
    sheets = folders.sheets
    subfolders = folders.folders
    reports = folders.reports || []
  }

  if (sheets && sheets.length > 0) {
    sheets.forEach(function (s){
      var icon = s.report ? "icon-report" : "icon-sheet",    // Some reports are merged at /Sheets
          readonly = (s.accessLevel !== "ADMIN" && s.accessLevel !== "OWNER") ? "readonly": ""
      // if(!s.report){
        treeviewData.push({
          id: 'node-' + s.id, text: s.name, icon: icon, "li_attr": {"class": readonly}, data: {sheetId: s.id, sheetName: s.name}
        })        
      // }
    })
  }
  
  if(reports && reports.length > 0){
    reports.forEach(function (s){
      var icon = s.report ? "icon-report" : "icon-sheet",    // Some reports are merged at /Sheets
          readonly = (s.accessLevel !== "ADMIN" && s.accessLevel !== "OWNER") ? "readonly": ""
      // if(!s.report){
        treeviewData.push({
          id: 'node-' + s.id, text: s.name, icon: icon, "li_attr": {"class": readonly}, data: {sheetId: s.id, sheetName: s.name}
        })        
      // }
    })
  }

  if (subfolders && subfolders.length > 0) {
    subfolders.forEach(function (f){
      var node = { text: _.escape(f.name), children: self.getTreeviewData(f) }
      if (options && options.icon) {
        node.icon = options.icon
      }
      treeviewData.push( node )
    })
  }
  return treeviewData
}