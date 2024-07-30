import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // apiKey: "AIzaSyAMddp1YHbnrgBSVKYzUNanLtVxxWxs6EE",
  authDomain: "sendit-cc0c7.firebaseapp.com",
  projectId: "sendit-cc0c7",
  storageBucket: "sendit-cc0c7.appspot.com",
  messagingSenderId: "658225521625",
  appId: "1:658225521625:web:9228fccca96dbc96d06fc8"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
const firestore = getFirestore(app);

export { auth, firestore };
