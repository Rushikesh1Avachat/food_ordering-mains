import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    //@ts-ignore
  apiVersion: '2025-10-16',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { payment_method_id, payment_intent_id, customer_id, client_secret } = req.body;

    if (!payment_method_id || !payment_intent_id || !customer_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Attach payment method to customer
    const paymentMethod = await stripe.paymentMethods.attach(payment_method_id, {
      customer: customer_id,
    });

    // Confirm the payment intent
    const result = await stripe.paymentIntents.confirm(payment_intent_id, {
      payment_method: paymentMethod.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Payment successful',
      result: result,
    });
  } catch (error) {
    console.error('Error paying:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}