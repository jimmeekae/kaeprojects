import express from 'express';
import { enqueue } from '../queue.js';
import { findChargeByRequestId, createCharge } from '../services/chargeService.js';
import { validateCharge } from '../middleware/validateCharge.js';

const router = express.Router();

router.post('/', validateCharge, (req, res) => {
    const { requestId, amount, phoneNumber, currency, provider } = req.body;
    console.log(`[Charges] POST /charges`, {
        requestId,
        amount,
        phoneNumber,
        currency,
        provider
    });

    const existing = findChargeByRequestId(requestId);

    if (existing) {
        console.log(`[Charges] Idempotent hit`, { requestId, status: existing.status });
        // Check if the new request matches the old one
        if (existing.amount !== amount || existing.currency !== currency || existing.phone_number !== phoneNumber) {
            return res.status(400).json({
                error: "Idempotency Error",
                message: "This requestId was already used for a different transaction amount/currency/phone no."
            });
        }
        return res.json(existing);
    }

    const charge = {
        request_id: requestId,
        amount,
        phone_number: phoneNumber,
        currency,
        provider
    };

    createCharge(charge);
    enqueue(charge);

    console.log(`[Charges] Charge created & queued`, { requestId });

    res.json({ requestId, status: 'PENDING' });
});

router.get('/:requestId', (req, res) => {
    const { requestId } = req.params;

    console.log(`[Charges] GET /charges/${requestId}`);

    const charge = findChargeByRequestId(requestId);

    if (!charge) {
        console.warn(`[Charges] Not found`, { requestId });
        return res.status(404).json({ error: 'Not found' });
    }

    console.log(`[Charges] Status fetched`, {
        requestId,
        status: charge.status
    });

    res.json(charge);
});

export default router;