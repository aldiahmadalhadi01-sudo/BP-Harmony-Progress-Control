/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const APPS_SCRIPT_CODE = `/**
 * BPMS — GOOGLE APPS SCRIPT WEB APP CONNECTOR
 * Pasang di Google Sheets: Extensions > Apps Script > Paste > Deploy > New Deployment > Web App (Anyone)
 */

var WIP_HEADERS = [
  'no_wo', 'tanggal_estimasi', 'tanggal_in', 'estimasi_selesai', 'no_polisi',
  'tipe_kendaraan', 'nama_customer', 'no_hp', 'asuransi', 'item_jasa',
  'item_part', 'tambahan_jasa', 'tambahan_part', 'vendor', 'progress',
  'job_stopped', 'keterangan', 'created_at', 'updated_at'
];

var UNIT_CLOSE_HEADERS = [
  'no_wo', 'tanggal_estimasi', 'tanggal_in', 'estimasi_selesai', 'no_polisi',
  'tipe_kendaraan', 'nama_customer', 'no_hp', 'asuransi', 'item_jasa',
  'item_part', 'tambahan_jasa', 'tambahan_part', 'vendor', 'progress',
  'job_stopped', 'keterangan', 'created_at', 'updated_at',
  'aktual_unit_selesai', 'ontime_delivery', 'closed_at'
];

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'health';
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === 'health') {
    return jsonResponse({
      status: 'ok',
      connected: true,
      spreadsheet_name: ss.getName(),
      sheets: ss.getSheets().map(function(s) { return s.getName(); })
    });
  }

  if (action === 'get_wip') {
    var sheet = getOrCreateSheet(ss, 'WIP', WIP_HEADERS);
    return jsonResponse({ success: true, data: readSheetData(sheet, WIP_HEADERS) });
  }

  if (action === 'get_closed') {
    var sheet = getOrCreateSheet(ss, 'UNIT_CLOSE', UNIT_CLOSE_HEADERS);
    return jsonResponse({ success: true, data: readSheetData(sheet, UNIT_CLOSE_HEADERS) });
  }

  return jsonResponse({ error: 'Action tidak dikenal' }, 400);
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var payload = {};
  try {
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    return jsonResponse({ error: 'Format JSON payload tidak valid' }, 400);
  }

  var action = payload.action;

  if (action === 'setup') {
    getOrCreateSheet(ss, 'WIP', WIP_HEADERS);
    getOrCreateSheet(ss, 'UNIT_CLOSE', UNIT_CLOSE_HEADERS);
    return jsonResponse({ success: true, message: 'Worksheet WIP dan UNIT_CLOSE berhasil disiapkan!' });
  }

  if (action === 'create_wip') {
    var item = payload.data;
    var wipSheet = getOrCreateSheet(ss, 'WIP', WIP_HEADERS);
    var rowValues = WIP_HEADERS.map(function(h) {
      return item[h] !== undefined && item[h] !== null ? String(item[h]) : '';
    });
    wipSheet.appendRow(rowValues);
    return jsonResponse({ success: true, data: item });
  }

  if (action === 'update_wip') {
    var no_wo = payload.no_wo;
    var updates = payload.data || {};
    var wipSheet = getOrCreateSheet(ss, 'WIP', WIP_HEADERS);
    var rowIdx = findRowIndexByNoWo(wipSheet, no_wo);
    if (rowIdx === -1) return jsonResponse({ error: 'WO tidak ditemukan' }, 404);

    var headers = wipSheet.getRange(1, 1, 1, WIP_HEADERS.length).getValues()[0];
    var currentRowValues = wipSheet.getRange(rowIdx, 1, 1, headers.length).getValues()[0];
    var currentObj = {};
    headers.forEach(function(h, idx) { currentObj[h] = currentRowValues[idx]; });
    for (var key in updates) { if (key !== 'no_wo') currentObj[key] = updates[key]; }
    currentObj['updated_at'] = new Date().toISOString();

    var updatedRowValues = headers.map(function(h) { return currentObj[h] !== undefined ? String(currentObj[h]) : ''; });
    wipSheet.getRange(rowIdx, 1, 1, headers.length).setValues([updatedRowValues]);
    return jsonResponse({ success: true, data: currentObj });
  }

  if (action === 'close_unit') {
    var no_wo = payload.no_wo;
    var aktual_selesai = payload.aktual_unit_selesai || new Date().toISOString().slice(0, 10);
    var wipSheet = getOrCreateSheet(ss, 'WIP', WIP_HEADERS);
    var closedSheet = getOrCreateSheet(ss, 'UNIT_CLOSE', UNIT_CLOSE_HEADERS);

    var rowIdx = findRowIndexByNoWo(wipSheet, no_wo);
    if (rowIdx === -1) return jsonResponse({ error: 'WO tidak ditemukan di WIP' }, 404);

    var wipRow = wipSheet.getRange(rowIdx, 1, 1, WIP_HEADERS.length).getValues()[0];
    var obj = {};
    WIP_HEADERS.forEach(function(h, i) { obj[h] = wipRow[i] !== undefined ? String(wipRow[i]) : ''; });

    var otd = (aktual_selesai && obj['estimasi_selesai'] && aktual_selesai <= obj['estimasi_selesai']) ? 'YA' : 'TIDAK';
    var nowStr = new Date().toISOString();
    obj['aktual_unit_selesai'] = aktual_selesai;
    obj['ontime_delivery'] = otd;
    obj['closed_at'] = nowStr;
    obj['updated_at'] = nowStr;

    var closedRow = UNIT_CLOSE_HEADERS.map(function(h) { return obj[h] !== undefined ? String(obj[h]) : ''; });
    closedSheet.appendRow(closedRow);
    wipSheet.deleteRow(rowIdx);

    return jsonResponse({ success: true, data: obj });
  }

  return jsonResponse({ error: 'Action tidak dikenal' }, 400);
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readSheetData(sheet, defaultHeaders) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];
  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0];
  var results = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row || !row[0] || String(row[0]).trim() === '') continue;
    var item = {};
    defaultHeaders.forEach(function(h) {
      var idx = headers.indexOf(h);
      item[h] = idx !== -1 && row[idx] !== undefined ? String(row[idx]).trim() : '';
    });
    results.push(item);
  }
  return results;
}

function findRowIndexByNoWo(sheet, no_wo) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var target = String(no_wo).trim().toLowerCase();
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] && String(values[i][0]).trim().toLowerCase() === target) {
      return i + 2;
    }
  }
  return -1;
}

function jsonResponse(data, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
`;
