import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AccountScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.replace('Login');
        return;
      }

      const response = await fetch('http://192.168.189.185/api/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setUser(data);
      } else {
        await AsyncStorage.removeItem('userToken');
        navigation.replace('Login');
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des infos :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        await fetch('http://192.168.189.185/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      await AsyncStorage.removeItem('userToken');
      navigation.replace('Login');
    } catch (error) {
      console.error("Erreur de déconnexion :", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#DAA520" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={handleLogout}
        >
          <Text style={styles.navItemText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Mon Compte</Text>

      <View style={styles.profileSection}>
        {/* Utilisation d'une image locale dans le dossier images */}
        <Image source={require('./image/profile.png')} style={styles.profileImage} />
        <Text style={styles.name}>{user ? user.name : 'Utilisateur'}</Text>
        <Text style={styles.email}>{user ? user.email : 'Email'}</Text>
        {/* Ajout d'un autre item utilisateur */}
        <Text style={styles.info}>Téléphone: {user ? user.phone : 'Numéro de téléphone'}</Text>
      </View>

      {user ? (
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Sets')}>
          <Text style={styles.secondaryButtonText}>Voir les chapitres</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.errorText}>Erreur lors du chargement des données.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333',  // Fond noir clair
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 40,
  },
  navItem: {
    backgroundColor: '#FF6347',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
  },
  navItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#fff',  // Texte "Mon Compte" en blanc
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 50,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Bloc transparent
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  info: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF6347',
    paddingVertical: 15,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#FFB200',  // Jaune foncé
    paddingVertical: 15,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginTop: 50,  // Centré et un peu plus bas
    alignSelf: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AccountScreen;
