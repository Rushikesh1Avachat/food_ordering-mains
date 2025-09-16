import { View, Text, Button, Alert } from 'react-native'
import  React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import seed from '@/lib/seed'




const Search = () => {
  return (
    <SafeAreaView className="bg-white h-full">
        <Text>Search</Text>
     {/* <Button
  title="Seed"
  onPress={() =>seed().catch((error:any) => Alert.alert("Failed to seed the database:", error)) }/> */}
       <Button
  title="Seed"
  onPress={() =>seed().catch((error:any) => console.log("Failed to seed the database:", error)) }/>
    </SafeAreaView>
  )
}

export default Search