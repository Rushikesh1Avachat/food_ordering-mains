import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useUserStore } from "@/store/userStore";
import { images } from "@/constants";

const EditProfile = () => {
  const {
    name,
    email,
    phone,
    address1,
    address2,
    avatar,
    setName,
    setEmail,
    setPhone,
    setAddress1,
    setAddress2,
    setAvatar,
  } = useUserStore();

  // Local editable state
  const [localName, setLocalName] = useState(name);
  const [localEmail, setLocalEmail] = useState(email);
  const [localPhone, setLocalPhone] = useState(phone);
  const [localAddress1, setLocalAddress1] = useState(address1);
  const [localAddress2, setLocalAddress2] = useState(address2);

  // Local avatar state, safely handle undefined or number
  const [localAvatar, setLocalAvatar] = useState<{ uri: string } | number>(
    typeof avatar === "number"
      ? avatar
      : avatar && avatar.uri
      ? { uri: avatar.uri }
      : { uri: "" } // fallback
  );

  // Pick a new image
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

  const handleSave = () => {
    setName(localName);
    setEmail(localEmail);
    setPhone(localPhone);
    setAddress1(localAddress1);
    setAddress2(localAddress2);
    setAvatar(localAvatar);

    Alert.alert("Success", "Profile updated!", [{ text: "OK", onPress: () => router.back() }]);
  };

  return (
    <ScrollView className="flex-1 bg-white p-6">
      <Text className="text-2xl font-bold mb-6 text-center">Edit Profile</Text>

      {/* Avatar */}
      <TouchableOpacity className="self-center mb-6" onPress={pickImage}>
        <Image
          source={localAvatar || require("@/assets/images/avatar.png").avatar}
          className="w-24 h-24 rounded-full border border-gray-300"
        />
        <Text className="text-center text-gray-500 mt-2">Change Avatar</Text>
      </TouchableOpacity>

      {/* Name */}
      <View className="mb-4">
        <Text className="text-gray-600 mb-1">Name</Text>
        <TextInput
          value={localName}
          onChangeText={setLocalName}
          className="border border-gray-300 rounded-xl p-3"
        />
      </View>

      {/* Email */}
      <View className="mb-4">
        <Text className="text-gray-600 mb-1">Email</Text>
        <TextInput
          value={localEmail}
          onChangeText={setLocalEmail}
          keyboardType="email-address"
          className="border border-gray-300 rounded-xl p-3"
        />
      </View>

      {/* Phone */}
      <View className="mb-4">
        <Text className="text-gray-600 mb-1">Phone</Text>
        <TextInput
          value={localPhone}
          onChangeText={setLocalPhone}
          keyboardType="phone-pad"
          className="border border-gray-300 rounded-xl p-3"
        />
      </View>

      {/* Address 1 */}
      <View className="mb-4">
        <Text className="text-gray-600 mb-1">Address 1 (Home)</Text>
        <TextInput
          value={localAddress1}
          onChangeText={setLocalAddress1}
          className="border border-gray-300 rounded-xl p-3"
        />
      </View>

      {/* Address 2 */}
      <View className="mb-6">
        <Text className="text-gray-600 mb-1">Address 2 (Work)</Text>
        <TextInput
          value={localAddress2}
          onChangeText={setLocalAddress2}
          className="border border-gray-300 rounded-xl p-3"
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity
        className="bg-orange-500 py-4 rounded-full w-full shadow-md"
        onPress={handleSave}
      >
        <Text className="text-white text-center font-bold text-lg">Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default EditProfile;


