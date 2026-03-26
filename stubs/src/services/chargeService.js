import { db } from '../db.js';

export function findChargeByRequestId(requestId) {
    return db.prepare(`SELECT * FROM charges WHERE request_id = ?`).get(requestId);
}

export function createCharge(charge) {
    db.prepare(`
    INSERT INTO charges (request_id, amount, phone_number, currency, provider, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(charge.request_id, charge.amount, charge.phone_number, charge.currency, charge.provider, 'PENDING');
}