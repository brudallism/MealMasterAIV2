// src/screens/ChatScreen.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAIStore } from '@/stores/ai-store';
import { userFacingAI } from '@/services/ai/user-facing-ai';

interface Message {
  id: string;
  text: string;
  createdAt: Date;
  isUser: boolean;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const { isProcessing, error, clearError, currentSystem } = useAIStore();

  useEffect(() => {
    const initialMessage: Message = {
      id: '1',
      text: "Hello! I'm your Meal Master AI. Describe what you ate and I'll help track your nutrition! 🍽️",
      createdAt: new Date(),
      isUser: false,
    };
    setMessages([initialMessage]);
  }, []);


  const processUserMessage = useCallback(async (text: string) => {
    console.log('Processing user message with User Facing AI:', text);
    
    try {
      // Use a consistent user ID for the chat session
      const userId = 'chat-screen-user';
      
      // Call User Facing AI service
      const response = await userFacingAI.processMessage(text, userId);
      
      if (response.success && response.response) {
        const aiResponse: Message = {
          id: Date.now().toString(),
          text: response.response,
          createdAt: new Date(),
          isUser: false,
        };
        
        setMessages(prev => [aiResponse, ...prev]);
        
        // Log metadata for debugging
        console.log('User Facing AI Response Metadata:', {
          processingTime: response.metadata?.processingTime,
          model: response.metadata?.model,
          intent: response.metadata?.intent?.intent,
          templateUsed: response.metadata?.templateUsed,
          fallbackUsed: response.fallbackUsed,
          contextMessages: response.metadata?.contextMessages
        });
        
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100);
        
      } else {
        console.error('User Facing AI error:', response.error);
        
        const errorResponse: Message = {
          id: Date.now().toString(),
          text: response.response || "Sorry, I encountered an issue. Please try again!",
          createdAt: new Date(),
          isUser: false,
        };
        
        setMessages(prev => [errorResponse, ...prev]);
      }
      
    } catch (error) {
      console.error('Error calling User Facing AI:', error);
      
      const errorResponse: Message = {
        id: Date.now().toString(),
        text: "Sorry, I encountered an error processing your message. Please try again!",
        createdAt: new Date(),
        isUser: false,
      };
      
      setMessages(prev => [errorResponse, ...prev]);
    }
  }, []);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      createdAt: new Date(),
      isUser: true,
    };

    setMessages(prev => [userMessage, ...prev]);
    setInputText('');
    
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);
    
    processUserMessage(userMessage.text);
  }, [inputText, processUserMessage]);



  const renderMessage = useCallback(({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessageContainer : styles.aiMessageContainer
    ]}>
      <View style={[
        styles.messageBubble,
        item.isUser ? styles.userBubble : styles.aiBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.isUser ? styles.userText : styles.aiText
        ]}>
          {item.text}
        </Text>
      </View>
    </View>
  ), []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Meal Master AI</Text>
          <Text style={styles.subtitle}>Your nutrition tracking assistant</Text>
          {isProcessing && (
            <Text style={styles.processingText}>
              Analyzing your meal... ({currentSystem || 'processing'})
            </Text>
          )}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.clearErrorButton}
                onPress={clearError}
              >
                <Text style={styles.clearErrorText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          inverted
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Describe your meal..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isProcessing}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() ? '#4F46E5' : '#9CA3AF'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  processingText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    flex: 1,
  },
  clearErrorButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  clearErrorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messagesContainer: {
    paddingVertical: 16,
  },
  messageContainer: {
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#111827',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});