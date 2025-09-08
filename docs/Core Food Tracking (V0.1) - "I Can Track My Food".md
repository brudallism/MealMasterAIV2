# Core Food Tracking (V0.1) - "I Can Track My Food"
*Barebones MVP Document - Version 1.0*

## 📋 Dependencies & References
**Required from other documents:**
- 📎 **Reference**: Data Architecture > V0.1 Data Needs > Core schemas
- 📎 **Reference**: System Glossary > Individual AI System Implementation Guides

**Referenced by other documents:**
- Document 3 (Intelligent Adaptation) builds upon these foundational systems
- Document 4 (Personal Nutrition Coach) requires these core systems as prerequisites
- Individual System Implementation Guides provide detailed technical specifications

---

## 🔍 Quick Find Index
**AI Systems**: User Facing AI, Food Recognition AI, Macro Calculator AI, Data Validation Gateway, Error Handler System
**Database Schemas**: users, daily_meals, foods_master, user_preferences, basic coordination tables  
**UI Components**: Simple dashboard, chat interface, placeholder Plans page
**Data Flow Patterns**: Basic food logging → macro calculation → dashboard display

---

## 🎯 V0.1 Core Philosophy
**"The minimum viable AI nutrition coach that delivers real value"**

### **Success Criteria**
- User can log meals through conversation: "I ate chicken and rice"
- System provides accurate macro feedback: "That's 45g protein, 60g carbs, 5g fat"
- Simple dashboard shows daily progress toward goals
- Conversational personality that users want to interact with
- System works reliably without crashes or data loss

### **What We're NOT Building (Yet)**
- Complex meal planning or recipe suggestions
- Behavioral analysis or habit tracking
- Health ecosystem integrations
- Advanced UI animations or polish
- Social features or sharing capabilities

---

## 🤖 AI Systems Architecture

### **User Facing AI** *(Core System)*
**Purpose**: Primary conversational interface with personality and intent routing

**Core Responsibilities**:
- Handle all user conversations with consistent, helpful personality
- Parse user intent: food logging, macro questions, goal discussions
- Route complex requests to specialized AI systems
- Compile responses from multiple systems into coherent user communication
- Manage conversation context and user relationship building

**Technical Specifications**:
- **Model**: GPT-4o-mini (optimized for conversation and cost efficiency)
- **Database Access**: Read/Write to user_conversations, basic meal logging
- **Context Window**: Maintain last 10 conversation turns for continuity
- **Personality Prompt**: Supportive nutrition coach, encouraging but not pushy

**Key Interactions**:
- Receives all user input directly
- Sends food descriptions to Food Recognition AI
- Sends nutrition questions to Macro Calculator AI
- Writes validated data through Data Validation Gateway
- Handles all responses back to user

**Success Metrics**:
- <3 conversational turns to complete food logging
- >90% user intent recognition accuracy
- Consistent personality across all interactions

📎 **System Guide**: User Facing AI Implementation Guide *(to be created - Priority 1)*

### **Food Recognition AI** *(Core System)*
**Purpose**: Convert user food descriptions into structured nutrition data

**Core Responsibilities**:
- Parse natural language food descriptions ("chicken breast with rice")
- Identify foods, portions, and preparation methods
- Look up nutrition data from USDA database
- Handle common food variations and synonyms
- Provide confidence scores for food identification

**Technical Specifications**:
- **Model**: GPT-4o (better reasoning for complex food descriptions)
- **Database Access**: Read-only to foods_master, USDA cache tables
- **External APIs**: Direct USDA FoodData Central integration
- **Fallback Strategy**: Generic estimates when exact matches unavailable

**Input Format**:
```json
{
  "food_description": "grilled chicken breast with steamed broccoli",
  "context": "dinner",
  "user_id": "uuid"
}
```

**Output Format**:
```json
{
  "recognized_foods": [
    {
      "food_name": "chicken breast, grilled",
      "quantity": "6 oz",
      "usda_id": "171077",
      "confidence": 0.95
    }
  ],
  "total_nutrition": {
    "calories": 350,
    "protein": 54,
    "carbs": 8,
    "fat": 12
  }
}
```

**Key Interactions**:
- Receives food descriptions from User Facing AI
- Returns structured nutrition data to Macro Calculator AI
- Logs recognition accuracy for system improvement

📎 **System Guide**: Food Recognition AI Implementation Guide *(to be created - Priority 2)*

