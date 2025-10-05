const EventEmitter = require('events');
const vader = require('vader-sentiment');
const winston = require('winston');

class SentimentAnalyzer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: true,
      models: ['vader'],
      languages: ['en'],
      confidence: 0.7,
      ...config
    };
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });
  }

  async initialize() {
    this.logger.info('Initializing Sentiment Analyzer');
    this.emit('initialized', { timestamp: new Date() });
  }

  async analyze(text) {
    try {
      const startTime = Date.now();
      
      const sentiment = vader.SentimentIntensityAnalyzer.polarity_scores(text);
      
      const result = {
        text: text,
        score: sentiment.compound,
        positive: sentiment.pos,
        negative: sentiment.neg,
        neutral: sentiment.neu,
        confidence: Math.abs(sentiment.compound),
        label: this._getSentimentLabel(sentiment.compound),
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

      this.emit('sentimentAnalyzed', result);
      this.logger.info('Sentiment analysis completed', { 
        score: result.score,
        label: result.label,
        confidence: result.confidence
      });

      return result;

    } catch (error) {
      this.logger.error('Sentiment analysis error:', error);
      this.emit('error', { error: error.message, timestamp: new Date() });
      throw error;
    }
  }

  _getSentimentLabel(score) {
    if (score >= 0.05) return 'positive';
    if (score <= -0.05) return 'negative';
    return 'neutral';
  }

  async shutdown() {
    this.logger.info('Shutting down Sentiment Analyzer');
    this.emit('shutdown', { timestamp: new Date() });
  }
}

module.exports = SentimentAnalyzer;
