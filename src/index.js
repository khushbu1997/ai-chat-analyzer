// Main entry point for AI Chat Analyzer
const ChatAnalyzer = require('./core/ChatAnalyzer');
const SentimentAnalyzer = require('./analysis/SentimentAnalyzer');
const IntentDetector = require('./analysis/IntentDetector');
const QualityScorer = require('./analysis/QualityScorer');
const ResponseGenerator = require('./responses/ResponseGenerator');
const ConversationAnalyzer = require('./analysis/ConversationAnalyzer');
const OpenAIIntegrator = require('./ai/OpenAIIntegrator');
const RealTimeAnalyzer = require('./realtime/RealTimeAnalyzer');
const PerformanceMonitor = require('./monitoring/PerformanceMonitor');

// Export main classes
module.exports = {
  // Core classes
  ChatAnalyzer,
  SentimentAnalyzer,
  IntentDetector,
  QualityScorer,
  ResponseGenerator,
  ConversationAnalyzer,
  OpenAIIntegrator,
  RealTimeAnalyzer,
  PerformanceMonitor,
  
  // Default export
  default: ChatAnalyzer
};
