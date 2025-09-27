import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil", // Updated to match the expected version
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, email } = body;

    if (!amount || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount and email" }),
        { status: 400 }
      );
    }

    // Create or retrieve customer
    const customer = await stripe.customers.create({
      email,
    });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      customer: customer.id,
      payment_method_types: ["card"],
    });

    return new Response(
      JSON.stringify({
        paymentIntent: { id: paymentIntent.id, client_secret: paymentIntent.client_secret },
        customer: customer.id,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Create payment intent error:", error.message);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: error.message }),
      { status: 500 }
    );
  }
}