import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';

export default function PanicScreen() {
  const handleCall988 = async () => {
    const url = 'tel:988';

    Alert.alert(
      'Call 988',
      'You are about to call the Suicide & Crisis Lifeline.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 988',
          style: 'destructive',
          onPress: async () => {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
              await Linking.openURL(url);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>EMERGENCY SUPPORT</Text>
      </View>

      <View style={styles.heroTriangle}>
        <Text style={styles.heroIcon}>⚠</Text>
      </View>

      <Text style={styles.title}>You are not alone.</Text>
      <Text style={styles.subtitle}>
        Take one step at a time. Use a calming tool below or call 988 now.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleCall988}>
        <Text style={styles.primaryButtonText}>Call 988 Now</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ground yourself</Text>
        <Text style={styles.cardText}>
          Name 5 things you can see, 4 you can feel, 3 you can hear, 2 you can smell, and 1 you can taste.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Breathe slowly</Text>
        <Text style={styles.cardText}>
          Inhale for 4 seconds, hold for 4, exhale for 6. Repeat 5 times.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Get to safety</Text>
        <Text style={styles.cardText}>
          Move to a safer room, sit down, and reach out to someone you trust if you can.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0B1220',
    padding: 24,
    alignItems: 'center',
  },
  badge: {
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: '#3F1D1D',
    borderColor: '#EF4444',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTriangle: {
  width: 0,
  height: 0,
  borderLeftWidth: 70,
  borderRightWidth: 70,
  borderBottomWidth: 120,
  borderLeftColor: 'transparent',
  borderRightColor: 'transparent',
  borderBottomColor: '#DC2626',
  marginBottom: 24,
  alignItems: 'center',
  justifyContent: 'center',
},
heroIcon: {
  position: 'absolute',
  top: 40,        // 👈 adjust this if needed
  fontSize: 60,
  color: '#FFFFFF',
  fontWeight: '900',
  textAlign: 'center',
},
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#CBD5E1',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 420,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#DC2626',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  card: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardText: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 22,
  },
});