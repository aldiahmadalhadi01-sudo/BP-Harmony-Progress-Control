/**
 * ============================================================================
 * BPMS — GOOGLE APPS SCRIPT WEB APP DATABASE CONNECTOR
 * ============================================================================
 * Script ini dipasang di Google Sheets untuk menghubungkan aplikasi BPMS
 * secara langsung TANPA perlu Google Cloud Service Account ataupun Private Key!
 *
 * CARA MEMASANG (HANYA 1 MENIT):
 * 1. Buka spreadsheet Google Sheets Anda (misal: spreadsheet BPMS_WO_DATABASE).
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 3. Hapus semua kode yang ada di editor, lalu TEMPEL SELURUH KODE INI.
 * 4. Klik tombol "Deploy" (Terapkan) di pojok kanan atas > "New deployment" (Penerapan baru).
 * 5. Klik ikon roda gigi (Select type) > pilih "Web app" (Aplikasi web).
 * 6. Konfigurasi:
 *    - Description: "BPMS Connector"
 *    - Execute as: "Me" (Saya)
 *    - Who has access: "Anyone" (Siapa saja)  <-- PENTING!
 * 7. Klik "Deploy" > Berikan izin (Review Permissions / Izinkan).
 * 8. Salin "Web App URL" (akhiran /exec), lalu masukkan ke aplikasi BPMS!
 * ============================================================================
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
    var data = readSheetData(sheet, WIP_HEADERS);
    return jsonResponse({ success: true, data: data });
  }

  if (action === 'get_closed') {
    var sheet = getOrCreateSheet(ss, 'UNIT_CLOSE', UNIT_CLOSE_HEADERS);
    var data = readSheetData(sheet, UNIT_CLOSE_HEADERS);
    return jsonResponse({ success: true, data: data });
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

  // 1. SETUP WORKSHEETS & HEADERS
  if (action === 'setup') {
    getOrCreateSheet(ss, 'WIP', WIP_HEADERS);
    getOrCreateSheet(ss, 'UNIT_CLOSE', UNIT_CLOSE_HEADERS);
    return jsonResponse({ success: true, message: 'Worksheet WIP dan UNIT_CLOSE berhasil disiapkan!' });
  }

  // 2. CREATE WORK ORDER IN WIP
  if (action === 'create_wip') {
    var item = payload.data;
    if (!item || !item.no_wo) {
      return jsonResponse({ error: 'Data no_wo wajib diisi' }, 400);
    }

    var wipSheet = getOrCreateSheet(ss, 'WIP', WIP_HEADERS);
    var closedSheet = getOrCreateSheet(ss, 'UNIT_CLOSE', UNIT_CLOSE_HEADERS);

    // Duplicate check
    var inWip = findRowIndexByNoWo(wipSheet, item.no_wo);
    var inClosed = findRowIndexByNoWo(closedSheet, item.no_wo);

    if (inWip !== -1 || inClosed !== -1) {
      return jsonResponse({ error: "Nomor WO '" + item.no_wo + "' sudah terdaftar sebelumnya." }, 400);
    }

    var rowValues = WIP_HEADERS.map(function(h) {
      return item[h] !== undefined && item[h] !== null ? String(item[h]) : '';
    });

    wipSheet.appendRow(rowValues);
    return jsonResponse({ success: true, data: item });
  }

  // 3. UPDATE WORK ORDER IN WIP
  if (action === 'update_wip') {
    var no_wo = payload.no_wo;
    var updates = payload.data || {};
    var wipSheet = getOrCreateSheet(ss, 'WIP', WIP_HEADERS);

    var rowIdx = findRowIndexByNoWo(wipSheet, no_wo);
    if (rowIdx === -1) {
      return jsonResponse({ error: "WO '" + no_wo + "' tidak ditemukan di WIP." }, 404);
    }

    // Read current row
    var headers = wipSheet.getRange(1, 1, 1, WIP_HEADERS.length).getValues()[0];
    var currentRowValues = wipSheet.getRange(rowIdx, 1, 1, headers.length).getValues()[0];
    var currentObj = {};
    headers.forEach(function(h, idx) {
      currentObj[h] = currentRowValues[idx];
    });

    for (var key in updates) {
      if (key !== 'no_wo') {
        currentObj[key] = updates[key];
      }
    }
    currentObj['updated_at'] = new Date().toISOString();

    var updatedRowValues = headers.map(function(h) {
      return currentObj[h] !== undefined && currentObj[h] !== null ? String(currentObj[h]) : '';
    });

    wipSheet.getRange(rowIdx, 1, 1, headers.length).setValues([updatedRowValues]);
    return jsonResponse({ success: true, data: currentObj });
  }

  // 4. CLOSE UNIT (MOVE FROM WIP TO UNIT_CLOSE)
  if (action === 'close_unit') {
    var no_wo = payload.no_wo;
    var aktual_selesai = payload.aktual_unit_selesai || new Date().toISOString().slice(0, 10);

    var wipSheet = getOrCreateSheet(ss, 'WIP', WIP_HEADERS);
    var closedSheet = getOrCreateSheet(ss, 'UNIT_CLOSE', UNIT_CLOSE_HEADERS);

    // Check not in UNIT_CLOSE already
    if (findRowIndexByNoWo(closedSheet, no_wo) !== -1) {
      return jsonResponse({ error: "WO '" + no_wo + "' sudah pernah ditutup sebelumnya." }, 400);
    }

    var rowIdx = findRowIndexByNoWo(wipSheet, no_wo);
    if (rowIdx === -1) {
      return jsonResponse({ error: "WO '" + no_wo + "' tidak ditemukan di WIP." }, 404);
    }

    // Read WIP item
    var wipRow = wipSheet.getRange(rowIdx, 1, 1, WIP_HEADERS.length).getValues()[0];
    var obj = {};
    WIP_HEADERS.forEach(function(h, i) {
      obj[h] = wipRow[i] !== undefined ? String(wipRow[i]) : '';
    });

    // Calculate OTD
    var est = obj['estimasi_selesai'] || '';
    var otd = 'TIDAK';
    if (aktual_selesai && est && aktual_selesai <= est) {
      otd = 'YA';
    }

    var nowStr = new Date().toISOString();
    obj['aktual_unit_selesai'] = aktual_selesai;
    obj['ontime_delivery'] = otd;
    obj['closed_at'] = nowStr;
    obj['updated_at'] = nowStr;

    // Append to UNIT_CLOSE
    var closedRow = UNIT_CLOSE_HEADERS.map(function(h) {
      return obj[h] !== undefined && obj[h] !== null ? String(obj[h]) : '';
    });
    closedSheet.appendRow(closedRow);

    // Delete row from WIP
    wipSheet.deleteRow(rowIdx);

    return jsonResponse({ success: true, data: obj });
  }

  return jsonResponse({ error: 'Action tidak dikenal' }, 400);
}

// Helper functions
function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  } else {
    // If empty, add headers
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
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
  var cleanTarget = String(no_wo).trim().toLowerCase();

  for (var i = 0; i < values.length; i++) {
    if (values[i][0] && String(values[i][0]).trim().toLowerCase() === cleanTarget) {
      return i + 2; // 1-based index (header is row 1)
    }
  }
  return -1;
}

function jsonResponse(data, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
