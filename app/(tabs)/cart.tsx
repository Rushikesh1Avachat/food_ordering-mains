import { View, Text, FlatList, Alert, Button, Image, Platform } from "react-native";
import React, { useState, FormEvent } from "react";
import * as Linking from "expo-linking";
import ReactNativeModal from "react-native-modal";
import cn from "clsx";

import { useCartStore } from "@/store/cart.store";
import CustomHeader from "@/components/CustomHeader";
import CartItem from "@/components/CartItem";
import { PaymentInfoStripeProps } from "@/type";
import { images } from "@/constants";
import CustomButton from "@/components/CustomButton";
import { SafeAreaView } from "react-native-safe-area-context";

// Native-only import (blocked by Metro on web)
import { useStripe } from "@stripe/stripe-react-native";

// Web-only imports (dynamic to avoid TS issues)
let Elements: any;
let CardElement: any;
let useWebStripe: any;
let useElements: any;
let loadStripe: any;

if (Platform.OS === 'web') {
  // @ts-ignore
  ({ Elements, CardElement, useStripe: useWebStripe, useElements } = require('@stripe/react-stripe-js'));
  // @ts-ignore
  ({ loadStripe } = require('@stripe/stripe-js'));
}

// Component for Payment Summary rows
const PaymentInfoStripe = ({ label, value, labelStyle, valueStyle }: PaymentInfoStripeProps) => (
  <View className="flex-between flex-row my-1">
    <Text className={cn("paragraph-medium text-gray-200", labelStyle)}>{label}</Text>
    <Text className={cn("paragraph-bold text-dark-100", valueStyle)}>{value}</Text>
  </View>
);

// Fetch PaymentSheet params from backend (native)
async function fetchPaymentSheetParams(amount: number) {
  const res = await fetch("/api/payment-sheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  return res.json();
}

// Web: Fetch payment intent client secret
async function fetchPaymentIntent(amount: number) {
  const res = await fetch("/api/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  const { client_secret } = await res.json();
  return client_secret;
}

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = Platform.OS === 'web' ? loadStripe ? loadStripe(PUBLISHABLE_KEY) : null : null;

// Native Payment Component
const NativePayment = ({ amount, onSuccess }: { amount: number; onSuccess: () => void }) => {
  const [sheetReady, setSheetReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // 1️⃣ Initialize Payment Sheet
  const initializePaymentSheet = async () => {
    try {
      const { paymentIntent, ephemeralKey, customer } = await fetchPaymentSheetParams(amount);

      const { error } = await initPaymentSheet({
        merchantDisplayName: "Food Ordering App",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: "Rushikesh Avachat",
          email: "avachatrushikesh45@gmail.com",
          phone: "9561686658",
        },
        returnURL: "fastfood://stripe-redirect", // matches your Expo scheme
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        setSheetReady(true);
        Alert.alert("✅ Ready", "Payment Sheet initialized! Tap Pay to continue.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  // 2️⃣ Open Payment Sheet
  const openPaymentSheet = async () => {
    if (!sheetReady) return Alert.alert("Error", "Payment Sheet not ready.");

    setLoading(true);
    const { error } = await presentPaymentSheet();
    setLoading(false);

    if (error) {
      Alert.alert("Payment failed", error.message);
    } else {
      Alert.alert("✅ Payment successful! Cart order placed.");
      onSuccess();
    }
  };

  return (
    <View className="gap-5">
      <CustomButton title="Initialize Payment" onPress={initializePaymentSheet} />
      <Button title="Pay Now"         color="green"  onPress={openPaymentSheet} />
    </View>
  );
};

// Web Payment Component
const WebPayment = ({ amount }: { amount: number }) => {
  // @ts-ignore
  const stripe = useWebStripe ? useWebStripe() : null;
  // @ts-ignore
  const elements = useElements ? useElements() : null;
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const client_secret = await fetchPaymentIntent(amount);
      // @ts-ignore
      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          // @ts-ignore
          card: elements.getElement(CardElement),
          billing_details: {
            name: "Rushikesh Avachat",
            email: "avachatrushikesh45@gmail.com",
            phone: "9561686658",
          },
        },
      });

      if (error) {
        Alert.alert("Payment failed", error.message);
      } else if (paymentIntent?.status === 'succeeded') {
        Alert.alert("✅ Payment successful! Cart order placed.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // @ts-ignore
    <form onSubmit={handleSubmit} className="gap-5">
      {/* @ts-ignore */}
      <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
      <Button title={loading ? "Processing..." : "Pay Now"} disabled={loading} />
    </form>
  );
};

const Cart = () => {
  const { items, getTotalItems, getTotalPrice, clearCart } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const finalTotal = totalPrice + 5 - 0.5;
  const [successModal, setSuccessModal] = useState(false);

  const handleSuccess = () => {
    setSuccessModal(true);
    // clearCart();
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <FlatList
        data={items}
        renderItem={({ item }) => <CartItem item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-28 px-5 pt-5"
        ListHeaderComponent={() => <CustomHeader title="Your Cart" />}
        ListEmptyComponent={() => <Text className="text-center text-gray-500">Cart Empty</Text>}
        ListFooterComponent={() =>
          totalItems > 0 && (
            <View className="gap-5">
              {/* Payment Summary */}
              <View className="mt-6 border border-gray-200 p-5 rounded-2xl">
                <Text className="h3-bold text-dark-100 mb-5">Payment Summary</Text>
                <PaymentInfoStripe label={`Total Items (${totalItems})`} value={`$${totalPrice.toFixed(2)}`} />
                <PaymentInfoStripe label="Delivery Fee" value="$5.00" />
                <PaymentInfoStripe label="Discount" value="- $0.50" valueStyle="!text-success" />
                <View className="border-t border-gray-300 my-2" />
                <PaymentInfoStripe
                  label="Total"
                  value={`$${finalTotal.toFixed(2)}`}
                  labelStyle="base-bold !text-dark-100"
                  valueStyle="base-bold !text-dark-100 !text-right"
                />
              </View>

              {/* Platform-specific Payment UI */}
              {Platform.OS === 'web' ? (
                // @ts-ignore
                <Elements stripe={stripePromise}>
                  <WebPayment amount={finalTotal} />
                </Elements>
              ) : (
                <NativePayment amount={finalTotal} onSuccess={handleSuccess} />
              )}
            </View>
          )
        }
      />

      {/* ✅ Success Modal */}
      <ReactNativeModal >
        <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
          <Image source={images.check} className="w-28 h-28 mt-5" />
          <Text className="text-2xl text-center font-JakartaBold mt-5">Payment Successful</Text>
          <Text className="text-md text-general-200 font-JakartaRegular text-center mt-3">
            Thank you! Your order has been successfully placed.
          </Text>
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default Cart;






