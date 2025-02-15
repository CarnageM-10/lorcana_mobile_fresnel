import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Dimensions, Modal, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width } = Dimensions.get('window');

const CARD_WIDTH = (width - 30) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

const WishlistScreen = () => {
  const [wishlist, setWishlist] = useState([]);
  const [possessedCards, setPossessedCards] = useState([]);
  const [nonPossessedCards, setNonPossessedCards] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [token, setToken] = useState(null);
  const [selectedTab, setSelectedTab] = useState('nonPosse');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cardType, setCardType] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (storedToken) {
          setToken(storedToken);
          const response = await axios.get('http://192.168.189.185/api/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          setUserId(response.data.id);
          setUserName(response.data.name);
        } else {
          console.error('Token non trouvé');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des infos utilisateur:', error);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const loadCardsState = async () => {
      try {
        const savedNonPossessedCards = await AsyncStorage.getItem('nonPossessedCards');

        if (savedNonPossessedCards) {
          setNonPossessedCards(JSON.parse(savedNonPossessedCards));
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'état des cartes:', error);
      }
    };

    loadCardsState(); // Charger l'état des cartes au démarrage
  }, []);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (userId && token) {
        setLoading(true);
        try {
          const response = await axios.get('http://192.168.189.185/api/wishlist', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.data || !Array.isArray(response.data)) {
            console.error("Format de réponse invalide:", response.data);
            return;
          }

          const userWishlist = response.data.filter(card => card.pivot.user_id === userId);
          const notOwned = userWishlist.filter(card => card.pivot.status !== 'possédé');

          setNonPossessedCards(notOwned);
          setWishlist(userWishlist);
        } catch (error) {
          console.error('Erreur lors de la récupération de la wishlist:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchWishlist();
  }, [userId, token]);

  const handleRemoveFromWishlist = useCallback(async (cardId) => {
    try {
      const response = await axios.post(
        'http://192.168.189.185/api/wishlist/remove',
        { card_id: cardId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        setWishlist((prevWishlist) => prevWishlist.filter(item => item.id !== cardId));
        setPossessedCards((prevCards) => prevCards.filter(item => item.id !== cardId));
        setNonPossessedCards((prevCards) => prevCards.filter(item => item.id !== cardId));
        setModalVisible(false);
        console.log(`Carte ${cardId} supprimée de la wishlist.`);
      } else {
        console.error('Erreur lors de la suppression de la carte');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la carte:', error);
    }
  }, [token]);

  const handleModifyCardStatus = useCallback(() => {
    if (!selectedCardId) return;

    const cardToMove = nonPossessedCards.find(card => card.id === selectedCardId);

    if (cardToMove) {
      // Supprimer la carte de "non possédé"
      setNonPossessedCards(prevCards => prevCards.filter(card => card.id !== selectedCardId));

      // Sauvegarder l'état des cartes dans AsyncStorage
      saveCardsState(); // Sauvegarder les cartes possédées et non possédées

      setModalVisible(false);
    }
  }, [selectedCardId, nonPossessedCards]);

  const saveCardsState = async () => {
    try {
      await AsyncStorage.setItem('nonPossessedCards', JSON.stringify(nonPossessedCards));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'état des cartes:', error);
    }
  };

  const renderCards = () => {
    let cardsToRender = [];

    // Déterminer quel ensemble de cartes afficher selon l'onglet sélectionné
    if (selectedTab === 'nonPosse') {
      cardsToRender = nonPossessedCards;
    } else if (selectedTab === 'customer') {
      cardsToRender = wishlist; // Vous pouvez ajuster cela selon les données à afficher
    }

    return (
      <FlatList
        data={cardsToRender}  // Utilisation de la liste correcte en fonction de l'onglet sélectionné
        keyExtractor={(item) => item.id.toString()}  // Utilisation de item.id si item est l'objet de carte
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View style={styles.cardItem}>
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <Text style={styles.cardStatus}>{item.pivot.status}</Text>
            <Text style={styles.cardRarity}>Rareté : {item.rarity}</Text>

            {selectedTab === 'customer' && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => {
                  setSelectedCardId(item.id);
                  setModalVisible(true);
                }}
              >
                <Icon name="ellipsis-v" size={24} color="black" />
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    );
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => setSelectedTab('nonPosse')} style={styles.navItemContainer}>
          <Text style={selectedTab === 'nonPosse' ? styles.navItemActive : styles.navItem}>Non possédé(e)s</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedTab('customer')} style={styles.navItemContainer}>
          <Text style={selectedTab === 'customer' ? styles.navItemActive : styles.navItem}>Customer</Text>
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
        {selectedTab === 'customer' && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Actions sur la carte</Text>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleRemoveFromWishlist(selectedCardId)}>
                <Text style={styles.actionButtonText}>Supprimer carte</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    backgroundColor: '#fff',
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
  cardCount: {
    fontSize: 12,
    color: 'green',
    textAlign: 'center',
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
  cardRarity: {
    fontSize: 12,
    color: '#DAA520', 
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default WishlistScreen;
