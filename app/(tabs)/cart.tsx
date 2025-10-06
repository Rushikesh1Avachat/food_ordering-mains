import React, { useState, FormEvent } from "react";
import { View, Text, FlatList, Alert, Platform, Button, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ReactNativeModal from "react-native-modal";
import cn from "clsx";

import { useCartStore } from "@/store/cart.store";
import CustomHeader from "@/components/CustomHeader";
import CartItem from "@/components/CartItem";
import CustomButton from "@/components/CustomButton";
import { PaymentInfoStripeProps } from "@/type";
import { images } from "@/constants";
import AppStripeProvider from "@/components/stripe-provider"; // Platform-aware provider

// Platform-specific Stripe hooks
let useStripeNative: any = null;
if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  useStripeNative = require("@stripe/stripe-react-native").useStripe;
}

// Payment summary row component
const PaymentInfoStripe: React.FC<PaymentInfoStripeProps> = ({ label, value, labelStyle, valueStyle }) => (
  <View className="flex-between flex-row my-1">
    <Text className={cn("paragraph-medium text-gray-200", labelStyle)}>{label}</Text>
    <Text className={cn("paragraph-bold text-dark-100", valueStyle)}>{value}</Text>
  </View>
);

// Native Payment Component
const NativePayment: React.FC<{ amount: number; onSuccess: () => void }> = ({ amount, onSuccess }) => {
  const [sheetReady, setSheetReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const { initPaymentSheet, presentPaymentSheet } = useStripeNative();

  const initializePaymentSheet = async () => {
    try {
      const res = await fetch("/api/payment-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const { paymentIntent, ephemeralKey, customer } = await res.json();

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
        returnURL: "fastfood://stripe-redirect",
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

  const openPaymentSheet = async () => {
    if (!sheetReady) return Alert.alert("Error", "Payment Sheet not ready.");

    setLoading(true);
    const { error } = await presentPaymentSheet();
    setLoading(false);

    if (error) Alert.alert("Payment failed", error.message);
    else {
      Alert.alert("✅ Payment successful! Cart order placed.");
      onSuccess();
    }
  };

  return (
    <View className="gap-5">
      <CustomButton title="Initialize Payment" onPress={initializePaymentSheet} />
      <Button title={loading ? "Processing..." : "Pay Now"} color="green" onPress={openPaymentSheet} disabled={loading} />
    </View>
  );
};

// Web Payment Component
const WebPayment: React.FC<{ amount: number }> = ({ amount }) => {
  // Dynamic imports for web
  const stripeJs = require("@stripe/react-stripe-js");
  const { CardElement, Elements, useStripe, useElements } = stripeJs;
  const { loadStripe } = require("@stripe/stripe-js");

  const stripePromise = loadStripe(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

  const WebPaymentForm: React.FC = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;

      setLoading(true);
      try {
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        });
        const { client_secret } = await res.json();

        const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: "Rushikesh Avachat",
              email: "avachatrushikesh45@gmail.com",
              phone: "9561686658",
            },
          },
        });

        if (error) Alert.alert("Payment failed", error.message);
        else if (paymentIntent?.status === "succeeded") Alert.alert("✅ Payment successful! Cart order placed.");
      } catch (err: any) {
        Alert.alert("Error", err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="gap-5">
        <CardElement options={{ style: { base: { fontSize: "16px" } } }} />
        <Button title={loading ? "Processing..." : "Pay Now"} disabled={loading} />
      </form>
    );
  };

  return <Elements stripe={stripePromise}><WebPaymentForm /></Elements>;
};

// Main Cart Component
const Cart: React.FC = () => {
  const { items, getTotalItems, getTotalPrice, clearCart } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const finalTotal = totalPrice + 5 - 0.5;
  const [successModal, setSuccessModal] = useState(false);

  const handleSuccess = () => {
    setSuccessModal(true);
    clearCart();
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <FlatList
        data={items}
        renderItem={({ item }) => <CartItem item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 112, paddingHorizontal: 20, paddingTop: 20 }}
        ListHeaderComponent={<CustomHeader title="Your Cart" />}
        ListEmptyComponent={<Text className="text-center text-gray-500">Cart Empty</Text>}
      ListFooterComponent={() =>
  totalItems > 0 ? (
    <View className="gap-5">
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

      <AppStripeProvider>
        {Platform.OS === "web" ? (
          <WebPayment amount={finalTotal} />
        ) : (
          <NativePayment amount={finalTotal} onSuccess={handleSuccess} />
        )}
      </AppStripeProvider>
    </View>
  ) : null
}

      />

      <ReactNativeModal isVisible={successModal}>
        <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
          <Image source={images.check} style={{ width: 112, height: 112, marginTop: 20 }} />
          <Text className="text-2xl text-center font-JakartaBold mt-5">Payment Successful</Text>
          <Text className="text-md text-general-200 font-JakartaRegular text-center mt-3">
            Thank you! Your order has been successfully placed.
          </Text>
          <Button title="Close" onPress={() => setSuccessModal(false)} />
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default Cart;






