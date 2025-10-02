import { View, Text, FlatList, Alert,  Button, Image } from "react-native";
import React, { useState } from "react";
import * as Linking from "expo-linking";
import { useStripe } from "@stripe/stripe-react-native";
import ReactNativeModal from "react-native-modal";
import cn from "clsx";

import { useCartStore } from "@/store/cart.store";
import CustomHeader from "@/components/CustomHeader";
import CartItem from "@/components/CartItem";
import { PaymentInfoStripeProps } from "@/type";
import { images } from "@/constants";
import CustomButton from "@/components/CustomButton";
import { SafeAreaView } from "react-native-safe-area-context";

// Component for Payment Summary rows
const PaymentInfoStripe = ({ label, value, labelStyle, valueStyle }: PaymentInfoStripeProps) => (
  <View className="flex-between flex-row my-1">
    <Text className={cn("paragraph-medium text-gray-200", labelStyle)}>{label}</Text>
    <Text className={cn("paragraph-bold text-dark-100", valueStyle)}>{value}</Text>
  </View>
);

// Fetch PaymentSheet params from backend
async function fetchPaymentSheetParams(amount: number) {
  const res = await fetch("/api/payment-sheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  return res.json();
}

const Cart = () => {
  const { items, getTotalItems, getTotalPrice, clearCart } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const finalTotal = totalPrice + 5 - 0.5;

  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [sheetReady, setSheetReady] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1️⃣ Initialize Payment Sheet
  const initializePaymentSheet = async () => {
    try {
      const { paymentIntent, ephemeralKey, customer } = await fetchPaymentSheetParams(finalTotal);

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
              Alert.alert(" ✅Payment suceesfully cart order");

    //   setSuccessModal(true);
    //   clearCart();
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

              {/* Payment Buttons */}
                            <CustomButton title="Initialize Payment" onPress={initializePaymentSheet} />

                    <Button title="Pay Now" color="#00FF00" onPress={openPaymentSheet} disabled={!sheetReady || loading} />
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






