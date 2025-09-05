// App.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { testSupabaseConnection, testEnvironmentVariables } from '@/utils/testSupabase';
import { testOpenAIConnection } from '@/utils/testAI';
import { testSpoonacularConnection, testUSDAConnection, testApiEnvironmentVariables } from '@/utils/testAPIs';

export default function App() {
  const runTests = async () => {
    console.log('🚀 Running all connection tests...');
    
    // Test environment variables first
    console.log('🔍 Testing core environment variables...');
    const envOk = testEnvironmentVariables();
    
    console.log('🔍 Testing API environment variables...');
    const apiEnvOk = testApiEnvironmentVariables();
    
    if (!envOk || !apiEnvOk) {
      console.error('❌ Environment variables not loaded properly');
      return;
    }
    
    // Test all connections
    console.log('🔍 Testing Supabase connection...');
    const dbOk = await testSupabaseConnection();
    
    console.log('🔍 Testing OpenAI connection...');
    const aiOk = await testOpenAIConnection();
    
    console.log('🔍 Testing Spoonacular API...');
    const spoonacularOk = await testSpoonacularConnection();
    
    console.log('🔍 Testing USDA API...');
    const usdaOk = await testUSDAConnection();
    
    // Report results
    const allPassed = dbOk && aiOk && spoonacularOk && usdaOk;
    
    if (allPassed) {
      console.log('🎉 All tests passed! Ready for development.');
    } else {
      console.error('❌ Some connections failed:');
      console.error(`- Database: ${dbOk ? '✅' : '❌'}`);
      console.error(`- AI (OpenAI): ${aiOk ? '✅' : '❌'}`);
      console.error(`- Spoonacular API: ${spoonacularOk ? '✅' : '❌'}`);
      console.error(`- USDA API: ${usdaOk ? '✅' : '❌'}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meal Master AI</Text>
      <Text style={styles.subtitle}>Complete Integration Test</Text>
      
      <TouchableOpacity style={styles.button} onPress={runTests}>
        <Text style={styles.buttonText}>Test All APIs & Services</Text>
      </TouchableOpacity>
      
      <Text style={styles.instructions}>
        Check the console/logs for test results
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#4F46E5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});