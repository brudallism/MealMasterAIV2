// src/screens/PlansScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Button from '@/components/atoms/Button';

export default function PlansScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Meal Plans</Text>
          <Text style={styles.subtitle}>Coming Soon in V0.3!</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.placeholder}>
            🍽️ Smart Meal Planning
          </Text>
          <Text style={styles.description}>
            We're building intelligent meal planning features that will revolutionize how you plan your nutrition.
          </Text>
          
          <View style={styles.featureList}>
            <Text style={styles.sectionTitle}>Coming in V0.3:</Text>
            <FeatureItem icon="🤖" text="AI-generated meal suggestions based on your goals" />
            <FeatureItem icon="📊" text="Personalized nutrition plans with macro targets" />
            <FeatureItem icon="🛒" text="Automatic shopping list generation" />
            <FeatureItem icon="👨‍🍳" text="Recipe recommendations and meal prep guides" />
            <FeatureItem icon="🔄" text="Weekly meal plan optimization" />
          </View>

          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>Development Progress:</Text>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
            <Text style={styles.progressText}>25% Complete • Expected Q1 2025</Text>
          </View>

          <Button
            title="Get Notified When Ready"
            onPress={() => console.log('Notification signup requested')}
            variant="primary"
            size="medium"
            icon="🔔"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 12,
  },
  placeholder: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featureList: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  featureText: {
    fontSize: 15,
    color: '#555',
    flex: 1,
    lineHeight: 20,
  },
  progressSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    width: '25%',
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
});