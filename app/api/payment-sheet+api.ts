import { stripe } from "@/stripe-server";


export async function POST(req: Request) {
  const { amount } = await req.json();

  const customer = await stripe.customers.create();
  const ephimeralKey = await stripe.ephemeralKeys.create(
    { customer: customer.id },
    { apiVersion: "2025-08-27.basil" }
  );

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100,
    currency: "usd",
    customer: customer.id,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return Response.json({
    paymentIntent: paymentIntent.client_secret,
    ephimeralKey: ephimeralKey.secret,
    customer: customer.id,
  });
}