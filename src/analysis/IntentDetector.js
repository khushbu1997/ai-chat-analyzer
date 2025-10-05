const EventEmitter = require('events');
const _ = require('lodash');

class IntentDetector extends EventEmitter {
  constructor(config = {}, logger) {
    super();
    
    this.config = {
      enabled: true,
      detection: true,
      classification: true,
      confidence: 0.8,
      ...config
    };
    
    this.logger = logger;

    // Initialize intent patterns
    this.intentPatterns = {
      greeting: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
      question: ['what', 'how', 'when', 'where', 'why', 'who', 'which', '?'],
      complaint: ['problem', 'issue', 'error', 'bug', 'broken', 'not working', 'complaint'],
      request: ['please', 'can you', 'could you', 'would you', 'help', 'assist'],
      goodbye: ['bye', 'goodbye', 'see you', 'farewell', 'take care'],
      thanks: ['thank you', 'thanks', 'appreciate', 'grateful'],
      purchase: ['buy', 'purchase', 'order', 'price', 'cost', 'payment'],
      support: ['help', 'support', 'assistance', 'troubleshoot', 'fix']
    };
  }

  async initialize() {
    this.logger.info('Initializing Intent Detector');
    this.emit('initialized', { timestamp: new Date() });
  }

  async detect(text) {
    try {
      const startTime = Date.now();
      
      const intent = this._classifyIntent(text);
      
      const result = {
        text: text,
        intent: intent.intent,
        confidence: intent.confidence,
        alternatives: intent.alternatives,
        keywords: intent.keywords,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

      this.emit('intentDetected', result);
      this.logger.info('Intent detection completed', { 
        intent: result.intent,
        confidence: result.confidence
      });

      return result;

    } catch (error) {
      this.logger.error('Intent detection error:', error);
      this.emit('error', { error: error.message, timestamp: new Date() });
      throw error;
    }
  }

  _classifyIntent(text) {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    
    const scores = {};
    const keywords = [];
    
    // Score each intent based on keyword matches
    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      let score = 0;
      
      for (const pattern of patterns) {
        if (lowerText.includes(pattern)) {
          score += 1;
          keywords.push(pattern);
        }
      }
      
      // Also check for word matches
      for (const word of words) {
        if (patterns.includes(word)) {
          score += 0.5;
          keywords.push(word);
        }
      }
      
      scores[intent] = score;
    }
    
    // Find the intent with highest score
    const sortedIntents = Object.entries(scores)
      .sort(([,a], [,b]) => b - a);
    
    const primaryIntent = sortedIntents[0];
    const alternatives = sortedIntents.slice(1, 4).map(([intent, score]) => ({
      intent,
      score
    }));
    
    return {
      intent: primaryIntent[0],
      confidence: Math.min(primaryIntent[1] / 3, 1), // Normalize confidence
      alternatives,
      keywords: [...new Set(keywords)] // Remove duplicates
    };
  }

  async shutdown() {
    this.logger.info('Shutting down Intent Detector');
    this.emit('shutdown', { timestamp: new Date() });
  }
}

module.exports = IntentDetector;