### **Macro Calculator AI** *(Core System)*
**Purpose**: Calculate nutrition data and provide goal-oriented health insights

**Core Responsibilities**:
- Calculate daily macro totals from individual meals
- Compare current intake to user's macro goals
- Provide basic nutrition insights and recommendations
- Track daily progress toward calorie and macro targets
- Generate simple suggestions for macro balance

**Technical Specifications**:
- **Model**: GPT-4o (complex nutrition reasoning and health insights)
- **Database Access**: Read user_preferences, user_metrics, daily_meals
- **Calculation Logic**: Precise macro mathematics with rounding consistency
- **Health Awareness**: Basic understanding of common dietary goals (weight loss, muscle gain)

**Core Calculations**:
- Daily macro totals (protein, carbs, fat, calories)
- Percentage toward daily goals
- Macro balance recommendations
- Simple caloric deficit/surplus calculations

**Key Interactions**:
- Receives nutrition data from Food Recognition AI
- Accesses user goals and preferences from database
- Returns insights and recommendations to User Facing AI
- Writes calculated data through Data Validation Gateway

**Success Metrics**:
- >95% accuracy in macro calculations
- Recommendations align with established nutrition principles
- Goal progress tracking matches user expectations

📎 **System Guide**: Macro Calculator AI Implementation Guide *(to be created - Priority 3)*

### **Data Validation Gateway** *(Core System)*
**Purpose**: Ensure data integrity and manage all database write operations

**Core Responsibilities**:
- Validate all data before database writes
- Ensure data format consistency across systems
- Prevent duplicate entries and resolve conflicts
- Maintain audit trail of all data changes
- Handle database connection errors gracefully

**Technical Specifications**:
- **Model**: GPT-3.5-turbo (structured data processing)
- **Database Access**: Write permissions to all tables
- **Validation Rules**: Schema enforcement, data type checking, range validation
- **Conflict Resolution**: FIFO for timing conflicts, user preference priority

**Validation Process**:
1. Receive write request from any AI system
2. Validate data format and completeness
3. Check for conflicts with existing data
4. Apply business rules and constraints
5. Execute database write or return error
6. Log transaction for audit trail

**Key Interactions**:
- All AI systems route database writes through this gateway
- Returns success/failure status to requesting system
- Maintains data consistency across entire application

📎 **System Guide**: Data Validation Gateway Implementation Guide *(to be created - Priority 6)*

### **Error Handler System** *(Core System)*
**Purpose**: Manage system failures gracefully and maintain user experience

**Core Responsibilities**:
- Monitor all AI system health and availability
- Provide fallback responses when systems fail
- Log errors for debugging and system improvement
- Communicate system status to users transparently
- Trigger simplified workflows during outages

**Technical Specifications**:
- **Model**: GPT-3.5-turbo (simple, reliable responses)
- **Database Access**: Write to system_health_monitor, ai_requests_log
- **Monitoring**: Real-time system health checks
- **Fallback Logic**: Simplified responses that maintain user engagement

**Fallback Strategies**:
- Food Recognition failure → Manual macro entry prompt
- Macro Calculator failure → Basic calorie acknowledgment
- Database failure → Offline mode with sync later
- Complete system failure → Apologetic but helpful response

**Key Interactions**:
- Monitors all AI systems continuously
- Communicates with User Facing AI during system failures
- Provides system status updates to UI components

📎 **System Guide**: Error Handler System Implementation Guide *(to be created - Priority 7)*

---

## 🗄️ Database Schema (V0.1 Core)

### **User Management Tables**

**users**
```sql
users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  subscription_status VARCHAR(50) DEFAULT 'free',
  onboarding_completed BOOLEAN DEFAULT false
)
```

