# Step 2 Agent - Enhanced Lesson Planning with Serper API & Langchain

## Overview
The Step 2 Agent is an enhanced version of the lesson planning pipeline that incorporates **real-time Serper API search capabilities** via Langchain and advanced AI reasoning to create more comprehensive and effective lesson plans. It gathers real-world examples and current best practices from the internet to inform the lesson design process.

## Key Features

### 🔍 **Real Serper API Search Integration**
- **Langchain Integration**: Uses Langchain's Serper tool for reliable web search
- **High-Quality Results**: Serper provides cleaner, more relevant search results than other APIs
- **Teaching Process Examples**: Searches for real examples of teaching methodologies
- **Lesson Details**: Gathers in-depth information about specific lesson topics
- **UDL Strategies**: Finds current best practices for Universal Design for Learning
- **Inclusive Classroom Strategies**: Discovers effective approaches for diverse learners
- **Multi-query Search**: Uses multiple search terms for comprehensive coverage
- **Thai + English Results**: Searches in both languages for maximum coverage

### 🤖 **Intelligent AI Processing**
- **Smart Fallback System**: Uses AI reasoning when search results are limited
- **Content Analysis**: GPT-4 processes and synthesizes search results for relevance
- **Context-Aware**: Tailors search queries based on subject, topic, and student characteristics
- **Quality Enhancement**: Evaluates and enhances search results with educational expertise

### 📊 **Enhanced Output**
- **Research-Backed Plans**: Incorporates real-world teaching examples and strategies
- **Metadata Tracking**: Records what search data was used and how
- **Source Integration**: Shows which external knowledge influenced the design
- **Same JSON Format**: Maintains your original instruction format

## API Usage

### Endpoint
```
POST /api/chat/step/2-agent
```

### Request Body
```json
{
  "sessionId": "your-session-id",
  "numStudents": 30,
  "studyPeriod": 9,
  "studentType": [
    {
      "type": "นักเรียนที่มีความสามารถปานกลาง",
      "percentage": "60"
    },
    {
      "type": "นักเรียนที่มีความต้องการพิเศษ",
      "percentage": "20"
    },
    {
      "type": "นักเรียนที่มีความสามารถสูง",
      "percentage": "20"
    }
  ]
}
```

### Response Structure
```json
{
  "response": {
    "8.1 ขั้นตอนการเรียนรู้ที่ 1 (X นาที)": {
      "1 กิจกรรมย่อยที่ 1": {
        "รายละเอียดการดำเนินการ": "...",
        "สื่อ/อุปกรณ์การสอน": "...",
        "บทบาทผู้เรียน": "...",
        "บทบาทครู": "...",
        "แนวทางการปรับกิจกรรมสำหรับผู้เรียนที่หลากหลาย": {
          "นักเรียนที่มีความต้องการพิเศษ": "วิธีการปรับกิจกรรม",
          "นักเรียนที่มีความสามารถสูง": "วิธีการขยายความท้าทาย"
        }
      }
    }
  },
  "teachingMaterials": {
    "1": "รายการสื่อและอุปกรณ์",
    "2": "เทคโนโลยีที่ใช้",
    "3": "วัสดุการทดลอง"
  },
  "enhancedData": {
    "ตัวอย่างกระบวนการที่นำมาใช้": "5E Model และ Active Learning",
    "กลยุทธ์ UDL ที่ใช้": "Multiple means of representation และ engagement",
    "กลยุทธ์ Inclusive ที่ใช้": "Differentiated instruction และ collaborative learning"
  },
  "searchMetadata": {
    "searchPerformed": true,
    "enhancedProcesses": ["5E Model", "Problem-Based Learning", "Active Learning"],
    "udlStrategies": ["Multiple Means of Representation", "..."],
    "inclusiveStrategies": ["Differentiated Instruction", "..."]
  }
}
```

## Search Components

### 1. **Teaching Process Examples (Multi-Query Search)**
Searches with queries like:
- `กระบวนการการจัดกิจกรรมการสอน [subject] [topic] ระดับ[level]`
- `teaching methodology [subject] [topic] grade [level]`
- `5E model lesson plan [subject]`
- `problem based learning [subject] Thailand`
- `active learning strategies [subject]`

