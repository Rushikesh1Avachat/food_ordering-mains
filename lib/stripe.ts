// lib/stripe.ts
import { Platform } from "react-native";
import { loadStripe } from "@stripe/stripe-js";

let stripePromise: any;
if (Platform.OS === "web") {
  stripePromise = loadStripe(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
}

// 👇 Your backend endpoint that creates PaymentIntent
const API_URL = process.env.API_URL!;

export async function pay(amount: number) {
  // 1. Ask your backend for a PaymentIntent
  const res = await fetch(`${API_URL}/create-payment-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  const { clientSecret } = await res.json();

  if (Platform.OS === "web") {
    // 2A. Web confirm payment
    const stripe = await stripePromise;
    const result = await stripe?.confirmCardPayment(clientSecret);
    if (result?.error) throw new Error(result.error.message);
    return result.paymentIntent;
  } else {
    // 2B. Native confirm payment
    const { useStripe } = require("@stripe/stripe-react-native");
    const { confirmPayment } = useStripe();
    const { error, paymentIntent } = await confirmPayment(clientSecret, {
      paymentMethodType: "Card",
    });
    if (error) throw new Error(error.message);
    return paymentIntent;
  }
}
