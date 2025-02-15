import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CardDetailsScreen = ({ route, navigation }) => {
  const { card } = route.params;
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          const response = await axios.get('http://192.168.189.185/api/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserId(response.data.id);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur :", error);
      }
    };

    fetchUserId();
  }, []);

  const handleAddToCollection = async () => {
    if (!userId) {
      console.error("ID utilisateur non trouvé.");
      return;
    }
  
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      console.error("Token non trouvé.");
      return;
    }
  
    try {
      await axios.post(
        'http://192.168.189.185/api/collection/add',
        {
          card_id: card.id,
          user_id: userId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      console.log("Carte ajoutée avec succès !");
      navigation.navigate('CollectionScreen');
    } catch (error) {
      console.error("Erreur lors de l'ajout à la collection :", error.response ? error.response.data : error.message);
    }
  };
  

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Text style={styles.cardName}>{card.name}</Text>
        <Text style={styles.cardVersion}>Version suivie: {card.version}</Text>
        <Image source={{ uri: card.image }} style={styles.cardImage} />
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleAddToCollection}>
        <Text style={styles.addButtonText}>Ajouter à ma collection</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('CollectionScreen')} style={styles.collectionLink}>
        <Text style={styles.collectionLinkText}>Voir ma collection</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    padding: 20,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardImage: {
    width: '80%',
    height: 400,
    borderRadius: 10,
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 10,
  },
  cardVersion: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#FFB300',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 20,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  collectionLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  collectionLinkText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFB300',
  },
});

export default CardDetailsScreen;
