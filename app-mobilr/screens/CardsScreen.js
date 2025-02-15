import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome';
import Modal from 'react-native-modal';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const CardsScreen = ({ route }) => {
  const { setId } = route.params;
  const [cards, setCards] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isWishlist, setIsWishlist] = useState({});
  const [isCollection, setIsCollection] = useState({});
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true); // Etat de chargement
  const [filter, setFilter] = useState('all'); // Filtre pour afficher wishlist, possédées ou toutes les cartes

  const navigation = useNavigation();

  // Fonction pour récupérer l'utilisateur et son ID
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          const response = await axios.get('http://192.168.189.185/api/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserId(response.data.id);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      }
    };

    fetchUser();
  }, []);

  // Fonction pour récupérer les cartes, wishlist, et collection
  useEffect(() => {
    const fetchCardsAndCollectionData = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;

        // Récupérer les cartes
        const response = await axios.get(`http://192.168.189.185/api/sets/${setId}/cards`);
        setCards(response.data.data);

        // Initialisation des états de wishlist et collection
        const initialWishlistState = {};
        const initialCollectionState = {};

        response.data.data.forEach(card => {
          initialWishlistState[card.id] = false;
          initialCollectionState[card.id] = false;
        });

        setIsWishlist(initialWishlistState);
        setIsCollection(initialCollectionState);

        if (userId) {
          // Récupérer wishlist et collection
          const [collectionRes, wishlistRes] = await Promise.all([
            axios.get('http://192.168.189.185/api/collection', {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get('http://192.168.189.185/api/wishlist', {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

          const collectionMap = {};
          collectionRes.data.forEach(card => {
            if (card.pivot.user_id === userId) {
              collectionMap[card.api_id] = true;
            }
          });

          const wishlistMap = {};
          wishlistRes.data.forEach(card => {
            if (card.pivot.user_id === userId) {
              wishlistMap[card.api_id] = true;
            }
          });

          setIsCollection(collectionMap);
          setIsWishlist(wishlistMap);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des cartes, collection ou wishlist :', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCardsAndCollectionData();
  }, [setId, userId]);

  // Fonction pour ajouter une carte à la wishlist
  const handleAddToWishlist = async (item) => {
    if (!item || isWishlist[item.id]) {
      console.log("Cette carte est déjà dans la wishlist.");
      return;
    }

    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      console.error("Token non trouvé");
      return;
    }

    try {
      await axios.post(
        'http://192.168.189.185/api/wishlist/add',
        { 
          card_id: item.id,
          user_id: userId
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setIsWishlist(prev => ({ ...prev, [item.id]: true }));
      console.log(`Carte ${item.id} ajoutée à la wishlist.`);
    } catch (error) {
      console.error("Erreur lors de l'ajout à la wishlist :", error.response ? error.response.data : error.message);
    }
  };

  // Fonction pour afficher ou masquer le modal
  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  // Fonction pour gérer l'interaction sur une carte (ouvrir le modal)
  const handleCardPress = (card) => {
    setSelectedCard(card);
    toggleModal();
  };

  // Filtrage des cartes selon la recherche
  const filteredCards = cards.filter(card => card.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Applique le filtre de catégorie (wishlist, possédées ou toutes les cartes)
  const applyCategoryFilter = (filteredCards) => {
    if (filter === 'wishlist') {
      return filteredCards.filter(card => isWishlist[String(card.id)]);
    } else if (filter === 'collection') {
      return filteredCards.filter(card => isCollection[String(card.id)]);
    }
    return filteredCards; // Si 'all', retourne toutes les cartes
  };

  const cardsToDisplay = applyCategoryFilter(filteredCards);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher des cartes..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Filtre de catégorie */}
      <View style={styles.filterContainer}>
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => setFilter('all')} style={styles.navItemContainer}>
            <Text style={filter === 'all' ? styles.navItemActive : styles.navItem}>Tout afficher</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilter('wishlist')} style={styles.navItemContainer}>
            <Text style={filter === 'wishlist' ? styles.navItemActive : styles.navItem}>Wishlist</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilter('collection')} style={styles.navItemContainer}>
            <Text style={filter === 'collection' ? styles.navItemActive : styles.navItem}>Possédé(e)s</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Affichage des cartes */}
      {loading ? (
        <Text>Chargement...</Text>
      ) : (
        <FlatList
          data={cardsToDisplay}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <View style={styles.cardItem}>
              <Image source={{ uri: item.image }} style={styles.cardImage} />
              <Text style={styles.cardText}>{item.name}</Text>

              <View style={styles.iconContainer}>
                <TouchableOpacity onPress={() => handleCardPress(item)}>
                  <Icon name="eye" size={22} color="black" />
                </TouchableOpacity>

                <View>
                  <Icon name="heart" size={22} color={isWishlist[item.id] ? "orange" : "gray"} />
                </View>
                <View>
                  <Icon name="heart" size={22} color={isCollection[item.id] ? "blue" : "gray"} />
                </View>
              </View>
              {isCollection[item.id] && <Text style={styles.allowedTexty}>Ajouté à la collection</Text>}
              {isWishlist[item.id] && <Text style={styles.allowedText}>Ajouté à la wishlist</Text>}
            </View>
          )}
        />
      )}

      {/* Modal pour afficher les détails de la carte */}
      <Modal isVisible={isModalVisible} onBackdropPress={toggleModal}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={toggleModal}>
            <Icon name="times-circle" size={26} color="red" />
          </TouchableOpacity>

          {selectedCard && (
            <>
              <Image source={{ uri: selectedCard.image }} style={styles.modalImage} />
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => navigation.navigate('CardDetails', { card: selectedCard })}
                >
                  <Text style={styles.detailsButtonText}>Voir les détails</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.collectionButton}
                  onPress={() => handleAddToWishlist(selectedCard)}
                >
                  <Text style={styles.collectionButtonText}>Ajouter à la wishlist</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* Lien vers la wishlist */}
      <TouchableOpacity onPress={() => navigation.navigate('WishlistScreen', { userId })} style={styles.collectionLink}>
        <Text style={styles.collectionLinkText}>Voir ma wishlist</Text>
      </TouchableOpacity>
    </View>
  );
};

const CARD_WIDTH = (width - 30) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f7f7f7', 
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  row: {
    justifyContent: 'space-between',
  },
  cardItem: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  cardImage: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: 12,
  },
  cardText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 5,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
    height: '70%',
  },
  modalImage: {
    width: '100%',
    height: 400,
    borderRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  allowedText: {
    color: 'orange',
    fontWeight: 'bold',
    marginTop: 5,
  },
  allowedTexty: {
    color: 'blue',
    fontWeight: 'bold',
    marginTop: 5,
  },
  collectionButton: {
    backgroundColor: '#FFB300',
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  collectionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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
  filterContainer: {
    width: '100%',
    flexDirection: 'column',
    paddingHorizontal: 10,
    marginTop: 20,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#DAA520',
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
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

  detailsButton: {
    backgroundColor: '#FF6347',
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 10,
  },

  detailsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
});

export default CardsScreen;
