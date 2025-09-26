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

const PaymentInfoStripe = ({ label,  value,  labelStyle,  valueStyle, }: PaymentInfoStripeProps) => (
    <View className="flex-between flex-row my-1">
        <Text className={cn("paragraph-medium text-gray-200", labelStyle)}>
            {label}
        </Text>
        <Text className={cn("paragraph-bold text-dark-100", valueStyle)}>
            {value}
        </Text>
    </View>
);

const API_URL = "https://your-backend.com/api/stripe"; // 👈 change to your backend

const Cart = () => {
  const { items, getTotalItems, getTotalPrice, clearCart } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const finalTotal = totalPrice + 5 - 0.5;

  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [sheetReady, setSheetReady] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize Payment Sheet
  const initializePaymentSheet = async () => {
    const { error } = await initPaymentSheet({
      merchantDisplayName: "merchant.food.ordering.com",
      intentConfiguration: {
        mode: { amount: Math.round(finalTotal * 100), currencyCode: "usd" },
        confirmHandler: async (paymentMethod, _shouldSave, intentCreationCallback) => {
          // Create intent on backend
          const res = await fetch(`${API_URL}/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: finalTotal, email: "test@example.com" }),
          });
          const { paymentIntent, customer } = await res.json();

          // Confirm intent on backend
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
          }
        },
      },
    });

    if (!error) setSheetReady(true);
  };

  // Pay Button Handler
  const paymentDone = async () => {
    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Error code: ${error.code}`, error.message);
      // TODO: handle error. The order is submitted, but payment failed.
    } else {
      Alert.alert('Success', 'Your order is confirmed!');
      // router.push(`/orders/${orderId}`);
      router.replace('/');
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
                ListEmptyComponent={() => <Text>Cart Empty</Text>}
                ListFooterComponent={() => totalItems > 0 && (
                    <View className="gap-5">
                        <View className="mt-6 border border-gray-200 p-5 rounded-2xl">
                            <Text className="h3-bold text-dark-100 mb-5">
                                Payment Summary
                            </Text>

                            <PaymentInfoStripe
                                label={`Total Items (${totalItems})`}
                                value={`$${totalPrice.toFixed(2)}`}
                            />
                            <PaymentInfoStripe
                                label={`Delivery Fee`}
                                value={`$5.00`}
                            />
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

                        <CustomButton     title= "Order  Now"
                // disabled={!sheetReady || loading}
                onPress={paymentDone}/>
                    </View>
                )}
            />
        </SafeAreaView>
  );
};

export default Cart;