**user_preferences**
```sql
user_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  daily_calorie_goal INTEGER DEFAULT 2000,
  protein_goal INTEGER DEFAULT 150,
  carb_goal INTEGER DEFAULT 200,
  fat_goal INTEGER DEFAULT 65,
  dietary_restrictions TEXT[], -- ['gluten_free', 'dairy_free']
  activity_level VARCHAR(20) DEFAULT 'moderate', -- sedentary, light, moderate, active, very_active
  primary_goal VARCHAR(30) DEFAULT 'maintain', -- lose_weight, gain_weight, maintain, build_muscle
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### **Food & Nutrition Tables**

**foods_master**
```sql
foods_master (
  id UUID PRIMARY KEY,
  usda_id VARCHAR(50) UNIQUE, -- USDA FoodData Central ID
  food_name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255),
  calories_per_100g DECIMAL(8,2),
  protein_per_100g DECIMAL(8,2),
  carbs_per_100g DECIMAL(8,2),
  fat_per_100g DECIMAL(8,2),
  fiber_per_100g DECIMAL(8,2),
  sugar_per_100g DECIMAL(8,2),
  sodium_per_100g DECIMAL(8,2), -- mg
  common_portion_name VARCHAR(100), -- "1 cup", "1 medium", "3 oz"
  common_portion_grams DECIMAL(8,2),
  allergens TEXT[], -- ['dairy', 'gluten', 'nuts']
  food_category VARCHAR(100), -- 'protein', 'vegetable', 'grain', 'fruit', 'dairy', 'fat'
  created_at TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW()
)
```

**daily_meals**
```sql
daily_meals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  food_id UUID REFERENCES foods_master(id),
  meal_type VARCHAR(20), -- breakfast, lunch, dinner, snack
  quantity_grams DECIMAL(8,2),
  logged_at TIMESTAMP DEFAULT NOW(),
  meal_date DATE DEFAULT CURRENT_DATE,
  calories DECIMAL(8,2),
  protein DECIMAL(8,2),
  carbs DECIMAL(8,2),
  fat DECIMAL(8,2),
  ai_confidence DECIMAL(3,2), -- 0.00 to 1.00 confidence in food recognition
  user_confirmed BOOLEAN DEFAULT false,
  notes TEXT, -- User notes about the meal
  created_at TIMESTAMP DEFAULT NOW()
)
```

### **System Coordination Tables**

**user_conversations**
```sql
user_conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  message_text TEXT NOT NULL,
  is_user_message BOOLEAN NOT NULL, -- true for user, false for AI
  ai_system_source VARCHAR(50), -- 'user_facing', 'food_recognition', etc.
  conversation_context JSONB, -- Store conversation context data
  created_at TIMESTAMP DEFAULT NOW()
)
```

**ai_requests_log**
```sql
ai_requests_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  ai_system VARCHAR(50) NOT NULL,
  request_type VARCHAR(50), -- 'food_recognition', 'macro_calculation', etc.
  input_data JSONB,
  output_data JSONB,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)
```

📎 **Reference**: Data Architecture > V0.1 Data Needs > Complete schema specifications

---

## 📱 UI Components (V0.1 Simple)

### **Simple Dashboard Screen**
**Purpose**: Show daily macro progress and recent meals

**Core Elements**:
- **Macro Progress Rings**: Simple circular progress indicators
  - Calories: Current/goal with percentage
  - Protein: Grams consumed/goal  
  - Carbs: Grams consumed/goal
  - Fat: Grams consumed/goal
- **Today's Meals**: Simple list of logged meals
  - Meal name with time
  - Basic macro info (calories, protein)
  - No complex formatting or animations
- **Quick Stats**: 
  - "Meals logged today: 3"
  - "Goal progress: 75%"

**Data Sources**: 
- Direct database queries for current day's meals
- Simple calculations for goal progress percentages
- No AI processing required for basic display

**Offline Capability**: ✅ Full functionality with locally cached data

### **Chat Interface**
**Purpose**: Primary interaction method for food logging and questions

**Core Elements**:
- **Message History**: Last 20 conversation turns
- **Input Field**: Text input with send button
- **Typing Indicators**: Show when AI is processing
- **Quick Actions**: Common phrases like "I ate..." or "How am I doing?"
- **Error States**: Clear messages when AI systems are unavailable

**Technical Implementation**:
- Standard chat UI components (react-native-gifted-chat or similar)
- WebSocket connection for real-time responses
- Optimistic message rendering (show user message immediately)
- Graceful handling of slow AI responses

**Key Interactions**:
- All input goes to User Facing AI
- Displays compiled responses from multiple AI systems
- Shows loading states during food recognition processing

### **Conversational Goal Setting Interface**
**Purpose**: Chat-first approach to setting and modifying macro goals

**V0.1 Implementation**:
- **Onboarding Flow**: "Let's set up your nutrition goals! What's your main objective?"
- **Guided Collection**: AI conversationally gathers weight, activity level, and goal type
- **Safety Validation**: Crisis detection for dangerous calorie goals with professional resource routing
- **Natural Explanations**: AI explains why certain macros are recommended
- **Easy Adjustments**: Users can modify goals anytime through conversation

**Integration Points**:
- **User Facing AI**: Enhanced with goal-setting conversation flows and intent detection
- **Macro Calculator AI**: Goal validation, BMR/TDEE calculations, and safety checks
- **Error Handler System**: Crisis intervention for eating disorder indicators
- **User Store**: Updates macro goals and preferences seamlessly

### **Bottom Navigation**
**Simple Implementation**:
- Two functional tabs: Home (Dashboard) | Chat
- One placeholder tab: Plans (disabled/coming soon)
- Standard React Navigation bottom tabs
- Icons and labels clearly indicate function

---

## 🔄 Data Flow Patterns (V0.1 Core)

### **Primary Food Logging Flow**
```
1. User types: "I had a grilled chicken salad for lunch"
   ↓
