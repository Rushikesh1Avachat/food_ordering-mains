import { View, Text, FlatList, Alert , Image, Button} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import * as Linking from "expo-linking";
import { useStripe } from "@stripe/stripe-react-native";
import cn from "clsx";

import { useCartStore } from "@/store/cart.store";
import CustomHeader from "@/components/CustomHeader";
import CustomButton from "@/components/CustomButton";
import CartItem from "@/components/CartItem";
import { PaymentInfoStripeProps } from "@/type";
import { router } from "expo-router";
import { images } from "@/constants";
import Modal from "react-native-modal";

// Component for Payment Summary rows
const PaymentInfoStripe = ({
  label,
  value,
  labelStyle,
  valueStyle,
}: PaymentInfoStripeProps) => (
  <View className="flex-between flex-row my-1">
    <Text className={cn("paragraph-medium text-gray-200", labelStyle)}>
      {label}
    </Text>
    <Text className={cn("paragraph-bold text-dark-100", valueStyle)}>
      {value}
    </Text>
  </View>
);

// Fetch PaymentSheet params from backend
async function fetchPaymentSheetParams(amount: number): Promise<{
  paymentIntent: string;
  ephemeralKey: string;
  customer: string;
}> {
  const response = await fetch("/api/payment-sheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  return response.json();
}

const Cart = () => {
  const { items, getTotalItems, getTotalPrice } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
const [successModal, setSuccessModal] = useState(false);
  // Initialize Stripe Payment Sheet
  const initializePaymentSheet = async () => {
    try {
      const { paymentIntent, ephemeralKey, customer } =
        await fetchPaymentSheetParams(totalPrice);

      const { error } = await initPaymentSheet({
        merchantDisplayName: "merchant.food-odering-app.com",
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

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        setLoading(true);
        Alert.alert("Success", "Payment Sheet initialized!");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  // Open Stripe Payment Sheet
  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert("Payment failed", error.message);
    } else {
      Alert.alert(" ✅Success", "Your Food order is confirmed!");
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
              {/* Payment Summary */}
              <View className="mt-6 border border-gray-200 p-5 rounded-2xl">
                <Text className="h3-bold text-dark-100 mb-5">
                  Payment Summary
                </Text>

                <PaymentInfoStripe
                  label={`Total Items (${totalItems})`}
                  value={`$${totalPrice.toFixed(2)}`}
                />
                <PaymentInfoStripe label={`Delivery Fee`} value={`$5.00`} />
                <PaymentInfoStripe
                  label={`Discount`}
                  value={`- $0.50`}
                  valueStyle="!text-success"
                />
                <View className="border-t border-gray-300 my-2" />
                <PaymentInfoStripe
                  label={`Total`}
                  value={`$${(totalPrice + 5 - 0.5).toFixed(2)}`}
                  labelStyle="base-bold !text-dark-100"
                  valueStyle="base-bold !text-dark-100 !text-right"
                />
              </View>
               <CustomButton title="Order Now"  onPress={openPaymentSheet} disabled={!loading} />


              {/* Payment Buttons */}

            {/* ✅ Success Modal */}
<Modal isVisible={successModal} onBackdropPress={() => setSuccessModal(false)}>
  <View className="flex flex-col items-center justify-center bg-primary p-7 rounded-2xl">
    <Image source={images.check} className="w-28 h-28 mt-5" />
    <Text className="text-2xl text-center font-JakartaBold mt-5">
      Payment Successful
    </Text>
    <Text className="text-md text-general-200 font-JakartaRegular text-center mt-3">
      Thank you! Your order has been successfully placed.
    </Text>
    <Button title="Order Now" color="#00FF00"  onPress={initializePaymentSheet}  />

  </View>
</Modal>
</View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default Cart;




