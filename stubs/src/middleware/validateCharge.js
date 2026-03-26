export function validateCharge(req, res, next) {
    const { requestId, amount, phoneNumber, currency, provider } = req.body;

    if (!requestId || typeof requestId !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing requestId' });
    }

    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    if (!phoneNumber || typeof phoneNumber !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing phoneNumber' });
    }

    if (!phoneNumber.startsWith('+') || phoneNumber.length < 10) {
        return res.status(400).json({ error: 'Invalid phoneNumber format' });
    }

    if (!currency || typeof currency !== 'string' || currency.length !== 3) {
        return res.status(400).json({ error: 'Currency must be a 3-letter code' });
    }

    const allowedProviders = ['PROVIDER_ALPHA', 'PROVIDER_BETA'];
    if (!provider || !allowedProviders.includes(provider)) {
        return res.status(400).json({ error: 'Invalid provider' });
    }

    req.body.currency = currency.toUpperCase();

    next();
}