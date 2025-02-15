import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const SetsScreen = ({ navigation }) => {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await axios.get('http://192.168.189.185/api/sets', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setSets(response.data.data);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchSets();
  }, []);

  return (
    <View style={styles.container}>
      {/* Barre de navigation */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navItemContainer}>
          <Text style={styles.navItem}>Liste des chapitres</Text>
        </TouchableOpacity>
      </View>

      {/* Affichage des chapitres */}
      {loading ? (
        <ActivityIndicator size="large" color="#DAA520" />
      ) : sets.length === 0 ? (
        <Text style={styles.emptyText}>Aucun chapitre disponible.</Text>
      ) : (
        <FlatList
          data={sets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.setItem}
              onPress={() => navigation.navigate('Cards', { setId: item.id })}>
              <Text style={styles.setText}>{item.name}</Text>
              <View style={styles.barDecoration} />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Texte en bas */}
      <Text style={styles.footerText}>L'histoire a plusieurs époques :</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DAA520',
    height: 50,
    borderRadius: 10,
    marginBottom: 20,
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
  setItem: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  setText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  barDecoration: {
    width: '80%',
    height: 5,
    backgroundColor: '#DAA520',
    borderRadius: 5,
    marginTop: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
    color: '#666',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 30,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default SetsScreen;
