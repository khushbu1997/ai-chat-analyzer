const EventEmitter = require('events');
const winston = require('winston');

class QualityScorer extends EventEmitter {
  constructor(config = {}, logger) {
    super();
    
    this.config = {
      enabled: true,
      scoring: true,
      analysis: true,
      optimization: true,
      ...config
    };
    
    this.logger = logger;
  }

  async initialize() {
    this.logger.info('Initializing Quality Scorer');
    this.emit('initialized', { timestamp: new Date() });
  }

  async score(message, context = {}) {
    try {
      const startTime = Date.now();
      
      const quality = this._calculateQuality(message, context);
      
      const result = {
        message: message,
        score: quality.score,
        factors: quality.factors,
        recommendations: quality.recommendations,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

      this.emit('qualityScored', result);
      this.logger.info('Quality scoring completed', { 
        score: result.score,
        factors: Object.keys(result.factors)
      });

      return result;

    } catch (error) {
      this.logger.error('Quality scoring error:', error);
      this.emit('error', { error: error.message, timestamp: new Date() });
      throw error;
    }
  }

  _calculateQuality(message, context) {
    const factors = {
      length: this._scoreLength(message),
      clarity: this._scoreClarity(message),
      politeness: this._scorePoliteness(message),
      completeness: this._scoreCompleteness(message),
      relevance: this._scoreRelevance(message, context)
    };

    const score = Object.values(factors).reduce((sum, factor) => sum + factor, 0) / Object.keys(factors).length;
    
    const recommendations = this._generateRecommendations(factors);

    return {
      score: Math.round(score * 100) / 100,
      factors,
      recommendations
    };
  }

  _scoreLength(message) {
    const length = message.length;
    if (length < 10) return 0.3; // Too short
    if (length < 50) return 0.6; // Short but acceptable
    if (length < 200) return 1.0; // Good length
    if (length < 500) return 0.8; // Long but acceptable
    return 0.5; // Too long
  }

  _scoreClarity(message) {
    const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = message.split(/\s+/).length / sentences.length;
    
    if (avgWordsPerSentence < 5) return 0.4; // Too short sentences
    if (avgWordsPerSentence < 15) return 1.0; // Good sentence length
    if (avgWordsPerSentence < 25) return 0.7; // Long but acceptable
    return 0.3; // Too long sentences
  }

  _scorePoliteness(message) {
    const politeWords = ['please', 'thank you', 'thanks', 'appreciate', 'sorry', 'excuse me'];
    const impoliteWords = ['damn', 'stupid', 'idiot', 'hate', 'angry'];
    
    const lowerMessage = message.toLowerCase();
    let score = 0.5; // Base score
    
    politeWords.forEach(word => {
      if (lowerMessage.includes(word)) score += 0.1;
    });
    
    impoliteWords.forEach(word => {
      if (lowerMessage.includes(word)) score -= 0.2;
    });
    
    return Math.max(0, Math.min(1, score));
  }

  _scoreCompleteness(message) {
    const hasQuestion = message.includes('?');
    const hasGreeting = /^(hi|hello|hey|good morning|good afternoon)/i.test(message);
    const hasContext = message.split(/\s+/).length > 5;
    
    let score = 0;
    if (hasGreeting) score += 0.3;
    if (hasContext) score += 0.5;
    if (hasQuestion) score += 0.2;
    
    return Math.min(1, score);
  }

  _scoreRelevance(message, context) {
    // Simple relevance scoring based on context
    if (!context.topic) return 0.7; // Default score if no context
    
    const topicKeywords = context.topic.toLowerCase().split(/\s+/);
    const messageWords = message.toLowerCase().split(/\s+/);
    
    const matches = topicKeywords.filter(keyword => 
      messageWords.some(word => word.includes(keyword))
    );
    
    return Math.min(1, matches.length / topicKeywords.length + 0.3);
  }

  _generateRecommendations(factors) {
    const recommendations = [];
    
    if (factors.length < 0.5) {
      recommendations.push('Consider providing more detail in your message');
    }
    
    if (factors.clarity < 0.5) {
      recommendations.push('Try to use shorter, clearer sentences');
    }
    
    if (factors.politeness < 0.5) {
      recommendations.push('Consider using more polite language');
    }
    
    if (factors.completeness < 0.5) {
      recommendations.push('Provide more context or background information');
    }
    
    if (factors.relevance < 0.5) {
      recommendations.push('Stay more focused on the topic');
    }
    
    return recommendations;
  }

  async shutdown() {
    this.logger.info('Shutting down Quality Scorer');
    this.emit('shutdown', { timestamp: new Date() });
  }
}

module.exports = QualityScorer;
