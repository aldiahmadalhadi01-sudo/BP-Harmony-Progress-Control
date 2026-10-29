/**
 * GOOGLE APPS SCRIPT: SETUP DATABASE BPMS_WO_DATABASE
 *
 * Cara Menggunakan:
 * 1. Buka https://script.google.com/home/start atau di Google Spreadsheet Anda (Extensions > Apps Script).
 * 2. Hapus kode default dan tempel kode di bawah ini.
 * 3. Klik tombol "Run" (Jalankan) pada fungsi 'createBpmsDatabase'.
 * 4. Berikan izin akses (Review Permissions).
 * 5. Spreadsheet 'BPMS_WO_DATABASE' akan langsung dibuat di Google Drive Anda lengkap dengan kedua worksheet WIP dan UNIT_CLOSE beserta data contoh!
 */

function createBpmsDatabase() {
  var ss = SpreadsheetApp.create('BPMS_WO_DATABASE');

  // 1. Worksheet WIP
  var wipSheet = ss.getActiveSheet();
  wipSheet.setName('WIP');

  var wipHeaders = [
    'no_wo', 'tanggal_estimasi', 'tanggal_in', 'estimasi_selesai', 'no_polisi',
    'tipe_kendaraan', 'nama_customer', 'no_hp', 'asuransi', 'item_jasa',
    'item_part', 'tambahan_jasa', 'tambahan_part', 'vendor', 'progress',
    'job_stopped', 'keterangan', 'created_at', 'updated_at'
  ];

  wipSheet.appendRow(wipHeaders);
  wipSheet.getRange(1, 1, 1, wipHeaders.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
  wipSheet.setFrozenRows(1);

  // Sample row for WIP
  wipSheet.appendRow([
    'WO-2026-1001', '2026-10-20', '2026-10-20', '2026-10-28', 'B 1842 KFL',
    'Toyota Kijang Innova Zenix 2.0 V', 'Hendra Gunawan', '081288992233', 'Asuransi Astra (Garda Oto)',
    'Perbaikan bumper depan robek\nKetok kap mesin\nCat oven fender', 'Klip bumper depan (6 pcs)',
    'Poles all body', '', 'Bengkel Internal (Main Shop)', 'Finishing & QC',
    'TIDAK', 'Tunggu pengeringan clear coat & detailing akhir',
    new Date().toISOString(), new Date().toISOString()
  ]);

  // 2. Worksheet UNIT_CLOSE
  var closeSheet = ss.insertSheet('UNIT_CLOSE');

  var closeHeaders = [
    'no_wo', 'tanggal_estimasi', 'tanggal_in', 'estimasi_selesai', 'no_polisi',
    'tipe_kendaraan', 'nama_customer', 'no_hp', 'asuransi', 'item_jasa',
    'item_part', 'tambahan_jasa', 'tambahan_part', 'vendor', 'progress',
    'job_stopped', 'keterangan', 'created_at', 'updated_at',
    'aktual_unit_selesai', 'ontime_delivery', 'closed_at'
  ];

  closeSheet.appendRow(closeHeaders);
  closeSheet.getRange(1, 1, 1, closeHeaders.length).setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff');
  closeSheet.setFrozenRows(1);

  // Sample row for UNIT_CLOSE
  closeSheet.appendRow([
    'WO-2026-0988', '2026-10-02', '2026-10-02', '2026-10-10', 'B 1324 PQS',
    'Honda Brio RS CVT', 'Kartika Sari', '081234567890', 'Asuransi Astra (Garda Oto)',
    'Cat bumper belakang\nPoles bodi', 'Sensor parkir 2 pcs', '', '',
    'Bengkel Internal (Main Shop)', 'Cuci & Siap Delivery', 'TIDAK',
    'Pengerjaan lancar, diserahterimakan ke konsumen',
    new Date().toISOString(), new Date().toISOString(),
    '2026-10-09', 'YA', new Date().toISOString()
  ]);

  Logger.log('Spreadsheet ID: ' + ss.getId());
  Logger.log('Spreadsheet URL: ' + ss.getUrl());
}
