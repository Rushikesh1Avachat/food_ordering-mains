
import { stripe } from "@/stripe-server";

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();

    if (!amount) {
      return new Response(JSON.stringify({ error: "Amount is required" }), { status: 400 });
    }

    const customer = await stripe.customers.create();

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2025-08-27.basil" }
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents
      currency: "usd",
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
    });

    return new Response(
      JSON.stringify({
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customer.id,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Stripe API error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500 }
    );
  }
}
