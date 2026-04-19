import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDdd0ybVsfdO0ID-5nW6T_BOSXTFfVGG_w",
  authDomain: "shaikhcalculatoins.firebaseapp.com",
  databaseURL: "https://shaikhcalculatoins-default-rtdb.firebaseio.com",
  projectId: "shaikhcalculatoins",
  storageBucket: "shaikhcalculatoins.firebasestorage.app",
  messagingSenderId: "84409522851",
  appId: "1:84409522851:web:3beca80c74cb8d72fb7d16",
  measurementId: "G-3DZQRQ7C89"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, set, get, onValue };
