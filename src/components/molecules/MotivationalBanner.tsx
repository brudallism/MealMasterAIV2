// src/components/molecules/MotivationalBanner.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MotivationalBannerProps {
  userName?: string;
  currentStreak?: number;
  caloriesProgress?: number;
  onRefresh?: () => void;
}

const motivationalQuotes = [
  {
    text: "Every healthy choice is an investment in your future self! 💪",
    category: "motivation"
  },
  {
    text: "Progress, not perfection. You're doing amazing! ✨",
    category: "encouragement"
  },
  {
    text: "Small consistent actions lead to big results! 🎯",
    category: "consistency"
  },
  {
    text: "Your body is your temple. Fuel it with love and nutrition! 🏛️",
    category: "wellness"
  },
  {
    text: "Champions aren't made overnight. Keep going! 🏆",
    category: "perseverance"
  },
  {
    text: "Today's choices shape tomorrow's results! 🌟",
    category: "mindset"
  },
  {
    text: "You're not just tracking food, you're building habits! 🔥",
    category: "habits"
  },
  {
    text: "Consistency beats perfection every single time! ⚡",
    category: "consistency"
  },
  {
    text: "Your health journey is unique and valuable! 🌱",
    category: "personal"
  },
  {
    text: "Celebrate every win, no matter how small! 🎉",
    category: "celebration"
  }
];

const timeBasedGreetings = [
  { time: "morning", greeting: "Good morning", emoji: "☀️" },
  { time: "afternoon", greeting: "Good afternoon", emoji: "🌤️" },
  { time: "evening", greeting: "Good evening", emoji: "🌙" }
];

const MotivationalBanner: React.FC<MotivationalBannerProps> = ({
  userName = "Champion",
  currentStreak = 0,
  caloriesProgress = 0,
  onRefresh
}) => {
  const [currentQuote, setCurrentQuote] = useState(motivationalQuotes[0]);
  const [greeting, setGreeting] = useState(timeBasedGreetings[0]);
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Set time-based greeting
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting(timeBasedGreetings[0]); // morning
    } else if (hour < 17) {
      setGreeting(timeBasedGreetings[1]); // afternoon
    } else {
      setGreeting(timeBasedGreetings[2]); // evening
    }

    // Set daily quote based on date
    const today = new Date().getDate();
    const quoteIndex = today % motivationalQuotes.length;
    setCurrentQuote(motivationalQuotes[quoteIndex]);
  }, []);

  const refreshQuote = () => {
    if (onRefresh) onRefresh();

    // Fade out animation
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Get random quote
      const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
      setCurrentQuote(motivationalQuotes[randomIndex]);

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const getProgressMessage = () => {
    if (caloriesProgress >= 100) {
      return "🎯 Goal achieved!";
    } else if (caloriesProgress >= 80) {
      return "🔥 Almost there!";
    } else if (caloriesProgress >= 50) {
      return "💪 Halfway there!";
    } else if (caloriesProgress > 0) {
      return "🌟 Great start!";
    } else {
      return "☀️ Let's begin!";
    }
  };

  const getStreakMessage = () => {
    if (currentStreak >= 30) {
      return `🏆 ${currentStreak} days strong!`;
    } else if (currentStreak >= 7) {
      return `🔥 ${currentStreak} day streak!`;
    } else if (currentStreak >= 3) {
      return `⭐ ${currentStreak} days in a row!`;
    } else if (currentStreak > 0) {
      return `🌱 Day ${currentStreak}!`;
    } else {
      return "🚀 Start your journey!";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>
          {greeting.emoji} {greeting.greeting}, {userName}!
        </Text>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>{getProgressMessage()}</Text>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.stat}>{getStreakMessage()}</Text>
        </View>
      </View>

      <Animated.View style={[styles.quoteSection, { opacity: fadeAnim }]}>
        <View style={styles.quoteContent}>
          <Text style={styles.quoteText}>{currentQuote.text}</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={refreshQuote}>
            <Ionicons name="refresh" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  greetingSection: {
    marginBottom: 12,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  statDivider: {
    fontSize: 14,
    color: '#D1D5DB',
    marginHorizontal: 8,
  },
  quoteSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  quoteContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  quoteText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    fontStyle: 'italic',
    marginRight: 12,
  },
  refreshButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
});

export default MotivationalBanner;