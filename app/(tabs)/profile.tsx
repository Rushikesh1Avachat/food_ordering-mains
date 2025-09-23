import React from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { images } from '@/constants';

const Profile = () => {
  const navigation = useNavigation();

  return (
    <View className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-lg w-full max-w-sm mx-auto my-8">
      {/* Avatar Section */}
      <View className="mb-6">
        <Image
          source={images.avatar}
          className="w-24 h-24 rounded-full border border-gray-200"
          alt="User avatar"
        />
      </View>
      
      {/* Profile Details */}
      <View className="w-full pb-6 mb-6 border-b border-gray-200">
        {/* Name */}
        <Text className="text-xl font-bold text-gray-800 text-center mb-4">Adrian Hajdin</Text>
         {/* Email */}
        {/* <View className="flex flex-row items-center mb-3">
          <Text className="text-gray-400 mr-2 text-2xl">📧📞</Text>
          <Text className="text-gray-600 text-base">adrian@gmail.com</Text>
        </View> */}
        
        {/* Phone */}
        <View className="flex flex-row items-center mb-3">
          <Text className="text-gray-400 mr-2 text-2xl">📞</Text>
          <Text className="text-gray-600 text-base">+1 555 123 4567</Text>
        </View>
        
        {/* Address 1 */}
        <View className="flex flex-row items-start mb-3">
          <Text className="text-gray-400 mr-2 text-2xl mt-1">🏠</Text>
          <View className="flex-1">
            <Text className="text-gray-400 text-xs">Address 1 (Home)</Text>
            <Text className="text-gray-600 text-base">123 Main Street, Springfield, IL 62704</Text>
          </View>
        </View>
        
        {/* Address 2 */}
        <View className="flex flex-row items-start">
          <Text className="text-gray-400 mr-2 text-2xl mt-1">🏢</Text>
          <View className="flex-1">
            <Text className="text-gray-400 text-xs">Address 2 (Work)</Text>
            <Text className="text-gray-600 text-base">221B Rose Street, Foodville, FL 12345</Text>
          </View>
        </View>
      </View>
      
      {/* Buttons */}
      <View className="w-full space-y-4">
        <TouchableOpacity
          className="bg-orange-500 py-4 rounded-full w-full shadow-md transition-colors duration-200 active:bg-orange-600"
          onPress={() => router.replace("/")} // Navigate to edit screen
        >
          <Text className="text-white text-center font-bold">Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="border border-orange-500 py-4 rounded-full w-full shadow-md transition-colors duration-200 active:bg-orange-50"
          onPress={() => {
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Yes', onPress: () => router.replace('/') },
            ]);
          }}
        >
          <Text className="text-orange-500 text-center font-bold">Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Profile;
