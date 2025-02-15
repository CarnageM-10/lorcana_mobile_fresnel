import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Dimensions, Modal, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width } = Dimensions.get('window');

const CARD_WIDTH = (width - 30) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

const CollectionScreen = ({ navigation }) => {
  const [collection, setCollection] = useState([]);
  const [userId, setUserId] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'standard', 'brillante'
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cardType, setCardType] = useState('standard'); // Nouvelle variable pour stocker le type de carte

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          const response = await axios.get('http://192.168.189.185/api/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserId(response.data.id);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des infos utilisateur:', error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    // Charger la préférence du type de carte depuis AsyncStorage au démarrage
    const loadSelectedType = async () => {
      try {
        const storedType = await AsyncStorage.getItem('selectedType');
        if (storedType) {
          setSelectedType(storedType);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du type sélectionné:', error);
      }
    };

    loadSelectedType();
  }, []);

  useEffect(() => {
    const fetchCollection = async () => {
      if (userId) {
        setLoading(true);
        try {
          const token = await AsyncStorage.getItem('userToken');
          const response = await axios.get('http://192.168.189.185/api/collection', {
            headers: { Authorization: `Bearer ${token}` },
          });

          setCollection(response.data);
        } catch (error) {
          console.error('Erreur lors de la récupération de la collection :', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCollection();
  }, [userId]);

  const handleRemoveFromCollection = useCallback(async (cardId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      await axios.post(
        'http://192.168.189.185/api/collection/remove',
        { card_id: cardId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCollection((prevCollection) => {
        return prevCollection.filter((card) => card.id !== cardId);
      });

      setModalVisible(false);
      console.log(`La carte avec l'ID ${cardId} a été supprimée de la collection.`);
    } catch (error) {
      console.error('Erreur lors de la suppression de la carte:', error);
    }
  }, []);

  const handleCardTypeChange = async (cardId, type) => {
    // Change le type de la carte et met à jour AsyncStorage
    const updatedCollection = collection.map((card) => {
      if (card.id === cardId) {
        card.status = type; // Mise à jour du type de la carte
      }
      return card;
    });

    setCollection(updatedCollection);
    setCardType(type); // Mettre à jour l'état local du type de la carte
    setSelectedType(type); // Ajouter cette ligne pour synchroniser le type de carte sélectionné
    
    try {
      await AsyncStorage.setItem('selectedCardType', type); // Sauvegarder le type dans AsyncStorage
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du type de carte:', error);
    }
  };

  // Fonction pour compter les occurrences de chaque carte
  const countOccurrences = (cards) => {
    const count = {};
    cards.forEach((card) => {
      count[card.id] = (count[card.id] || 0) + 1;
    });
    return count;
  };

  const renderCards = () => {
    // Filtrer les cartes par type sélectionné
    const filteredCards = collection.filter((card) => card.status === selectedType || selectedType === 'all');

    // Créer un tableau avec les cartes uniques basées sur l'ID
    const uniqueCards = filteredCards.filter((value, index, self) => 
      index === self.findIndex((t) => (
        t.id === value.id
      ))
    );

    // Comptabiliser les occurrences des cartes
    const cardCounts = countOccurrences(filteredCards);

    return (
      <FlatList
        data={uniqueCards} // Utilisez le tableau unique ici
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View style={[styles.cardItem, { backgroundColor: item.status === 'brillante' ? '#FFD700' : '#fff' }]}>
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <Text style={styles.cardStatus}>{item.status}</Text>
            <View style={styles.cardInfoContainer}>
              <Text style={styles.cardRarity}>Rareté : {item.rarity}</Text>
              {/* Affichage du nombre de cartes */}
              <TouchableOpacity style={styles.cardCountButton}>
                <Text style={styles.cardCountText}>{cardCounts[item.id]}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => {
                setSelectedCardId(item.id);
                setModalVisible(true);
              }}
            >
              <Icon name="ellipsis-v" size={24} color="black" />
            </TouchableOpacity>
          </View>
        )}
      />
    );
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => setSelectedType('standard')} style={styles.navItemContainer}>
          <Text style={selectedType === 'standard' ? styles.navItemActive : styles.navItem}>Standard</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedType('brillante')} style={styles.navItemContainer}>
          <Text style={selectedType === 'brillante' ? styles.navItemActive : styles.navItem}>Brillante</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedType('all')} style={styles.navItemContainer}>
          <Text style={selectedType === 'all' ? styles.navItemActive : styles.navItem}>Tous</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#DAA520" />
        ) : (
          renderCards()
        )}
      </View>

      <Modal transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Actions sur la carte</Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCardTypeChange(selectedCardId, 'standard')}
            >
              <Text style={styles.actionButtonText}>Choisir Standard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCardTypeChange(selectedCardId, 'brillante')}
            >
              <Text style={styles.actionButtonText}>Choisir Brillante</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => handleRemoveFromCollection(selectedCardId)}>
              <Text style={styles.actionButtonText}>Supprimer la carte</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingTop: 30,
    backgroundColor: '#DAA520',
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 1,
    height: 50,
  },
  navItemContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItem: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  navItemActive: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
  },
  cardContainer: {
    marginTop: 80,
    padding: 10,
  },
  row: {
    justifyContent: 'space-between',
  },
  cardItem: {
    width: CARD_WIDTH,
    borderRadius: 8,
    padding: 5,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: 8,
  },
  cardStatus: {
    fontSize: 12,
    color: 'gray',
    textAlign: 'center',
  },
  cardInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  cardRarity: {
    fontSize: 12,
    color: '#DAA520',
    fontWeight: 'bold',
  },
  cardCountButton: {
    backgroundColor: '#ADD8E6',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCountText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: '#DAA520',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  actionButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#888',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default CollectionScreen;
