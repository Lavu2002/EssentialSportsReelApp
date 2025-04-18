# Sports Celebrity Reels Generator 🏆

*An AI-powered system for generating short historical reels of sports celebrities*


## 📌 Project Status
🚧 **Work in Progress** - Core functionality implemented but not yet production-ready  
✅ Currently working: AI script generation, and Audito Generation  
🔧 In development: Video composition,Improved UI, deployment pipeline  

## ✨ Features
- **AI-Generated Scripts**  
  - Career highlights and achievements  
  - Engaging storytelling format
- **Dynamic Video Creation**  
  - Image + audio composition  
  - TikTok-style vertical format
- **AWS Integration**  
  - S3 for media storage  
  - DynamoDB for metadata

## 🛠️ Tech Stack
| Component          | Technology               |
|--------------------|--------------------------|
| Frontend           | Next.js 14, Tailwind CSS |
| Backend            | Next.js API Routes       |
| AI Services        | Groq, AWS Polly          |
| Storage            | AWS S3, DynamoDB         |
| Video Processing   | FFmpeg                   |

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- FFmpeg installed (`brew install ffmpeg` on macOS)
- AWS credentials with S3/DynamoDB access

### Installation
```bash
git clone https://github.com/yourusername/sports-reels.git
cd sports-reels
npm install
