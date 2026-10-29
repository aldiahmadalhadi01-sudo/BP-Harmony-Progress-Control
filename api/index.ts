/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';
import { apiRouter } from '../server/apiRouter.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle API requests
app.use('/api', apiRouter);

// Fallback for direct /api/... calls in Vercel serverless
app.use('/', apiRouter);

export default app;
