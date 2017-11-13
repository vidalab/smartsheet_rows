var TreeView = function(options){
  var self = this;
  this.$el = options.$el;
  this.multiple = options.multiple;

  this.getHomeData(function(data) {
    self.data = data;
    self.treeview = self.renderTreeView(self.$el);
  });

  this.selectedSheets = [];

  $('.search-input').unbind()
    .keyup( function (e){
      var keywords = $(this).val()
      if (e.keyCode == 13 || (keywords.length == 0 && e.keyCode == 8)) {
        self.$el.jstree(true).show_all();
        $('.btn-search i').addClass('fa-spinner fa-spin').removeClass('fa-search');
        _.defer(function(){ // need this to show the changes in UI
          self.treeview.search( keywords )
          $('.btn-search i').removeClass('fa-spinner fa-spin').addClass('fa-search');
        })        
      }
      e.preventDefault()
    })
    
  $('.btn-search').unbind()
    .click( function (e) {
      $('.btn-search i').addClass('fa-spinner fa-spin').removeClass('fa-search');
      _.defer(function(){ // need this to show the changes in UI
        self.treeview.search( $('.search-input').val() )
        $('.btn-search i').removeClass('fa-spinner fa-spin').addClass('fa-search');
      })
    })
}

TreeView.prototype.getHomeData = function(callback) {
  var api = new SmartsheetApi()
  api.send('GET', '/home', {}, callback);
}

TreeView.prototype.renderTreeView = function ($el){
  var self = this,
      homeData = this.data;

  self.$el.unbind().removeData().jstree({
    "search": {
      "show_only_matches": true
    },
    "plugins" : ["sort", "wholerow", "search"],
    'core': {
      "multiple" : self.multiple,
      'data': [
        {'text': 'Sheets', "state" : {"opened" : true }, "children": self.getTreeviewData({sheets: homeData.sheets, folders: homeData.folders})},
        {'text': 'Workspaces', "state" : {"opened" : true }, "children": self.getTreeviewData(homeData.workspaces, {icon: 'icon-workspace'}), "icon": "icon-workspace" }
      ]

    }
  })
  .on("changed.jstree", function (e, data) {
    if (data.node.data) {
      var sheetId = data.node.data.sheetId,
          sheetName = data.node.data.sheetName;
      if (data.action === 'select_node') {
        if (data.selected.length === 1) {
          self.selectedSheets = [];
        }
        self.selectedSheets.push({sheetId: sheetId, sheetName: sheetName});
      } else if (data.action === 'deselect_node') {
        for (var i = 0; i < self.selectedSheets.length; i++) {
          if (self.selectedSheets[i].sheetId === sheetId) {
            self.selectedSheets.splice(i, 1);
            break;
          }
        }
      }
    }
  })

  return $el.jstree(true)
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