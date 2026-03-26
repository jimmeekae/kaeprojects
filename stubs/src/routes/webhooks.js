import express from 'express';
import { db } from '../db.js';

const router = express.Router();

router.post('/provider-alpha', (req, res) => {
    const { providerRef, status } = req.body;

    console.log(`[Webhook][ProviderAlpha] Received callback`, {
        providerRef,
        status
    });

    const result = db.prepare(`
        UPDATE charges SET status = ? WHERE provider_ref = ?
    `).run(status, providerRef);

    console.log(`[Webhook][ProviderAlpha] DB update`, {
        providerRef,
        status,
        rowsAffected: result.changes
    });

    res.sendStatus(200);
});

export default router;