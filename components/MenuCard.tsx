import { Text, TouchableOpacity, Image, Platform } from 'react-native';
import { MenuItem } from '@/type';
import { appwriteConfig } from '@/lib/appwrite';
import { useCartStore } from '@/store/cart.store';
// import { useNavigation } from '@react-navigation/native'; // Import navigation
// import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // Import for typing
 // Adjust import path as needed

const MenuCard = ({ item: { $id, image_url, name, price } }: { item: MenuItem }) => {
  const imageUrl = `${image_url}?project=${appwriteConfig.projectId}`;
  const { addItem } = useCartStore();


  const getImageSource = (src: string | number | { uri: string }): { uri: string } => {
    if (typeof src === 'string') {
      return { uri: src }; // Remote Appwrite URL
    }
    return { uri: Image.resolveAssetSource(src).uri }; // Handle local assets
  };



  return (
    <TouchableOpacity
      className="menu-card"
      style={Platform.OS === 'android' ? { elevation: 10, shadowColor: '#878787' } : {}}
      // onPress={handlePress} // Redirect to MenuDetail on press
    >
      <Image
        source={getImageSource(imageUrl)}
        className="size-32 absolute -top-10"
        resizeMode="contain"
      />
      <Text className="text-center base-bold text-dark-100 mb-2" numberOfLines={1}>
        {name}
      </Text>
      <Text className="body-regular text-gray-200 mb-4">From ${price}</Text>
      <TouchableOpacity onPress={() => addItem({ id: $id, name, price, image_url: imageUrl, customizations: [] })}>
        <Text className="paragraph-bold text-primary">Add to Cart +</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default MenuCard;