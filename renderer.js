// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

var newTargetRows = [1985589486610308, 6489189113980804, 4237389300295556, 8740988927666052, 156002137991044, 4659601765361540, 2407801951676292, 6911401579046788, 4911828014786436, 2660028201101188, 7163627828471684, 1534128294258564, 6037727921629060, 3785928107943812, 8289527735314308, 971178340837252];

var expandRows = function(targetSheet, newTargetRows, callback) {
  console.log(newTargetRows);
  var api = new SmartsheetApi
  api.send('GET', '/sheets/' + targetSheet, {}, function(targetSheetData) {
    var qtyColumnId = null, idNameColumnId = null;
    for (var i = 0; i < targetSheetData.columns.length; i++) {
      if (targetSheetData.columns[i].title === 'QTY') {
        qtyColumnId = targetSheetData.columns[i].id;
      }
      if (targetSheetData.columns[i].title === 'Identifier Name') {
        idNameColumnId = targetSheetData.columns[i].id;
      }
    }

    if (!qtyColumnId) {
      $('#app-status-message').html("Cannot find QTY column in target sheet.");
      return;
    }

    if (!qtyColumnId) {
      $('#app-status-message').html("Cannot find Identifier Name column in target sheet.");
      return;
    }

    var expandedRows = [];
    for (var i = 0; i < targetSheetData.rows.length; i++) {
      var row = targetSheetData.rows[i];
      if (newTargetRows.indexOf(targetSheetData.rows[i].id) !== -1) {
        var validCells = [];
        for (var j = 0; j < row.cells.length; j++) {
          if (row.cells[j].value) {
            validCells.push(row.cells[j]);
          }
        }
        for (var j = 0; j < row.cells.length; j++) {
          if (row.cells[j].columnId === qtyColumnId && +row.cells[j].value > 1) {
            console.log(row);
            for (var k = 1; k < +row.cells[j].value; k++) {
              expandedRows.push({'siblingId': row.id, 'cells': validCells})
            }
          }
        }
      }
    }
    console.log(expandedRows);

    var newRows = [];

    function addRow(count) {
      if (count < expandedRows.length) {
        api.send('POST', '/sheets/' + targetSheet + '/rows',
          {data: JSON.stringify(expandedRows[count])},
          function(resp){
            console.log(resp);
            newRows.push(resp.result.id);
            addRow(count + 1);
          }
        );
      } else {
        callback(newRows);
      }
    }

    addRow(0);
  });
}

var updateRowIds = function(targetSheet, newTargetRows, callback) {
  var api = new SmartsheetApi
  api.send('GET', '/sheets/' + targetSheet, {}, function(targetSheetData) {
    console.log(targetSheetData);

    var elevationColumnId = null, floorColumnId = null, idNameColumnId = null;

    for (var i = 0; i < targetSheetData.columns.length; i++) {
      var col = targetSheetData.columns[i];
      if (col.title === 'Elevation') {
        elevationColumnId = col.id;
      }
      if (col.title === 'Floor') {
        floorColumnId = col.id;
      }
      if (col.title === 'Identifier Name') {
        idNameColumnId = col.id;
      }
    }

    var newIdRows = [], qtyCount = 1, currentIdName = '';
    for (var i = 0; i < targetSheetData.rows.length; i++) {
      var row = targetSheetData.rows[i];
      if (newTargetRows.indexOf(row.id) !== -1) {
        var newIdCells = [];
        // find elevation cell, floor cell, identifier name cell
        var elevation, floor, idName;
        for (var j = 0; j < row.cells.length; j++) {
          var cell = row.cells[j];
          if (cell.columnId === elevationColumnId) {
            elevation = cell.value;
          }
          if (cell.columnId === floorColumnId) {
            floor = cell.value;
          }
          if (cell.columnId === idNameColumnId) {
            idName = cell.value;
          }
        }
        var newIdName = '';
        if (floor) {
          newIdName = floor + '-' + idName;
        } else {
          newIdName = idName;
        }
        if (elevation) {
          newIdName = newIdName + '-' + elevation.substring(0, 1);
        }
        if (newIdName !== currentIdName) {
          qtyCount = 1;
          currentIdName = newIdName;
        } else {
          qtyCount++;
        }
        newIdName += qtyCount;

        newIdRows.push({'id': row.id, 'cells': [{columnId: idNameColumnId, value: newIdName}]});
      }
    }
    console.log(newIdRows);
    api.send('PUT', '/sheets/' + targetSheet + '/rows',
      {data: JSON.stringify(newIdRows)},
      function(resp) {
        console.log(resp);
        callback();
      }
    )
  });
}

