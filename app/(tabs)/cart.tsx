import { View, Text, FlatList, Alert, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCartStore } from '@/store/cart.store';
import CustomHeader from '@/components/CustomHeader';
import cn from 'clsx';
import CustomButton from '@/components/CustomButton';
import CartItem from '@/components/CartItem';
import { PaymentInfoStripeProps } from '@/type';
import {
  initPaymentSheet,
  presentPaymentSheet,
  useStripe,
  IntentCreationCallbackParams,
  PaymentMethod,
} from '@stripe/stripe-react-native';
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { images } from '@/constants';
import { useRouter } from 'expo-router'; // For navigation

const styles = StyleSheet.create({
  checkImage: {
    width: 112, // w-28 assuming 1 unit = 4px
    height: 112, // h-28 assuming 1 unit = 4px
    marginTop: 20, // mt-5 assuming 1 unit = 4px
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
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const finalTotal = totalPrice + 5 - 0.5; // Total price + delivery - discount

  // Check network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  const confirmHandler = async (
    paymentMethod: PaymentMethod.Result,
    shouldSavePaymentMethod: boolean,
    intentCreationCallback: (params: IntentCreationCallbackParams) => void
  ) => {
    // Make a request to your own server.
    try {
      const response = await fetch(`https://your-project.vercel.app/api/stripe/pay`, { // Replace with your deployed URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round((totalPrice + 5 - 0.5) * 100), // Amount in cents
          currency: 'usd',
          paymentMethodId: paymentMethod.id,
          shouldSavePaymentMethod,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with status: ${response.status} - ${errorText}`);
      }

      // Call the `intentCreationCallback` with your server response's client secret or error
      const { clientSecret, error } = await response.json();
      if (clientSecret) {
        intentCreationCallback({ clientSecret });
      } else {
        intentCreationCallback({ error });
      }
    } catch (e) {
      console.log('Backend API error:', e);
      Alert.alert('Error', 'Failed to retrieve payment information from the server.');
      intentCreationCallback({
        //@ts-ignore
        error: { code: 'BackendError', message: 'Failed to connect to the backend server.' },
      });
    }
  };

  const initializePaymentSheet = async () => {
    if (!isConnected) {
      Alert.alert('No Internet', 'Please check your internet connection and try again');
      return;
    }

    setLoading(true);
    try {
      const { error } = await initPaymentSheet({
        merchantDisplayName: 'merchant.food.ordering.com',
        intentConfiguration: {
          mode: {
            amount: Math.round((totalPrice + 5 - 0.5) * 100),
            currencyCode: 'USD',
          },
          confirmHandler: confirmHandler,
        },
        // appearance: { colors: { primary: '#FF6B35' } },
      });

      if (error) {
        console.log('Initialization error details:', error);
        Alert.alert('Error', error.message || 'Failed to initialize payment sheet.');
      }
    } catch (error) {
      console.error('Error initializing payment sheet:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderNow = async () => {
    if (!totalItems) {
      Alert.alert('Cart Empty', 'Please add items to your cart before ordering');
      return;
    }

    setLoading(true);

    // Initialize the payment sheet before opening it
    await initializePaymentSheet();

    const { error } = await presentPaymentSheet();

    if (error) {
      console.log('Presentation error details:', error);
      Alert.alert(`Error code: ${error.code}`, error.message || 'Failed to present payment sheet');
    } else {
      Alert.alert('Success', 'Payment completed successfully!');
      // Optionally clear cart
      // useCartStore.getState().clearCart();
    }

    setLoading(false);
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
                  value={`$${(totalPrice + 5 - 0.5).toFixed(2)}`}
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



