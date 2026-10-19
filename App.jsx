import React from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { RoomProvider } from "./src/contexts/RoomContext";
import { DormProvider } from "./src/contexts/DormContext";
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import styles from "./src/styles/appStyles";

function AppContent() {
  const { user, initializing, profileLoading } = useAuth();

  if (initializing || (user && profileLoading)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#111" />
      </View>
    );
  }

  return user ? <HomeScreen /> : <LoginScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DormProvider>
          <RoomProvider>
            <AppContent />
          </RoomProvider>
        </DormProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
