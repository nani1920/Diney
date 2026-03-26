import Razorpay from 'razorpay';

export const getRazorpay = (customKeys?: { keyId: string, keySecret: string }) => {
    const key_id = customKeys?.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder';
    const key_secret = customKeys?.keySecret || process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';
    
    return new Razorpay({
        key_id,
        key_secret,
    });
};
