import { View, Text, FlatList, Alert, Image, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cart.store";
import CustomHeader from "@/components/CustomHeader";
import CustomButton from "@/components/CustomButton";
import CartItem from "@/components/CartItem";
import { PaymentInfoStripeProps } from "@/type";
import cn from "clsx";
import { router } from "expo-router";
import ReactNativeModal from "react-native-modal";
import { images } from "@/constants";

// Conditionally import Stripe only on native platforms
let useStripe: () => any;
if (Platform.OS !== 'web') {
  useStripe = require('@stripe/stripe-react-native').useStripe;
}

const PaymentInfoStripe = ({ label, value, labelStyle, valueStyle }: PaymentInfoStripeProps) => (
  <View className="flex-row justify-between my-1">
    <Text className={cn("paragraph-medium text-gray-200", labelStyle)}>{label}</Text>
    <Text className={cn("paragraph-bold text-dark-100", valueStyle)}>{value}</Text>
  </View>
);

const API_URL = "https://your-backend.com/api/stripe"; // Replace with your backend

const Cart = () => {
  const { items, getTotalItems, getTotalPrice, clearCart } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const finalTotal = totalPrice + 5 - 0.5;

  // Conditionally use Stripe hook only on native platforms
  const stripeHook = Platform.OS !== 'web' ? useStripe?.() : null;
  const { initPaymentSheet, presentPaymentSheet } = stripeHook || { initPaymentSheet: () => {}, presentPaymentSheet: () => ({}) };
  
  const [sheetReady, setSheetReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  // Initialize Payment Sheet (only on native)
  const initializePaymentSheet = async () => {
    if (Platform.OS === 'web') {
      console.warn('Stripe not supported on web');
      setSheetReady(true); // Mock for web
      return;
    }

    try {
      const { error } = await initPaymentSheet({
        merchantDisplayName: "merchant.food.ordering.com",
        intentConfiguration: {
          mode: { amount: Math.round(finalTotal * 100), currencyCode: "usd" },
          confirmHandler: async (paymentMethod: { id: any; }, _shouldSave: any, intentCreationCallback: (arg0: { clientSecret?: any; error?: string; }) => void) => {
            try {
              const res = await fetch(`${API_URL}/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  amount: finalTotal,
                  email: "avachatrushikesh45@gmail.com",
                }),
              });

              const { paymentIntent, customer } = await res.json();

              const confirmRes = await fetch(`${API_URL}/pay+api`, {
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
              //@ts-ignore
              intentCreationCallback({ error: "Payment confirmation failed" });
            }
          },
        },
        returnURL: "fastfood://checkout", // update with your scheme
      });

      if (!error) setSheetReady(true);
    } catch (err) {
      Alert.alert("Error", "Failed to initialize payment sheet.");
    }
  };

  const handleOrderNow = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Web Not Supported', 'Payments are only available on mobile devices.');
      return;
    }

    if (!sheetReady) {
      Alert.alert("Error", "Payment sheet not ready");
      return;
    }
    setLoading(true);

    const { error } = await presentPaymentSheet();
    setLoading(false);

    if (error) {
      Alert.alert(`Payment Error: ${error.code}`, error.message);
    } else {
      Alert.alert("Payment Successfully Completed!", "Thank you for your order!");
      setSuccessModal(true);
      clearCart();
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
                <PaymentInfoStripe label="Discount" value="- $0.50" valueStyle="!text-success" />
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
                disabled={loading || !sheetReady || Platform.OS === 'web'}
                onPress={handleOrderNow}
                className="my-10"
              />
            </View>
          )
        }
      />

      {/* ✅ Success Modal */}
      <ReactNativeModal isVisible={successModal} onBackdropPress={() => setSuccessModal(false)}>
        <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
          <Image source={images.check} className="w-28 h-28 mt-5" />
          <Text className="text-2xl text-center font-JakartaBold mt-5">
            Payment Successful
          </Text>
          <Text className="text-md text-general-200 font-JakartaRegular text-center mt-3">
            Thank you! Your order has been successfully placed.
          </Text>
          <CustomButton
            title="Back Home"
            onPress={() => {
              setSuccessModal(false);
              router.replace("/");
            }}
            className="mt-5"
          />
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default Cart;




