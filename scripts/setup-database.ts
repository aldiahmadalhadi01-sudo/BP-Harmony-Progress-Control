/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import dotenv from 'dotenv';
import { sheetsService } from '../server/sheetsService.js';

dotenv.config();

async function run() {
  console.log('========================================================');
  console.log('   BPMS — GOOGLE SHEETS DATABASE INITIALIZATION SCRIPT   ');
  console.log('========================================================');

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!email || !spreadsheetId) {
    console.error('\n❌ ERROR: Kredensial belum lengkap di file .env!');
    console.error('Pastikan variabel berikut sudah terisi:');
    console.error('- GOOGLE_SERVICE_ACCOUNT_EMAIL');
    console.error('- GOOGLE_PRIVATE_KEY');
    console.error('- GOOGLE_SHEETS_SPREADSHEET_ID\n');
    console.log('Petunjuk pembuatan:');
    console.log('1. Buat Google Spreadsheet baru bernama BPMS_WO_DATABASE di Google Drive Anda.');
    console.log(`2. Bagikan (Share) spreadsheet tersebut kepada email service account dengan izin Editor.`);
    console.log('3. Isi variabel di atas pada file .env lalu jalankan script ini kembali.\n');
    process.exit(1);
  }

  console.log(`\nMemeriksa koneksi ke Spreadsheet ID: ${spreadsheetId}...`);
  console.log(`Menggunakan Service Account: ${email}...`);

  const health = await sheetsService.getHealth();
  console.log('Status koneksi:', health.mode);

  console.log('\nMembuat & menyinkronkan worksheet WIP dan UNIT_CLOSE...');
  const setupResult = await sheetsService.setupDatabase();

  if (setupResult.success) {
    console.log('✅ ' + setupResult.message);

    console.log('\nMengisi data awal contoh bengkel (jika kosong)...');
    const seedResult = await sheetsService.seedInitialData();
    console.log('✅ ' + seedResult.message);

    console.log('\n========================================================');
    console.log('🎉 DATABASE GOOGLE SHEETS SIAP DIGUNAKAN!');
    console.log('========================================================\n');
  } else {
    console.error('❌ Gagal: ' + setupResult.message);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Error saat inisialisasi database:', err);
  process.exit(1);
});
