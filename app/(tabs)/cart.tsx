import { View, Text, FlatList, Alert, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCartStore } from '@/store/cart.store';
import CustomHeader from '@/components/CustomHeader';
import CustomButton from '@/components/CustomButton';
import CartItem from '@/components/CartItem';
import { useStripe } from '@stripe/stripe-react-native';
import { useState } from 'react';
import { images } from '@/constants';
import { useRouter } from 'expo-router';

const styles = StyleSheet.create({
  checkImage: {
    width: 112,
    height: 112,
    marginTop: 20,
  },
});

const Cart = () => {
  const { items, getTotalItems, getTotalPrice, clearCart } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const finalTotal = totalPrice + 5 - 0.5; // delivery fee & discount

  const initializePaymentSheet = async () => {
    try {
      // Step 1: Ask backend to create PaymentIntent
      const response = await fetch(`https://your-backend-url.com/api/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(finalTotal * 100), // Stripe expects cents
          currency: 'usd',
          paymentMethodId: null, // let Stripe handle automatic payment
        }),
      });

      const { clientSecret, error } = await response.json();

      if (error) {
        Alert.alert('Error', error);
        return false;
      }

      // Step 2: Initialize PaymentSheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'merchant.food.ordering.com',
        // appearance: { colors: { primary: '#FF6B35' } },
      });

      if (initError) {
        Alert.alert('Error', initError.message);
        return false;
      }

      return true;
    } catch (err) {
      console.log('Init error:', err);
      Alert.alert('Error', 'Failed to connect to backend.');
      return false;
    }
  };

  const handleOrderNow = async () => {
    if (!totalItems) {
      Alert.alert('Cart Empty', 'Please add items before ordering.');
      return;
    }

    setLoading(true);

    const ready = await initializePaymentSheet();

    if (ready) {
      // Step 3: Present PaymentSheet
      const { error } = await presentPaymentSheet();

      if (error) {
        Alert.alert(`Payment Failed`, error.message);
      } else {
        Alert.alert('Success', 'Payment completed successfully!');
        setSuccess(true);
        clearCart();
      }
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
              {/* Payment Summary */}
              <View className="mt-6 border border-gray-200 p-5 rounded-2xl">
                <Text className="h3-bold text-dark-100 mb-5">Payment Summary</Text>
                <Text>Total Items: {totalItems}</Text>
                <Text>Delivery Fee: $5.00</Text>
                <Text>Discount: -$0.50</Text>
                <Text className="font-bold mt-2">
                  Total: ${(finalTotal).toFixed(2)}
                </Text>
              </View>

              {/* Order Now */}
              <CustomButton
                title="Order Now"
                onPress={handleOrderNow}
                disabled={loading}
                isLoading={loading}
              />
            </View>
          )
        }
      />

      {/* Success Overlay */}
      {success && (
        <View className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <View className="bg-white p-7 rounded-2xl items-center">
            <Image source={images.check} style={styles.checkImage} />
            <Text className="text-2xl text-center font-bold mt-5">
              Payment is Successful
            </Text>
            <Text className="text-md text-gray-500 text-center mt-3">
              Thank you for your order!
            </Text>
            <CustomButton
              title="Go Back Home"
              onPress={() => {
                setSuccess(false);
                router.replace('/');
              }}
              className="mt-5"
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Cart;

