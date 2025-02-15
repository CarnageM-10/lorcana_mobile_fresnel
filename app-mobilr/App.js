import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import SetsScreen from './screens/SetsScreen';
import CardsScreen from './screens/CardsScreen'; 
import WishlistScreen from './screens/WishlistScreen';
import AccountScreen from './screens/AccountScreen';
import RegisterScreen from './screens/RegisterScreen';
import CardDetailsScreen from './screens/CardDetailsScreen';
import CollectionScreen from './screens/CollectionScreen'; 
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="SignUp" 
          component={RegisterScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Sets" 
          component={SetsScreen} 
          options={{ title: 'Mon Compte' }} 
        />
        <Stack.Screen 
          name="Cards" 
          component={CardsScreen} 
          options={{ title: 'Cartes' }} 
        />
        <Stack.Screen 
          name="WishlistScreen" 
          component={WishlistScreen} 
          options={{ title: 'Wishlist' }} 
        />
        <Stack.Screen 
          name="Account" 
          component={AccountScreen} 
          options={{ title: 'Mon Compte', headerShown: false }} 
        />
        <Stack.Screen 
          name="CardDetails" 
          component={CardDetailsScreen} 
          options={{ title: 'Détails de la carte' }} 
        />
        <Stack.Screen 
          name="CollectionScreen" 
          component={CollectionScreen} 
          options={{ title: 'Ma Collection' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
