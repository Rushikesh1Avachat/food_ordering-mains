import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
apiVersion: "2025-08-27.basil", // Updated to match the expected version
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_method_id, payment_intent_id, customer_id, client_secret } = body;

    // Validate required fields
    if (!payment_method_id || !payment_intent_id || !customer_id || !client_secret) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Attach payment method to customer
    const paymentMethod = await stripe.paymentMethods.attach(payment_method_id, {
      customer: customer_id,
    });

    // Confirm the payment intent
 const paymentIntent = await stripe.paymentIntents.confirm(payment_intent_id, {
      payment_method: paymentMethod.id,
    });

    if (paymentIntent.status === "succeeded") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment successful",
          result: { client_secret: paymentIntent.client_secret },
        }),
        { status: 200 }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Payment not successful", status: paymentIntent.status }),
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Payment error:", error.message);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: error.message }),
      { status: 500 }
    );
  }
}