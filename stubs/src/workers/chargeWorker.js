import { dequeue } from '../queue.js';
import { ProviderAlpha } from '../providers/providerAlpha.js';
import { ProviderBeta } from '../providers/providerBeta.js';
import { db } from '../db.js';

const providers = {
    PROVIDER_ALPHA: new ProviderAlpha(),
    PROVIDER_BETA: new ProviderBeta()
};

let isRunning = false;

export function stopWorker() {
    isRunning = false;
}

export async function startWorker() {
    if (isRunning) return; // Prevent multiple workers
    isRunning = true;
    console.log(`[Worker] Started... waiting for jobs`);

    while (isRunning) {
        const job = dequeue();

        if (!job) {
            // Wait 100ms then check isRunning again
            await new Promise(r => setTimeout(r, 100));
            continue;
        }

        try {
            const provider = providers[job.provider];
            if (!provider) throw new Error('Unsupported provider');

            const providerRef = await provider.initiateCharge(job);
            db.prepare(`UPDATE charges SET provider_ref = ? WHERE request_id = ?`)
                .run(providerRef, job.request_id);

        } catch (err) {
            db.prepare(`UPDATE charges SET status = 'FAILED' WHERE request_id = ?`)
                .run(job.request_id);
        }
    }
    console.log(`[Worker] Stopped safely.`);
}