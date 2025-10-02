import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { useUserStore } from "@/store/userStore";
import { images } from "@/constants";
import * as ImagePicker from "expo-image-picker";

const Profile = () => {
  const { name, email, phone, address1, address2, avatar } = useUserStore();
  const [localAvatar, setLocalAvatar] = useState<{ uri: string } | number>(
    typeof avatar === "number"
      ? avatar
      : avatar && avatar.uri
      ? { uri: avatar.uri }
      : { uri: "" } // fallback
  );
  const handleEditProfile = () => router.push("/(tabs)/edit-profile");

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Yes", onPress: () => router.replace("/") },
    ]);
  };
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setLocalAvatar({ uri: result.assets[0].uri });
    }
  };

  return (
    <View className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-lg w-full max-w-sm mx-auto my-8">
    {/* Avatar */}
         <TouchableOpacity className="self-center mb-6" onPress={pickImage}>
             <Image
                    source={localAvatar || require("@/assets/images/avatar.png").avatar}
                    className="w-24 h-24 rounded-full border border-gray-300"
                  />
           <Text className="text-center text-gray-500 mt-2">Change Avatar</Text>
         </TouchableOpacity>

      {/* Profile Details */}
      <View className="w-full pb-6 mb-6 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800 text-center mb-4">
          {name}
        </Text>

        {/* Email */}
        <View className="flex flex-row items-center mb-3">
          <Text className="text-gray-400 mr-2 text-2xl">📧</Text>
          <Text className="text-gray-600 text-base">{email}</Text>
        </View>

        {/* Phone */}
        <View className="flex flex-row items-center mb-3">
          <Text className="text-gray-400 mr-2 text-2xl">📞</Text>
          <Text className="text-gray-600 text-base">{phone}</Text>
        </View>

        {/* Address 1 */}
        <View className="flex flex-row items-start mb-3">
          <Text className="text-gray-400 mr-2 text-2xl mt-1">🏠</Text>
          <View className="flex-1">
            <Text className="text-gray-400 text-xs">Address 1 (Home)</Text>
            <Text className="text-gray-600 text-base">{address1}</Text>
          </View>
        </View>

        {/* Address 2 */}
        <View className="flex flex-row items-start">
          <Text className="text-gray-400 mr-2 text-2xl mt-1">🏢</Text>
          <View className="flex-1">
            <Text className="text-gray-400 text-xs">Address 2 (Work)</Text>
            <Text className="text-gray-600 text-base">{address2}</Text>
          </View>
        </View>
      </View>

      {/* Buttons */}
      <View className="w-full space-y-4 mt-4 gap-4">
        <TouchableOpacity
          className="bg-orange-500 py-4 rounded-full w-full shadow-md transition-colors duration-200 active:bg-orange-600"
          onPress={handleEditProfile}
        >
          <Text className="text-white text-center font-bold">Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="border border-orange-500 py-4 rounded-full w-full shadow-md transition-colors duration-200 active:bg-orange-50"
          onPress={handleLogout}
        >
          <Text className="text-orange-500 text-center font-bold">Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Profile;


