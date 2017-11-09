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
      var rows = [];
      api.send('GET', '/sheets/' + targetSheet, {}, function(targetSheetData) {
        console.log(targetSheetData);
        $('#app-status').show();
        $('#app-status-message').html("Getting target sheet...");
        var count = 0;
        var sourceTargetColumnMap = {};
        for (var i = 0; i < sourceSheets.length; i++) {
          api.send('GET', '/sheets/' + sourceSheets[i], {}, function(sheetData) {
            count++;
            $('#app-status-message').html("Getting source sheets...");
            var estimatorColumnId = null, qtyColumnId = null;
            sourceTargetColumnMap[sheetData.id] = {};
            console.log(sheetData);
            for (var j = 0; j < sheetData.columns.length; j++) {
              if (sheetData.columns[j].title === 'Estimator') {
                estimatorColumnId = sheetData.columns[j].id;
              }
              if (sheetData.columns[j].title === 'QTY') {
                qtyColumnId = sheetData.columns[j].id;
              }
              for (var k = 0; k < targetSheetData.columns.length; k++) {
                if (sheetData.columns[j].title === targetSheetData.columns[k].title) {
                  sourceTargetColumnMap[sheetData.id][sheetData.columns[j].id] =
                    targetSheetData.columns[k].id;
                }
              }
            }

            console.log(sourceTargetColumnMap);
  
            if (!estimatorColumnId) {
              alert('Unable to find Estimator column for ' + sheetData.name);
            } else {
              // get copy rows
              for (var k = 0; k < sheetData.rows.length; k++) {
                var row = sheetData.rows[k], cells = [], ssRow = false;
                for (var l = 0; l < row.cells.length; l++) {
                  var cell = {};
                  cell.columnId = sourceTargetColumnMap[sheetData.id][row.cells[l].columnId];
                  cell.value = row.cells[l].value;
                  cell.displayValue = row.cells[l].displayValue;

                  if (row.cells[l].columnId === estimatorColumnId && row.cells[l].value === 'SS') {
                    ssRow = true;
                  }
                  if (cell.value) {
                    cells.push(cell);
                  }
                }

                if (ssRow) {
                  rows.push({'toBottom': true, 'cells': cells});
                }
              }
              console.log(rows);
            }

            if (count === sourceSheets.length) {
              // create new rows in target sheets
              api.send('POST', '/sheets/' + targetSheet + '/rows',
              {data: JSON.stringify(rows)},
              function(resp) {
                  console.log(resp);
                  $('#app-status-message').html("Done.");
                }
              );
            }
          });
        }
      })
    }
  });
})