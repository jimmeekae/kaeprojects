import axios from 'axios';

export class ProviderAlpha {
    async initiateCharge(charge) {
        const res = await axios.post('http://localhost:4001/charge', {
            requestId: charge.request_id,
            amount: charge.amount,
            phoneNumber: charge.phone_number,
            currency: charge.currency
        });

        // Save providerRef to DB
        const providerRef = res.data.providerRef;
        charge.provider_ref = providerRef;

        return providerRef;
    }
}