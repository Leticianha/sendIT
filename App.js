import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, StatusBar, Image, Alert, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // Importação padrão
import { auth, firestore } from './firebaseConfig'; // Import firestore
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, setDoc, getDocs, query, where, serverTimestamp, doc } from 'firebase/firestore';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [usuario, setUsuario] = useState(null);
  const [entrada, setEntrada] = useState('');
  const [mensagens, setMensagens] = useState([]);
  const [carregando, setCarregando] = useState(false);

  // Fonte
  const [fontsLoaded, fontError] = useFonts({
    'Poppins': require('./assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Black': require('./assets/fonts/Poppins-Black.ttf'),
    'Poppins-Light': require('./assets/fonts/Poppins-Light.ttf'),
    'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const atualizaUsuario = onAuthStateChanged(auth, (usuario) => {
      setUsuario(usuario);
    });

    return () => atualizaUsuario();
  }, []);

  useEffect(() => {
    if (usuario) {
      buscarMensagens();
    } else {
      setMensagens([]);
    }
  }, [usuario]);

  const buscarMensagens = async () => {
    setCarregando(true);
    try {
      if (usuario && usuario.email) {
        const q = query(collection(firestore, 'messages'), where('uid', '==', usuario.uid));
        const querySnapshot = await getDocs(q);
        const mensagensBuscadas = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMensagens(mensagensBuscadas);
      }
    } catch (error) {
      console.error("Erro ao buscar mensagens: ", error);
    } finally {
      setCarregando(false);
    }
  };

  const isEmailValid = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(email);
  };

  const cadastrar = async () => {
    if (!isEmailValid(email)) {
      Alert.alert('Erro', 'Email inválido');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;
      setUsuario(user);

      // Save the user's email as the document ID in Firestore
      await setDoc(doc(firestore, 'users', email), {
        uid: user.uid,
        email: user.email,
        createdAt: serverTimestamp(),
      });

      setEmail('');
      setSenha('');
    } catch (error) {
      // Personalizar a mensagem de erro para senha
      if (error.code === 'auth/weak-password') {
        Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      } else {
        Alert.alert('Erro', error.message);
      }
    }
  };

  const entrar = () => {
    if (!isEmailValid(email)) {
      Alert.alert('Erro', 'Email inválido');
      return;
    }
    signInWithEmailAndPassword(auth, email, senha)
      .then(userCredential => {
        setUsuario(userCredential.user);
        setEmail('');
        setSenha('');
      })
      .catch(error => Alert.alert('Erro', error.message));
  };

  const sair = () => {
    signOut(auth)
      .then(() => setUsuario(null))
      .catch(error => Alert.alert('Erro', error.message));
  };

  const enviarMensagem = async () => {
    try {
      if (entrada.trim() !== '') {
        if (usuario && usuario.email) {
          const docId = `${usuario.email}_${Date.now()}`; // Unique ID for each message
          await setDoc(doc(firestore, 'messages', docId), {
            text: entrada,
            createdAt: serverTimestamp(),
            uid: usuario.uid
          });
          Alert.alert("Mensagem enviada", "A mensagem foi enviada com sucesso e será notificada.");
          setEntrada('');
          buscarMensagens();
        } else {
          Alert.alert("Erro", "Usuário não autenticado");
        }
      } else {
        Alert.alert("Erro", "Digite uma mensagem antes de enviar");
      }
    } catch (error) {
      console.error("Erro ao adicionar mensagem: ", error);
      Alert.alert("Erro", "Não foi possível enviar a mensagem");
    }
  };
  

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ScrollView style={styles.container} onLayout={onLayoutRootView} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" />
      {usuario ? (
        <>
          <View style={styles.mensagens}>
            <View style={styles.containerLogo}>
              <Image source={require('./assets/send.png')} style={styles.logo} />
              <Text style={styles.titulo}>Send<Text style={styles.tituloBold}>It</Text></Text>
            </View>

            <View style={styles.containerBanner}>
              <Image source={require('./assets/imgCentro.png')} style={styles.banner} />
            </View>

            <View style={styles.containerInfo}>
              <Text style={styles.textoInfo}><Text style={styles.textoInfoBold}>Adicione</Text> uma mensagem para ser notificado <Text style={styles.textoInfoBold}>no outro aplicativo</Text></Text>
            </View>

            <View style={styles.containerMensagem}>
              <View style={styles.boxMensagem}>
                <MaterialIcons name="comment" size={33} color="#2D59B0" />
                <TextInput
                  style={styles.inputMensagem}
                  placeholder="Digite uma mensagem"
                  value={entrada}
                  onChangeText={setEntrada}
                  textAlignVertical="top"
                  numberOfLines={10}
                  multiline
                />
              </View>

              <TouchableOpacity style={styles.botao} onPress={enviarMensagem}>
                <Text style={styles.botaoTexto}>Enviar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.botao} onPress={sair}>
                <Text style={styles.botaoTexto}>Sair</Text>
              </TouchableOpacity>
            </View>

          </View>
        </>
      ) : (
        <>
          <View style={styles.login}>
            <View style={styles.containerLogo}>
              <Image source={require('./assets/send.png')} style={styles.logo} />
              <Text style={styles.titulo}>Send<Text style={styles.tituloBold}>It</Text></Text>
            </View>

            <View style={styles.containerBanner}>
              <Image source={require('./assets/imgCentro.png')} style={styles.banner} />
            </View>

            <View style={styles.containerInputs}>
              <View style={styles.boxInput}>
                <MaterialIcons name="email" size={33} color="#2D59B0" />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.boxInput}>
                <Image source={require('./assets/password.png')} style={styles.senha} />
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity style={[styles.botao, { marginTop: 20 }]} onPress={cadastrar}>
                <Text style={styles.botaoTexto}>Cadastrar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.botao} onPress={entrar}>
                <Text style={styles.botaoTexto}>Entrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 40,
  },
  login: {
    marginTop: 45
  },
  containerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 35,
    height: 30,
    marginRight: 5
  },
  titulo: {
    fontFamily: 'Poppins',
    color: '#000',
    fontSize: 20
  },
  tituloBold: {
    fontFamily: 'Poppins-Bold'
  },
  containerBanner: {
    alignItems: 'center',
    marginBottom: 50
  },
  banner: {
    width: 250,
    height: 250
  },
  containerInputs: {
    alignItems: 'center'
  },
  boxInput: {
    flexDirection: 'row',
    borderWidth: 2,
    borderRadius: 20,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  input: {
    paddingLeft: 5,
    paddingTop: 4,
    fontFamily: 'Poppins-Light',
    width: '85%',
    fontSize: 15,
  },
  senha: {
    width: 30,
    height: 18
  },
  botao: {
    backgroundColor: '#2D59B0',
    width: '70%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 13
  },
  botaoTexto: {
    fontFamily: 'Poppins-Bold',
    color: '#fff',
    textTransform: 'uppercase'
  },
  containerInfo: {
    marginBottom: 30
  },
  textoInfo: {
    fontFamily: 'Poppins',
    fontSize: 16,
    textAlign: 'center'
  },
  textoInfoBold: {
    fontFamily: 'Poppins-Bold'
  },
  containerMensagem: {
    alignItems: 'center'
  },
  boxMensagem: {
    borderWidth: 2,
    borderRadius: 20,
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 6,
    height: 120,
    flex: 1,
    marginBottom: 15,
  },
  inputMensagem: {
    flex: 1,
    padding: 10,
    paddingTop: 3
  }
});
