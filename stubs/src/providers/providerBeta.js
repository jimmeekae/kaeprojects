import axios from 'axios';
import { sleep } from '../utils/sleep.js';
import { db } from '../db.js';

export class ProviderBeta {
    async initiateCharge(charge) {
        const res = await axios.post('http://localhost:4002/charge', {
            requestId: charge.request_id,
            amount: charge.amount,
            phoneNumber: charge.phone_number,
            currency: charge.currency
        });

        const providerRef = res.data.providerRef;
        charge.provider_ref = providerRef;

        // Start polling in background
        this.pollStatus(charge);

        return providerRef;
    }

    async pollStatus(charge) {
        let delay = 1000;

        for (let i = 0; i < 5; i++) {
            await sleep(delay);

            try {
                const res = await axios.get(`http://localhost:4002/status/${charge.provider_ref}`);
                if (res.data.status !== 'pending') {
                    db.prepare(`UPDATE charges SET status = ? WHERE request_id = ?`)
                        .run(res.data.status, charge.request_id);
                    return;
                }
            } catch (err) {
                console.error('Polling error:', err.message);
            }

            delay *= 2;
        }

        db.prepare(`UPDATE charges SET status = 'failed' WHERE request_id = ?`)
            .run(charge.request_id);
    }
}