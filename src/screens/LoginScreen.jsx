import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import styles from "../styles/appStyles";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
    } catch (loginError) {
      if (loginError.code === "auth/profile-not-configured") {
        setError(
          "บัญชีนี้ยังไม่มี role ใน Firestore ให้ผู้ดูแลตั้ง users/{UID}.role เป็น admin หรือ tenant",
        );
      } else if (loginError.code === "permission-denied") {
        setError("Firestore Rules ยังไม่อนุญาต กรุณาเผยแพร่ Rules ล่าสุด");
      } else if (loginError.code === "auth/network-request-failed") {
        setError("เชื่อมต่อ Firebase ไม่ได้ กรุณาตรวจอินเทอร์เน็ต");
      } else {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.centered}>
        <MaterialCommunityIcons
          name="office-building"
          size={48}
          color="#171717"
        />
        <Text style={styles.logo}>DORMCARE</Text>
        <Text style={styles.subtitle}>ระบบจัดการหอพัก</Text>
        <Text style={styles.authHeading}>เข้าสู่ระบบ</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#777777"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#777777"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={styles.primaryButton}
          onPress={handleLogin}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
