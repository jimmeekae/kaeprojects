import express from 'express';
import chargesRouter from './routes/charges.js';
import webhooksRouter from './routes/webhooks.js';
import { startWorker } from './workers/chargeWorker.js';

const app = express();
app.use(express.json());

app.use('/charges', chargesRouter);
app.use('/webhooks', webhooksRouter);


const isTestRunner = !!process.env.NODE_TEST_CONTEXT;
console.log("llll" + isTestRunner);
if (!isTestRunner) {
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`Payments service running on port ${PORT}`);
        startWorker();
    });
}

export default app;