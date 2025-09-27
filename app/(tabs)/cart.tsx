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

const PaymentInfoStripe = ({ label, value, labelStyle, valueStyle }: PaymentInfoStripeProps) => (
  <View className="flex-row justify-between my-1">
    <Text className={cn("paragraph-medium text-gray-200", labelStyle)}>{label}</Text>
    <Text className={cn("paragraph-bold text-dark-100", valueStyle)}>{value}</Text>
  </View>
);

const API_URL = "https://your-backend.com/api/stripe"; // Replace with your actual backend URL

const Cart = () => {
  const { items, getTotalItems, getTotalPrice, clearCart } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const finalTotal = totalPrice + 5 - 0.5; // Total with delivery fee and discount

  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [sheetReady, setSheetReady] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize Payment Sheet
  const initializePaymentSheet = async () => {
    try {
      const { error } = await initPaymentSheet({
        merchantDisplayName: "merchant.food.ordering.com",
        intentConfiguration: {
          mode: { amount: Math.round(finalTotal * 100), currencyCode: "usd" },
          confirmHandler: async (paymentMethod, _shouldSave, intentCreationCallback) => {
            try {
              // Create payment intent on backend
              const res = await fetch(`${API_URL}/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  amount: finalTotal,
                  email: "test@example.com", // Replace with actual user email
                }),
              });

              if (!res.ok) {
                throw new Error("Failed to create payment intent");
              }

              const { paymentIntent, customer } = await res.json();

              // Confirm payment intent on backend
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
                intentCreationCallback({ clientSecret: result.result.client_secret });
              } else {
                throw new Error(result.error || "Payment confirmation failed");
              }
            } catch (err) {
              console.error("Payment confirmation error:", err);
              //@ts-ignore
              intentCreationCallback({ error: "Payment confirmation failed" });
            }
          },
        },
        returnURL: "myapp://merchant.food.ordering.com", // Update to your app's return URL
      });

      if (error) {
        console.error("Init Payment Sheet Error:", error);
        Alert.alert("Error", `Failed to initialize payment: ${error.message}`);
        return;
      }

      setSheetReady(true);
    } catch (err) {
      console.error("Initialize Payment Sheet Error:", err);
      Alert.alert("Error", "Failed to initialize payment sheet.");
    }
  };

  // Handle "Order Now" button press
  const handleOrderNow = async () => {
    if (!sheetReady) {
      Alert.alert("Error", "Payment sheet is not ready. Please try again.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await presentPaymentSheet();

      if (error) {
        Alert.alert(`Payment Error: ${error.code}`, error.message);
      } else {
        Alert.alert("Success", "Your payment was successful! Order confirmed.");
        clearCart();
        router.replace("/"); // Redirect to home or order confirmation page
      }
    } catch (err) {
      console.error("Payment error:", err);
      Alert.alert("Error", "Something went wrong during payment.");
    } finally {
      setLoading(false);
    }
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
        ListEmptyComponent={() => <Text className="text-center text-gray-500">Cart Empty</Text>}
        ListFooterComponent={() =>
          totalItems > 0 && (
            <View className="gap-5">
              <View className="mt-6 border border-gray-200 p-5 rounded-2xl">
                <Text className="h3-bold text-dark-100 mb-5">Payment Summary</Text>
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
              <CustomButton
                title="Order Now"
                disabled={loading || !sheetReady}
                onPress={handleOrderNow}
                className="my-10"
              />
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default Cart;





