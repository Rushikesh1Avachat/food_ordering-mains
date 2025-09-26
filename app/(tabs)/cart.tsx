import { View, Text, FlatList, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cart.store";
import CustomHeader from "@/components/CustomHeader";
import CustomButton from "@/components/CustomButton";
import CartItem from "@/components/CartItem";
import { useStripe } from "@stripe/stripe-react-native";
import { PaymentInfoStripeProps } from "@/type";
import cn from "clsx";
import { router } from "expo-router";

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

const API_URL = "https://your-backend.com/api/stripe"; // 👈 replace with your deployed backend

const Cart = () => {
  const { items, getTotalItems, getTotalPrice, clearCart } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const finalTotal = totalPrice + 5 - 0.5;

  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [sheetReady, setSheetReady] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize Stripe PaymentSheet
  const initializePaymentSheet = async () => {
    try {
      const { error } = await initPaymentSheet({
        merchantDisplayName: "Food Ordering App",
        intentConfiguration: {
          mode: { amount: Math.round(finalTotal * 100), currencyCode: "usd" },
          confirmHandler: async (
            paymentMethod,
            _shouldSave,
            intentCreationCallback
          ) => {
            // 1️⃣ Create PaymentIntent on backend
            const res = await fetch(`${API_URL}/create`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                amount: finalTotal,
                email: "test@example.com",
              }),
            });
            const { paymentIntent, customer } = await res.json();

            // 2️⃣ Confirm PaymentIntent on backend
            const confirmRes = await fetch(`${API_URL}/pay`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                payment_method_id: paymentMethod.id,
                payment_intent_id: paymentIntent.id,
                customer_id: customer,
                client_secret: paymentIntent.client_secret,
              }),
            });

            const result = await confirmRes.json();
            if (result.success) {
              intentCreationCallback({
                clientSecret: result.result.client_secret,
              });
            } else {
              Alert.alert(
                "Payment failed",
                result.error || "Unable to confirm payment"
              );
            }
          },
        },
      });

      if (!error) setSheetReady(true);
    } catch (err) {
      console.error("Error initializing PaymentSheet:", err);
    }
  };

  // Handle payment
  const paymentDone = async () => {
    setLoading(true);
    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`❌ Error: ${error.code}`, error.message);
    } else {
      Alert.alert("✅ Success", "Payment is done! Your order is confirmed.");
      clearCart();
      router.replace("/"); // redirect to home/orders
    }
    setLoading(false);
  };

  useEffect(() => {
    initializePaymentSheet();
  }, []);

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
                <PaymentInfoStripe label="Delivery Fee" value="$5.00" />
                <PaymentInfoStripe
                  label="Discount"
                  value="- $0.50"
                  valueStyle="!text-success"
                />
                <View className="border-t border-gray-300 my-2" />
                <PaymentInfoStripe
                  label="Total"
                  value={`$${finalTotal.toFixed(2)}`}
                  labelStyle="base-bold !text-dark-100"
                  valueStyle="base-bold !text-dark-100 !text-right"
                />
              </View>

              {/* Order Now Button */}
              <CustomButton
                title={loading ? "Processing..." : "Order Now"}
                disabled={!sheetReady || loading}
                onPress={paymentDone}
              />
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default Cart;