2. User Facing AI receives message and identifies food logging intent
   ↓
3. User Facing AI sends food description to Food Recognition AI
   ↓
4. Food Recognition AI queries Spoonacular API → USDA fallback if needed
   ↓
5. Food Recognition AI uses reasonable defaults for missing details (standard portions, common preparations)
   ↓
6. Food Recognition AI returns structured nutrition data with confidence scores and estimated detail flags
   ↓
7. Macro Calculator AI calculates impact on daily goals
   ↓
8. Macro Calculator AI sends meal data to Data Validation Gateway
   ↓
9. Data Validation Gateway writes to daily_meals table
   ↓
10. User Facing AI compiles response: "Logged! That's approximately 350 calories, 45g protein. You're 73% to your protein goal today."
   ↓
11. Dashboard updates in real-time with new meal and macro progress
```

### **Simple Dashboard Loading Flow**
```
1. User opens app/navigates to Dashboard
   ↓
2. UI queries daily_meals table for today's entries
   ↓
3. UI calculates current macro totals (simple addition)
   ↓
4. UI fetches user goals from user_preferences
   ↓
5. UI displays progress rings and meal list
   ↓
6. Real-time subscription listens for new meal entries
```

### **Error Handling Flow**
```
1. Any AI system fails or times out
   ↓
2. Error Handler System detects failure
   ↓
3. Error Handler provides fallback response to User Facing AI
   ↓
4. User Facing AI delivers graceful error message:
   "I'm having trouble with food recognition right now. Can you tell me the calories and macros manually?"
   ↓
5. System continues functioning with degraded capabilities
```

---

## 🎯 Success Metrics & Validation

### **Technical Success Criteria**
- **Response Time**: <3 seconds for food logging
- **Accuracy**: >90% food recognition accuracy on common foods
- **Reliability**: <1% system failure rate during normal usage
- **Data Integrity**: Zero data loss, all meals properly saved

### **User Experience Success Criteria**
- **Ease of Use**: New users can log first meal within 2 minutes
- **Conversation Flow**: <3 exchanges needed to log complex meals
- **Goal Clarity**: Users understand their macro progress immediately
- **Satisfaction**: Users want to continue using the system

### **V0.1 Completion Checklist**
- [ ] User can set macro goals through conversational AI onboarding
- [ ] User can log meals through conversation successfully
- [ ] Dashboard shows accurate macro progress with real-time updates
- [ ] System handles common food recognition requests
- [ ] Crisis detection and safety validation for dangerous goals
- [ ] Error states are handled gracefully
- [ ] Data persists correctly between app sessions
- [ ] Basic security and data protection implemented

---

## 🚀 Development Priorities

### **Week 1-2: Foundation**
- Set up Supabase database with core schemas
- Implement User Facing AI with basic conversation
- Create simple dashboard UI with hardcoded data

### **Week 3-4: Food Recognition**
- Build Food Recognition AI with USDA API integration
- Connect to Macro Calculator AI for nutrition analysis
- Implement Data Validation Gateway for data integrity

### **Week 5-6: Integration & Polish**
- Connect all systems with proper error handling
- Implement real-time dashboard updates
- Add basic user authentication and goal setting

### **Ready for V0.2 When**:
- All core food logging flows work reliably
- Users can set goals and track daily progress
- System handles 90%+ of common food recognition requests
- Basic UI provides clear value to users
- Foundation is stable for adding intelligence systems

---

*This document defines the minimal viable AI nutrition coach that delivers real user value while establishing the foundation for advanced features in V0.2 and beyond.*