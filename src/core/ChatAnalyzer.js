const EventEmitter = require('events');
const SentimentAnalyzer = require('../analysis/SentimentAnalyzer');
const IntentDetector = require('../analysis/IntentDetector');
const QualityScorer = require('../analysis/QualityScorer');
const ResponseGenerator = require('../responses/ResponseGenerator');
const ConversationAnalyzer = require('../analysis/ConversationAnalyzer');
const OpenAIIntegrator = require('../ai/OpenAIIntegrator');
const RealTimeAnalyzer = require('../realtime/RealTimeAnalyzer');
const PerformanceMonitor = require('../monitoring/PerformanceMonitor');
const winston = require('winston');

class ChatAnalyzer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = this._mergeConfig(config);
    this.isInitialized = false;
    this.analysisCount = 0;
    this.startTime = Date.now();
    
    // Initialize logger
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

    // Initialize components
    this.sentimentAnalyzer = null;
    this.intentDetector = null;
    this.qualityScorer = null;
    this.responseGenerator = null;
    this.conversationAnalyzer = null;
    this.openaiIntegrator = null;
    this.realTimeAnalyzer = null;
    this.performanceMonitor = null;

    this._initializeComponents();
  }

  _mergeConfig(userConfig) {
    const defaultConfig = {
      sentiment: {
        enabled: true,
        models: ['vader'],
        languages: ['en'],
        confidence: 0.7
      },
      intent: {
        enabled: true,
        detection: true,
        classification: true,
        confidence: 0.8
      },
      responses: {
        enabled: false,
        generation: false,
        optimization: true,
        templates: true
      },
      quality: {
        enabled: true,
        scoring: true,
        analysis: true,
        optimization: true
      },
      optimization: {
        enabled: true,
        realTime: false,
        recommendations: true,
        automation: false
      },
      multilang: {
        enabled: false,
        detection: false,
        translation: false,
        processing: false
      },
      openai: {
        enabled: false,
        apiKey: null,
        model: 'gpt-3.5-turbo',
        temperature: 0.7
      },
      performance: {
        enabled: true,
        monitoring: true,
        alerts: true,
        optimization: true
      }
    };

    return this._deepMerge(defaultConfig, userConfig);
  }

  _deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  async _initializeComponents() {
    try {
      this.logger.info('Initializing Chat Analyzer components');

      // Initialize sentiment analyzer
      if (this.config.sentiment.enabled) {
        this.sentimentAnalyzer = new SentimentAnalyzer(this.config.sentiment);
        await this.sentimentAnalyzer.initialize();
        this.logger.info('Sentiment Analyzer initialized');
      }

      // Initialize intent detector
      if (this.config.intent.enabled) {
        this.intentDetector = new IntentDetector(this.config.intent, this.logger);
        await this.intentDetector.initialize();
        this.logger.info('Intent Detector initialized');
      }

      // Initialize quality scorer
      if (this.config.quality.enabled) {
        this.qualityScorer = new QualityScorer(this.config.quality, this.logger);
        await this.qualityScorer.initialize();
        this.logger.info('Quality Scorer initialized');
      }

      // Initialize response generator
      if (this.config.responses.enabled) {
        this.responseGenerator = new ResponseGenerator(this.config.responses, this.logger);
        await this.responseGenerator.initialize();
        this.logger.info('Response Generator initialized');
      }

      // Initialize conversation analyzer
      this.conversationAnalyzer = new ConversationAnalyzer({}, this.logger);
      await this.conversationAnalyzer.initialize();
      this.logger.info('Conversation Analyzer initialized');

      // Initialize OpenAI integrator
      if (this.config.openai.enabled && this.config.openai.apiKey) {
        this.openaiIntegrator = new OpenAIIntegrator(this.config.openai, this.logger);
        await this.openaiIntegrator.initialize();
        this.logger.info('OpenAI Integrator initialized');
      }

      // Initialize real-time analyzer
      if (this.config.optimization.realTime) {
        this.realTimeAnalyzer = new RealTimeAnalyzer(this.config.optimization, this.logger);
        await this.realTimeAnalyzer.initialize();
        this.logger.info('Real-time Analyzer initialized');
      }

      // Initialize performance monitor
      if (this.config.performance.enabled) {
        this.performanceMonitor = new PerformanceMonitor(this.config.performance, this.logger);
        await this.performanceMonitor.initialize();
        this.logger.info('Performance Monitor initialized');
      }

      this.isInitialized = true;
      this.emit('initialized', { timestamp: new Date() });
      this.logger.info('Chat Analyzer initialized successfully');

    } catch (error) {
      this.logger.error('Chat Analyzer initialization error:', error);
      this.emit('error', { error: error.message, timestamp: new Date() });
      throw error;
    }
  }

  async analyzeMessage(message, context = {}) {
    if (!this.isInitialized) {
      throw new Error('Chat Analyzer not initialized');
    }

    try {
      this.analysisCount++;
      const startTime = Date.now();

      const analysis = {
        id: this._generateId(),
        message: message,
        context: context,
        timestamp: new Date(),
        results: {}
      };

      // Sentiment analysis
      if (this.sentimentAnalyzer) {
        analysis.results.sentiment = await this.sentimentAnalyzer.analyze(message);
      }

      // Intent detection
      if (this.intentDetector) {
        analysis.results.intent = await this.intentDetector.detect(message);
      }

      // Quality scoring
      if (this.qualityScorer) {
        analysis.results.quality = await this.qualityScorer.score(message, context);
      }

      // Response generation
      if (this.responseGenerator) {
        analysis.results.response = await this.responseGenerator.generate(message, context);
      }

      // Conversation analysis
      analysis.results.conversation = await this.conversationAnalyzer.analyze(message, context);

      // OpenAI analysis
      if (this.openaiIntegrator) {
        analysis.results.openai = await this.openaiIntegrator.analyze(message, context);
      }

      const processingTime = Date.now() - startTime;
      analysis.processingTime = processingTime;

      this.emit('messageAnalyzed', analysis);
      this.logger.info(`Message analyzed in ${processingTime}ms`, { 
        messageId: analysis.id,
        processingTime 
      });

      return analysis;

    } catch (error) {
      this.logger.error('Message analysis error:', error);
      this.emit('error', { error: error.message, timestamp: new Date() });
      throw error;
    }
  }

  async analyzeConversation(conversation, context = {}) {
    if (!this.isInitialized) {
      throw new Error('Chat Analyzer not initialized');
    }

    try {
      const startTime = Date.now();
      const conversationId = this._generateId();

      const conversationAnalysis = {
        id: conversationId,
        conversation: conversation,
        context: context,
        timestamp: new Date(),
        messages: [],
        summary: {},
        insights: {}
      };

      // Analyze each message
      for (const message of conversation) {
        const messageAnalysis = await this.analyzeMessage(message, context);
        conversationAnalysis.messages.push(messageAnalysis);
      }

      // Generate conversation summary
      conversationAnalysis.summary = await this._generateConversationSummary(conversationAnalysis);

      // Generate insights
      conversationAnalysis.insights = await this._generateInsights(conversationAnalysis);

      const processingTime = Date.now() - startTime;
      conversationAnalysis.processingTime = processingTime;

      this.emit('conversationAnalyzed', conversationAnalysis);
      this.logger.info(`Conversation analyzed in ${processingTime}ms`, { 
        conversationId,
        messageCount: conversation.length,
        processingTime 
      });

      return conversationAnalysis;

    } catch (error) {
      this.logger.error('Conversation analysis error:', error);
      this.emit('error', { error: error.message, timestamp: new Date() });
      throw error;
    }
  }

  async _generateConversationSummary(conversationAnalysis) {
    const messages = conversationAnalysis.messages;
    
    const summary = {
      totalMessages: messages.length,
      averageSentiment: 0,
      dominantIntent: null,
      averageQuality: 0,
      keyTopics: [],
      emotionalTrend: 'neutral'
    };

    if (messages.length === 0) return summary;

    // Calculate average sentiment
    const sentiments = messages
      .map(m => m.results.sentiment?.score)
      .filter(s => s !== undefined);
    
    if (sentiments.length > 0) {
      summary.averageSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    }

    // Find dominant intent
    const intents = messages
      .map(m => m.results.intent?.intent)
      .filter(i => i !== undefined);
    
    if (intents.length > 0) {
      const intentCounts = {};
      intents.forEach(intent => {
        intentCounts[intent] = (intentCounts[intent] || 0) + 1;
      });
      summary.dominantIntent = Object.keys(intentCounts).reduce((a, b) => 
        intentCounts[a] > intentCounts[b] ? a : b
      );
    }

    // Calculate average quality
    const qualities = messages
      .map(m => m.results.quality?.score)
      .filter(q => q !== undefined);
    
    if (qualities.length > 0) {
      summary.averageQuality = qualities.reduce((a, b) => a + b, 0) / qualities.length;
    }

    // Determine emotional trend
    if (summary.averageSentiment > 0.1) {
      summary.emotionalTrend = 'positive';
    } else if (summary.averageSentiment < -0.1) {
      summary.emotionalTrend = 'negative';
    } else {
      summary.emotionalTrend = 'neutral';
    }

    return summary;
  }

  async _generateInsights(conversationAnalysis) {
    const insights = {
      recommendations: [],
      improvements: [],
      patterns: [],
      alerts: []
    };

    // Generate recommendations based on analysis
    if (conversationAnalysis.summary.averageQuality < 0.6) {
      insights.recommendations.push('Consider improving response quality');
    }

    if (conversationAnalysis.summary.emotionalTrend === 'negative') {
      insights.recommendations.push('Address negative sentiment in conversation');
    }

    // Generate improvement suggestions
    if (conversationAnalysis.summary.averageSentiment < 0) {
      insights.improvements.push('Focus on more positive language');
    }

    // Detect patterns
    const messageCount = conversationAnalysis.messages.length;
    if (messageCount > 10) {
      insights.patterns.push('Long conversation detected');
    }

    return insights;
  }

  getSystemStatus() {
    return {
      initialized: this.isInitialized,
      analysisCount: this.analysisCount,
      uptime: Date.now() - this.startTime,
      components: {
        sentiment: !!this.sentimentAnalyzer,
        intent: !!this.intentDetector,
        quality: !!this.qualityScorer,
        responses: !!this.responseGenerator,
        conversation: !!this.conversationAnalyzer,
        openai: !!this.openaiIntegrator,
        realtime: !!this.realTimeAnalyzer,
        performance: !!this.performanceMonitor
      },
      timestamp: new Date()
    };
  }

  getSupportedFeatures() {
    return {
      sentiment: this.config.sentiment.enabled,
      intent: this.config.intent.enabled,
      responses: this.config.responses.enabled,
      quality: this.config.quality.enabled,
      optimization: this.config.optimization.enabled,
      multilang: this.config.multilang.enabled,
      openai: this.config.openai.enabled,
      realtime: this.config.optimization.realTime,
      performance: this.config.performance.enabled
    };
  }

  _generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  async shutdown() {
    this.logger.info('Shutting down Chat Analyzer');
    
    if (this.sentimentAnalyzer) {
      await this.sentimentAnalyzer.shutdown();
    }
    
    if (this.intentDetector) {
      await this.intentDetector.shutdown();
    }
    
    if (this.qualityScorer) {
      await this.qualityScorer.shutdown();
    }
    
    if (this.responseGenerator) {
      await this.responseGenerator.shutdown();
    }
    
    if (this.conversationAnalyzer) {
      await this.conversationAnalyzer.shutdown();
    }
    
    if (this.openaiIntegrator) {
      await this.openaiIntegrator.shutdown();
    }
    
    if (this.realTimeAnalyzer) {
      await this.realTimeAnalyzer.shutdown();
    }
    
    if (this.performanceMonitor) {
      await this.performanceMonitor.shutdown();
    }

    this.isInitialized = false;
    this.emit('shutdown', { timestamp: new Date() });
    this.logger.info('Chat Analyzer shutdown complete');
  }
}

module.exports = ChatAnalyzer;
