import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useEffect, useState } from "react";

export default function ProfileScreen() {
  const { uid } = useLocalSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const userRef = doc(firestore, "users", uid as string);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setProfile(userSnap.data());
      }
      setLoading(false);
    };
    if (uid) fetchProfile();
  }, [uid]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text>User not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text>Name: {profile.name}</Text>
      <Text>Email: {profile.email}</Text>
      {/* Add more fields as needed */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
});