$(document).ready(function() {
  var s = document.createElement("script");
  s.type = "text/javascript";
  s.src = "app/javascript/jstree.js";
  $("head").append(s);
  
  $('#btn-select-source').on('click', function() {
    $('#treeview-modal').modal('show');

    var treeview = new TreeView({
      $el: $('#treeview-modal').find('.treeview'),
      multiple: true
    });

    $('#btn-done').off().on('click', function() {
      var sheetIds = [];
      $('#source-sheet-names').html('');
      $('#selected-source-sheets').val(sheetIds);
      for (var i = 0; i < treeview.selectedSheets.length; i++) {
        if ($('#source-sheet-names').html() !== '') {
          $('#source-sheet-names').html($('#source-sheet-names').html() + ', ');
        }
        $('#source-sheet-names').html($('#source-sheet-names').html() + treeview.selectedSheets[i].sheetName);
        sheetIds.push(treeview.selectedSheets[i].sheetId);
      }
      $('#selected-source-sheets').val(sheetIds);
    });
  });

  $('#btn-select-target').on('click', function() {
    $('#treeview-modal').modal('show');

    var treeview = new TreeView({
      $el: $('#treeview-modal').find('.treeview'),
      multiple: false
    });

    $('#btn-done').off().on('click', function() {
      var sheetIds = [];
      $('#target-sheet-name').html('');
      $('#selected-target-sheet').val(sheetIds);
      for (var i = 0; i < treeview.selectedSheets.length; i++) {
        if ($('#target-sheet-name').html() !== '') {
          $('#target-sheet-name').html($('#target-sheet-name').html() + ', ');
        }
        $('#target-sheet-name').html($('#target-sheet-name').html() + treeview.selectedSheets[i].sheetName);
        sheetIds.push(treeview.selectedSheets[i].sheetId);
      }
      $('#selected-target-sheet').val(sheetIds);
    });
  });

  $('#btn-copy-expand').on('click', function() {
    var sourceSheetsVal = $('#selected-source-sheets').val(),
        targetSheet = $('#selected-target-sheet').val();
    
    if (sourceSheetsVal && targetSheet) {
      sourceSheets = sourceSheetsVal.split(',');
      var api = new SmartsheetApi;
      var sheetIdRows = {};
      api.send('GET', '/sheets/' + targetSheet, {}, function(targetSheetData) {
        console.log(targetSheetData);
        $('#app-status').show();
        $('#app-status-message').html("Getting target sheet...");
        var count = 0;
        for (var i = 0; i < sourceSheets.length; i++) {
          api.send('GET', '/sheets/' + sourceSheets[i], {}, function(sheetData) {
            count++;
            $('#app-status-message').html("Getting source sheets...");
            var estimatorColumnId = null;
            console.log(sheetData);
            for (var j = 0; j < sheetData.columns.length; j++) {
              if (sheetData.columns[j].title === 'Estimator') {
                estimatorColumnId = sheetData.columns[j].id;
              }
            }
  
            if (!estimatorColumnId) {
              alert('Unable to find Estimator column for ' + sheetData.name);
            } else {
              // get copy rows
              var rows = [];
              for (var k = 0; k < sheetData.rows.length; k++) {
                var row = sheetData.rows[k], ssRow = false;
                for (var l = 0; l < row.cells.length; l++) {
                  if (row.cells[l].columnId === estimatorColumnId && row.cells[l].value === 'SS') {
                    ssRow = true;
                  }
                }

                if (ssRow) {
                  rows.push(row.id);
                }
              }
              console.log(rows);
              sheetIdRows[sheetData.id] = rows;
            }

            if (count === sourceSheets.length) {
              var newTargetRows = [];
              function copyRows(cCount) {
                if (cCount === sourceSheets.length) {
                  expandRows(targetSheet, newTargetRows, function(newRows) {
                    newTargetRows = newTargetRows.concat(newRows);
                    updateRowIds(targetSheet, newTargetRows, function() {
                      $('#app-status-message').html("Done.");
                    });
                  });

                  return;
                } else {
                  var sheetId = sourceSheets[cCount],
                      cRows = {'rowIds': sheetIdRows[sheetId], 'to': {'sheetId': targetSheet}};
                  api.send('POST', '/sheets/' + sheetId + '/rows/copy?include=attachments,discussions',
                    {data: JSON.stringify(cRows)},
                    function(resp) {
                      console.log(resp);
                      if (resp && resp.rowMappings) {
                        for (var j = 0; j < resp.rowMappings.length; j++) {
                          newTargetRows.push(resp.rowMappings[j].to);
                        }
                      }
                      copyRows(cCount + 1);
                    }
                  )
                }
              }

              copyRows(0)
            }
          });
        }
      })
    }
  });
})