import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Client, Databases } from 'appwrite';
import { appwriteConfig } from '@/lib/appwrite';
import { useCartStore } from '@/store/cart.store';
import { CartCustomization, MenuItem, StackParamList } from '@/type';

// Define interfaces
interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  customizations: CartCustomization[];
  quantity: number;
}

interface MenuDetailRouteParams {
  itemId: string;
  imageUrl: string;
  name: string;
  price: number;
}

// Type navigation prop
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
; // Adjust import path as needed

const MenuDetails = () => {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList, 'MenuDetail'>>();
  const { itemId, imageUrl, name, price } = route.params as MenuDetailRouteParams;
  const { addItem } = useCartStore();
  const [itemDetails, setItemDetails] = useState<MenuItem | null>(null);
  const [selectedSides, setSelectedSides] = useState<CartCustomization[]>([]);
  const [quantity, setQuantity] = useState<number>(1);

  // Fetch additional details from Appwrite
  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        const client = new Client()
          .setEndpoint(appwriteConfig.endpoint)
          .setProject(appwriteConfig.projectId);
        const databases = new Databases(client);
        const response = await databases.getDocument(
          appwriteConfig.databaseId,
          appwriteConfig.menuCollectionId,
          itemId
        );
        // Transform Appwrite response to MenuItem
        const transformedItem: MenuItem = {
            $id: response.$id,
            image_url: response.image_url || '',
            name: response.name || '',
            price: response.price || 0,
            subtypes: response.subtypes || ['Default'],
            rating: response.rating || 4.5,
            calories: response.calories || 300,
            protein: response.protein || 20,
            bunType: response.bunType || 'N/A',
            description: response.description || 'A delicious item.',
            toppings: response.toppings || [],
            sides: response.sides || [],
            type: '',
            $sequence: 0,
            $collectionId: '',
            $databaseId: '',
            $createdAt: '',
            $updatedAt: '',
            $permissions: []
        };
        setItemDetails(transformedItem);
      } catch (error) {
        console.error('Failed to fetch item details:', error);
     setItemDetails({
          $id: itemId || '',
          image_url: imageUrl || '',
          name: name || 'Unnamed Item',
          price: price || 0,
          subtypes: ['Default'],
          rating: 4.5,
          calories: 300,
          protein: 20,
          bunType: 'N/A',
          description: 'A delicious item.',
          toppings: [] as CartCustomization[],
          sides: [] as CartCustomization[],
        } as MenuItem);
      }
    };
    fetchItemDetails();
  }, [itemId, imageUrl, name, price]);

  // Calculate total price
  const basePrice = itemDetails?.price || price;
  const sidesPrice = selectedSides.reduce((sum, side) => sum + (side.price || 0), 0);
  const totalPrice = (basePrice * quantity) + sidesPrice;

  // Toggle side selection
  const toggleSide = (side: CartCustomization) => {
    setSelectedSides(prev =>
      prev.some(s => s.id === side.id)
        ? prev.filter(s => s.id !== side.id)
        : [...prev, side]
    );
  };

  // Add to cart
  const addToCart = () => {
    const customizations = [...selectedSides];
  addItem({
  id: itemId,
  name: itemDetails?.name || name,
  price: totalPrice,
  image_url: imageUrl,
  customizations,
});
    Alert.alert('Added to Cart', `${quantity} x ${itemDetails?.name || name} for $${totalPrice.toFixed(2)}`);
    navigation.goBack();
  };

  // Render side option
  const renderSide = ({ item }: { item: CartCustomization }) => (
    <TouchableOpacity
      className="items-center mx-2"
      onPress={() => toggleSide(item)}
    >
      <Image
        source={{ uri: item.image_url || 'https://placehold.co/95x20/FF6B35/FFFFFF?text=Image' }}
        className="w-[95] h-[20] rounded"
        resizeMode="contain"
      />
      <Text className="text-white mt-1">{item.name}</Text>
      <View className="mt-1 bg-gray-700 p-1 rounded">
        <Text className="text-white">+</Text>
      </View>
    </TouchableOpacity>
  );

  if (!itemDetails) return <Text className="text-white">Loading...</Text>;

  return (
    <View className="flex-1 bg-primary p-4">
      {/* Other sections like name, image, subtypes, rating, nutrition, description, toppings would go here */}
      {/* ... */}

      <View className="bg-white rounded-lg p-4 mb-4">
        <Text className="text-lg font-bold text-gray-800 mb-2">Side options</Text>
        <FlatList
          data={itemDetails.sides || []}
          renderItem={renderSide}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id || item.name}
        />
      </View>

      <View className="flex-row justify-between items-center mb-4 p-4 bg-white rounded-lg">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} className="bg-gray-300 p-2 rounded">
            <Text>-</Text>
          </TouchableOpacity>
          <Text className="mx-4 text-lg">{quantity}</Text>
          <TouchableOpacity onPress={() => setQuantity(quantity + 1)} className="bg-gray-300 p-2 rounded">
            <Text>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity className="bg-orange-500 py-2 px-4 rounded-full" onPress={addToCart}>
          <Text className="text-white font-bold">Add to cart (${totalPrice.toFixed(2)})</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity className="bg-gray-600 py-2 rounded" onPress={() => navigation.goBack()}>
        <Text className="text-white text-center">Back</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MenuDetails;