Finds methodologies like:
- **5E Model**: Engage → Explore → Explain → Elaborate → Evaluate
- **Problem-Based Learning**: Real-world problem solving approaches
- **Active Learning**: Student-centered engagement strategies
- **Inquiry-Based Learning**: Question-driven exploration methods
- **Project-Based Learning**: Extended investigation projects

### 2. **UDL Strategies (Comprehensive Search)**
Searches with queries like:
- `UDL Universal Design Learning [subject] strategies`
- `inclusive classroom strategies [subject] Thailand`
- `differentiated instruction [subject] special needs`
- `ห้องเรียนแบบรวม [subject] [topic]`
- `การออกแบบการเรียนรู้ที่เปิดกว้าง [subject]`

Finds approaches for:
- **Multiple Means of Representation**: Visual, auditory, tactile content delivery
- **Multiple Means of Engagement**: Motivation and interest strategies  
- **Multiple Means of Action/Expression**: Diverse ways for students to demonstrate learning
- **Flexible Learning Environments**: Adaptable physical and digital spaces

### 3. **Inclusive Classroom Strategies (Multi-Language Search)**
Searches with queries like:
- `inclusive classroom strategies [subject] Thailand`
- `differentiated instruction [subject] special needs`
- `multiple intelligence teaching [subject]`
- `accessible education [subject] diverse learners`

Discovers techniques for:
- **Differentiated Instruction**: Adapting to diverse learning needs
- **Collaborative Learning**: Effective group work structures
- **Peer Support Systems**: Student-to-student assistance
- **Multi-modal Assessment**: Flexible evaluation methods

### 4. **Lesson Details (Enhanced Coverage)**
Searches with queries like:
- `[subject] [topic] ระดับ[level] รายละเอียดบทเรียน`
- `[subject] [topic] เนื้อหาสำคัญ มัธยมศึกษา`
- `[topic] concepts [subject] grade [level]`
- `หลักสูตร [subject] [topic] สาระสำคัญ`

## Serper API Implementation

### **Setup Requirements**
```bash
# Install required packages
npm install @langchain/community --legacy-peer-deps

# Get your free Serper API key
# 1. Visit https://serper.dev/
# 2. Sign up for free account (100 free searches/month)
# 3. Get your API key from dashboard
# 4. Add to .env.local file:
SERPER_API_KEY=your_serper_api_key_here
```

### **Langchain Serper Integration**
```typescript
import { Serper } from "@langchain/community/tools/serper";

// Initialize Serper search tool
const serperTool = new Serper(SERPER_API_KEY);

// Perform search
const searchResponse = await serperTool.call(query);
```

### **Advanced Features**
- **High-Quality Results**: Serper provides cleaner, more educational-focused results
- **JSON Response**: Structured data that's easy to process
- **Rate Limiting**: Built-in respect for API limits
- **Error Handling**: Graceful fallback to AI reasoning when search fails
- **Multi-Query Strategy**: Multiple searches for comprehensive coverage

### **Smart Fallback System**
When Serper API is not available or returns limited results:
1. **Enhanced AI Reasoning**: Uses GPT-4 to generate comprehensive alternatives
2. **Context-Aware Fallbacks**: Tailored to specific subject and topic  
3. **Rich Default Content**: Detailed strategies based on educational best practices

```typescript
// Example fallback data structure
{
  teachingProcessExamples: [
    "5E Model: Engage → Explore → Explain → Elaborate → Evaluate",
    "Problem-Based Learning: การเรียนรู้ผ่านการแก้ปัญหาจริง",
    "Active Learning: การเรียนรู้เชิงรุกผ่านกิจกรรมหลากหลาย"
  ],
  udlStrategies: [
    "Multiple Means of Representation: ใช้สื่อที่หลากหลาย",
    "Multiple Means of Engagement: สร้างแรงจูงใจหลายรูปแบบ",
    "Multiple Means of Action/Expression: เปิดทางเลือกการแสดงออก"
  ],
  inclusiveStrategies: [
    "Differentiated Instruction: ปรับการสอนตามความแตกต่าง",
    "Collaborative Learning: การเรียนรู้แบบร่วมมือ",
    "Flexible Assessment: การประเมินผลแบบยืดหยุ่น"
  ]
}
```

