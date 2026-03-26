import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db.js';
import app from '../src/index.js';
import { stopWorker } from '../src/workers/chargeWorker.js';

describe('Idempotency Tests', () => {
    let server;
    let baseUrl;

    before(async() => {
        return new Promise((resolve) => {
            // Start server on random port
            server = app.listen(0, () => {
                const port = server.address().port;
                baseUrl = `http://localhost:${port}`;
                resolve();
            });
        });
    });

    after(async() => {
        // Signal worker to stop
        stopWorker();

        // Close the server
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }

        // Close DB handle (Crucial for SQLite)
        if (db && typeof db.close === 'function') {
            db.close();
        }

        // Small delay to let the event loop clear
        await new Promise(r => setTimeout(r, 100));
    });

    test('Sequential: should return consistent data for same requestId', async() => {
        const requestId = `seq-${Date.now()}`;
        const payload = {
            requestId,
            amount: 100,
            phoneNumber: '+254700000000',
            currency: 'KES',
            provider: 'PROVIDER_ALPHA'
        };

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Connection': 'close' // Prevent keep-alive hang
            },
            body: JSON.stringify(payload)
        };

        const res1 = await fetch(`${baseUrl}/charges`, options);
        const body1 = await res1.json();

        const res2 = await fetch(`${baseUrl}/charges`, options);
        const body2 = await res2.json();

        const id1 = body1.requestId || body1.request_id;
        const id2 = body2.requestId || body2.request_id;

        assert.strictEqual(id1, id2, 'IDs should match');

        const rows = db.prepare(`SELECT * FROM charges WHERE request_id = ?`).all(requestId);
        assert.strictEqual(rows.length, 1, 'Duplicate found in DB');
    });


});