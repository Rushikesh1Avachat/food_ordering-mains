import { View, Text } from 'react-native'
import React from 'react'
import { CartItemType } from "@/type";
const CartItem = ({ item }: { item: CartItemType }) => {
  return (
    <View>
      <Text>CartItem</Text>
    </View>
  )
}

export default CartItem