## Implementation Details

### Search Agent Architecture
```typescript
class SearchAgent {
  // Search for teaching methodologies
  async searchTeachingProcessExamples(subject, lessonTopic, level)
  
  // Search for UDL and inclusive strategies  
  async searchUDLStrategies(subject, lessonTopic, studentTypes)
  
  // Get detailed lesson information
  async getLessonDetails(subject, lessonTopic, level)
  
  // Main orchestration method
  async performEnhancedSearch(subject, lessonTopic, level, studentTypes)
}
```

### Enhanced Pipeline Integration
```typescript
class OptimizedLessonPipeline {
  // New enhanced method with search
  async step2Agent(sessionData, numStudents, studentType, studyPeriod) {
    // 1. Perform enhanced search
    const enhancedData = await searchAgent.performEnhancedSearch(...)
    
    // 2. Create enhanced prompt with search data
    const enhancedPrompt = ChatPromptTemplate.fromMessages([...])
    
    // 3. Generate lesson plan with enriched context
    const result = await enhancedChain.invoke({...})
    
    return {
      response: result["กิจกรรมการเรียนรู้"],
      teachingMaterials: result["สื่อและอุปกรณ์"],
      enhancedData: result["การใช้ข้อมูลจากการค้นคว้า"],
      searchMetadata: {...}
    }
  }
  
  // Original method (unchanged for backward compatibility)
  async step2(sessionData, numStudents, studentType, studyPeriod) {...}
}
```

## Benefits

### 🎯 **Superior Search Quality**
- **Serper API Advantages**: More reliable and accurate than free search APIs
- **Educational Focus**: Better results for academic and educational content
- **Structured Data**: Clean JSON responses that are easy to process
- **Global Coverage**: Access to worldwide educational resources

### 🔄 **Reliability**
- **99.9% Uptime**: Serper API is more stable than free alternatives
- **Rate Limits**: Generous free tier (100 searches/month) with paid options
- **Error Recovery**: Graceful fallback when search services are unavailable
- **Maintains Functionality**: Original lesson planning always works as backup

### 📈 **Enhanced Performance**  
- **Faster Response**: Serper API is optimized for speed
- **Better Relevance**: Higher quality search results for educational content
- **Rich Snippets**: Detailed content excerpts for better AI processing
- **Multi-language Support**: Excellent Thai and English search capabilities

## Usage Examples

### Basic Usage
```javascript
// Use enhanced agent with search
const response = await fetch('/api/chat/step/2-agent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    sessionId: 'session123',
    numStudents: 25,
    studyPeriod: 8,
    studentType: [
      { type: 'นักเรียนปกติ', percentage: '70' },
      { type: 'นักเรียนที่มีความต้องการพิเศษ', percentage: '30' }
    ]
  })
});
```

### Fallback to Original
```javascript
// Use original method if enhanced is not needed
const response = await fetch('/api/chat/step/2', {
  // Same request structure
});
```

## Future Enhancements

### 🔍 **Advanced Search**
- Integration with Google Scholar for academic sources
- Real-time curriculum updates and standards
- Multi-language search capabilities

### 🧠 **AI Improvements**
- Better reasoning models for fallback scenarios
- Context-aware search query optimization
- Learning from successful lesson implementations

### 📊 **Analytics**
- Track which search insights lead to better outcomes
- A/B testing between enhanced and original methods
- Teacher feedback integration for continuous improvement

## Monitoring and Debugging

### Health Check
```
GET /api/chat/step/health
```

Returns:
```json
{
  "status": "healthy",
  "features": {
    "enhancedStep2Agent": true,
    "internetSearch": true,
    "udlIntegration": true,
    "inclusiveClassroomSupport": true
  }
}
```

### Logging
The system provides detailed logging for:
- Search query execution
- API response times
- Fallback activation
- Error conditions

### Performance Metrics
- Search response times
- Cache hit rates (when implemented)
- Success/failure ratios
- User satisfaction scores

This enhanced Step 2 Agent represents a significant advancement in AI-powered lesson planning, combining the best of internet search capabilities with intelligent reasoning to create more effective and inclusive educational experiences.
