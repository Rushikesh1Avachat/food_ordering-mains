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
  <View className="flex-between flex-row my-1">
    <Text className={cn("paragraph-medium text-gray-200", labelStyle)}>{label}</Text>
    <Text className={cn("paragraph-bold text-dark-100", valueStyle)}>{value}</Text>
  </View>
);

const API_URL = "https://your-backend.com/api/stripe"; // Change to your backend

const Cart = () => {
  const { items, getTotalItems, getTotalPrice, clearCart } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const finalTotal = totalPrice + 5 - 0.5;

  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [sheetReady, setSheetReady] = useState(false);
  const [loading, setLoading] = useState(false);

  // Store backend PaymentIntent data
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Initialize Payment Sheet
  const initializePaymentSheet = async () => {
    try {
      // 1️⃣ Create PaymentIntent on backend
      const res = await fetch(`${API_URL}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalTotal, email: "test@example.com" }),
      });
      const data = await res.json();

      setPaymentIntentId(data.paymentIntent.id);
      setCustomerId(data.customer);
      setClientSecret(data.paymentIntent.client_secret);

      // 2️⃣ Initialize the payment sheet
      const { error } = await initPaymentSheet({
        merchantDisplayName: "Food Ordering App",
        paymentIntentClientSecret: data.paymentIntent.client_secret,
      });

      if (!error) setSheetReady(true);
    } catch (err) {
      console.error("Error initializing payment sheet:", err);
      Alert.alert("Error", "Failed to initialize payment sheet.");
    }
  };

  // Handle "Order Now" press
  const paymentDone = async () => {
    if (!sheetReady || !paymentIntentId || !customerId || !clientSecret) return;

    setLoading(true);
    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`❌ Error: ${error.code}`, error.message);
    } else {
      // Call backend to confirm payment (your /pay+api.ts)
      try {
        const res = await fetch(`${API_URL}/pay+api`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_method_id: "from_backend_or_store_if_needed",
            payment_intent_id: paymentIntentId,
            customer_id: customerId,
            client_secret: clientSecret,
          }),
        });

        const result = await res.json();
        if (result.success) {
          Alert.alert("✅ Success", "Payment is done! Your order is confirmed.");
          clearCart();
          router.replace("/"); // redirect
        } else {
          Alert.alert("❌ Payment Failed", result.error || "Something went wrong.");
        }
      } catch (err) {
        console.error(err);
        Alert.alert("❌ Error", "Failed to confirm payment on server.");
      }
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




