import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Alert, Image, Button, Platform, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import cn from "clsx";
import * as Linking from "expo-linking";

import { useCartStore } from "@/store/cart.store";
import CustomHeader from "@/components/CustomHeader";
import CustomButton from "@/components/CustomButton";
import CartItem from "@/components/CartItem";
import { PaymentInfoStripeProps } from "@/type";
import { images } from "@/constants";

// Stripe imports
import { useStripe, StripeProvider } from "@stripe/stripe-react-native";
import { loadStripe, Stripe } from "@stripe/stripe-js";

// PaymentInfoStripe Row Component
const PaymentInfoStripe = ({ label, value, labelStyle, valueStyle }: PaymentInfoStripeProps) => (
  <View className="flex-between flex-row my-1">
    <Text className={cn("paragraph-medium text-gray-200", labelStyle)}>{label}</Text>
    <Text className={cn("paragraph-bold text-dark-100", valueStyle)}>{value}</Text>
  </View>
);

// Fetch PaymentSheet params from backend
async function fetchPaymentSheetParams(amount: number) {
  const response = await fetch("/api/payment-sheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  return response.json();
}

// Main Cart Component
const CartContent = () => {
  const { items, getTotalItems, getTotalPrice } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [stripeWeb, setStripeWeb] = useState<Stripe | null>(null);

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // Initialize Stripe for web
  useEffect(() => {
    if (Platform.OS === "web") {
      loadStripe(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!).then(setStripeWeb);
    }
  }, []);

  // Initialize PaymentSheet
  const initializePaymentSheet = async () => {
    if (Platform.OS === "web" && stripeWeb) {
      // Web: redirect to Stripe Checkout
      const { sessionId } = await fetchPaymentSheetParams(totalPrice);
      const { error } = await stripeWeb.redirectToCheckout({ sessionId });
      if (error) Alert.alert("Stripe Error", error.message);
      return;
    }

    // Native: initialize PaymentSheet
    try {
      const { paymentIntent, ephemeralKey, customer } = await fetchPaymentSheetParams(totalPrice);
      const { error } = await initPaymentSheet({
        merchantDisplayName: "merchant.food-ordering-app.com",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: "Rushikesh Avachat",
          email: "avachatrushikesh45@gmail.com",
          phone: "9561686658",
        },
        returnURL: Linking.createURL("stripe-redirect"),
      });

      if (error) Alert.alert("Error", error.message);
      else {
        setLoading(true);
        Alert.alert("Success", "Payment Sheet initialized!");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  // Open PaymentSheet (Native)
  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();
    if (error) Alert.alert("Payment failed", error.message);
    else {
      setSuccessModal(true);
    }
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <FlatList
        data={items}
        renderItem={({ item }) => <CartItem item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-28 px-5 pt-5"
        ListHeaderComponent={() => <CustomHeader title="Your Cart" />}
        ListEmptyComponent={() => <Text>Cart Empty</Text>}
        ListFooterComponent={() =>
          totalItems > 0 && (
            <View className="gap-5">
              <View className="mt-6 border border-gray-200 p-5 rounded-2xl">
                <Text className="h3-bold text-dark-100 mb-5">Payment Summary</Text>
                <PaymentInfoStripe label={`Total Items (${totalItems})`} value={`$${totalPrice.toFixed(2)}`} />
                <PaymentInfoStripe label={`Delivery Fee`} value={`$5.00`} />
                <PaymentInfoStripe label={`Discount`} value={`- $0.50`} valueStyle="!text-success" />
                <View className="border-t border-gray-300 my-2" />
                <PaymentInfoStripe
                  label={`Total`}
                  value={`$${(totalPrice + 5 - 0.5).toFixed(2)}`}
                  labelStyle="base-bold !text-dark-100"
                  valueStyle="base-bold !text-dark-100 !text-right"
                />
              </View>

              <CustomButton
                title="Order Now"
                onPress={Platform.OS === "web" ? initializePaymentSheet : openPaymentSheet}
                disabled={!loading && Platform.OS !== "web"}
              />

              {/* Success Modal */}
              <Modal visible={successModal} onAccessibilityEscape={() => setSuccessModal(false)}>
                <View className="flex flex-col items-center justify-center bg-primary p-7 rounded-2xl">
                  <Image source={images.check} className="w-28 h-28 mt-5" />
                  <Text className="text-2xl text-center font-JakartaBold mt-5">Payment Successful</Text>
                  <Text className="text-md text-general-200 font-JakartaRegular text-center mt-3">
                    Thank you! Your order has been successfully placed.
                  </Text>
                  <Button title="Close" onPress={() => setSuccessModal(false)} />
                </View>
              </Modal>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

// Wrap component with StripeProvider for Native
export default Platform.OS === "web" ? CartContent : () => (
  <StripeProvider
    publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
    merchantIdentifier="merchant.food-ordering-app.com"
  >
    <CartContent />
  </StripeProvider>
);




