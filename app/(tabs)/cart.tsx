import { View, Text, FlatList, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCartStore } from '@/store/cart.store';
import CustomHeader from '@/components/CustomHeader';
import cn from 'clsx';
import CustomButton from '@/components/CustomButton';
import CartItem from '@/components/CartItem';
import { PaymentInfoStripeProps } from '@/type';
import { useStripe } from '@stripe/stripe-react-native';
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

const API_URL = "https://your-backend.vercel.app"; 
// 👆 Replace with your backend URL where `/payment-sheet` is implemented

const styles = StyleSheet.create({
  checkImage: {
    width: 112,
    height: 112,
    marginTop: 20,
  },
});

const PaymentInfoStripe = ({ label, value, labelStyle, valueStyle }: PaymentInfoStripeProps) => (
  <View className="flex-between flex-row my-1">
    <Text className={cn('paragraph-medium text-gray-200', labelStyle)}>{label}</Text>
    <Text className={cn('paragraph-bold text-dark-100', valueStyle)}>{value}</Text>
  </View>
);

const Cart = () => {
  const { items, getTotalItems, getTotalPrice, clearCart } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const finalTotal = totalPrice + 5 - 0.5; // Total price + delivery - discount

  // ✅ Track internet connection
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Fetch PaymentIntent + customer + ephemeralKey from backend
  const fetchPaymentSheetParams = async () => {
    const response = await fetch(`${API_URL}/payment-sheet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(finalTotal * 100), // cents
        currency: 'usd',
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    return await response.json(); // { paymentIntent, ephemeralKey, customer }
  };

  // ✅ Initialize Stripe PaymentSheet
  const initializePaymentSheet = async () => {
    try {
      const { paymentIntent, ephemeralKey, customer } = await fetchPaymentSheetParams();

      const { error } = await initPaymentSheet({
        merchantDisplayName: 'Food Ordering Inc.',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          name: 'Guest User',
        },
      });

      if (error) {
        Alert.alert('Error', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Init error:', err);
      Alert.alert('Error', 'Failed to load payment sheet.');
      return false;
    }
  };

  // ✅ Present PaymentSheet and show success message
  const handleOrderNow = async () => {
    if (!totalItems) {
      Alert.alert('Cart Empty', 'Please add items to your cart before ordering');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Initialize the PaymentSheet
      const ready = await initializePaymentSheet();
      if (!ready) {
        setLoading(false);
        return;
      }

      // Step 2: Present the PaymentSheet to the user
      const { error } = await presentPaymentSheet();

      // Step 3: Check result
      if (error) {
        console.log('Presentation error details:', error);
        Alert.alert(
          `Error code: ${error.code}`,
          error.message || 'Failed to complete payment.'
        );
      } else {
        // ✅ Success — payment completed
        Alert.alert('Success', 'Payment completed successfully! 🎉');
        clearCart(); // Optionally clear the cart after successful payment
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
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
                onPress={handleOrderNow}
                disabled={loading || !isConnected}
                isLoading={loading}
              />
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default Cart;



