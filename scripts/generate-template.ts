/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WIP_HEADERS, UNIT_CLOSE_HEADERS } from '../src/types.js';
import { INITIAL_WIP_DATA, INITIAL_CLOSED_DATA } from '../server/initialData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateTemplate() {
  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const wb = XLSX.utils.book_new();

  // 1. WIP Sheet
  const wipRows = [
    WIP_HEADERS,
    ...INITIAL_WIP_DATA.map((item) => WIP_HEADERS.map((h) => String(item[h] ?? ''))),
  ];
  const wsWip = XLSX.utils.aoa_to_sheet(wipRows);
  XLSX.utils.book_append_sheet(wb, wsWip, 'WIP');

  // 2. UNIT_CLOSE Sheet
  const closeRows = [
    UNIT_CLOSE_HEADERS,
    ...INITIAL_CLOSED_DATA.map((item) => UNIT_CLOSE_HEADERS.map((h) => String(item[h] ?? ''))),
  ];
  const wsClose = XLSX.utils.aoa_to_sheet(closeRows);
  XLSX.utils.book_append_sheet(wb, wsClose, 'UNIT_CLOSE');

  const outputPath = path.resolve(publicDir, 'BPMS_WO_DATABASE_TEMPLATE.xlsx');
  XLSX.writeFile(wb, outputPath);
  console.log(`[BPMS] Template spreadsheet generated at: ${outputPath}`);
}

generateTemplate();
