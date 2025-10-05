const EventEmitter = require('events');
const winston = require('winston');

class ResponseGenerator extends EventEmitter {
  constructor(config = {}, logger) {
    super();
    
    this.config = {
      enabled: false,
      generation: false,
      optimization: true,
      templates: true,
      ...config
    };
    
    this.logger = logger;

    // Response templates
    this.templates = {
      greeting: [
        "Hello! How can I help you today?",
        "Hi there! What can I assist you with?",
        "Good day! How may I help you?"
      ],
      question: [
        "That's a great question. Let me help you with that.",
        "I'd be happy to help you with that question.",
        "Let me provide you with some information about that."
      ],
      complaint: [
        "I'm sorry to hear about this issue. Let me help you resolve it.",
        "I understand your frustration. Let's work together to fix this.",
        "Thank you for bringing this to our attention. Let me assist you."
      ],
      request: [
        "I'd be happy to help you with that request.",
        "Of course! Let me assist you with that.",
        "I'll do my best to help you with that."
      ],
      goodbye: [
        "Thank you for chatting with us today!",
        "Have a great day! Feel free to reach out anytime.",
        "Goodbye! We're here if you need anything else."
      ],
      thanks: [
        "You're very welcome!",
        "Happy to help!",
        "My pleasure! Is there anything else I can assist you with?"
      ]
    };
  }

  async initialize() {
    this.logger.info('Initializing Response Generator');
    this.emit('initialized', { timestamp: new Date() });
  }

  async generate(message, context = {}) {
    try {
      const startTime = Date.now();
      
      const response = this._generateResponse(message, context);
      
      const result = {
        message: message,
        response: response.text,
        confidence: response.confidence,
        template: response.template,
        alternatives: response.alternatives,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

      this.emit('responseGenerated', result);
      this.logger.info('Response generation completed', { 
        confidence: result.confidence,
        template: result.template
      });

      return result;

    } catch (error) {
      this.logger.error('Response generation error:', error);
      this.emit('error', { error: error.message, timestamp: new Date() });
      throw error;
    }
  }

  _generateResponse(message, context) {
    const intent = context.intent || this._detectIntent(message);
    const templates = this.templates[intent] || this.templates.question;
    
    // Select a random template
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    // Generate alternatives
    const alternatives = templates.filter(t => t !== selectedTemplate);
    
    return {
      text: selectedTemplate,
      confidence: 0.8,
      template: intent,
      alternatives: alternatives.slice(0, 2)
    };
  }

  _detectIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'greeting';
    }
    if (lowerMessage.includes('thank')) {
      return 'thanks';
    }
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      return 'goodbye';
    }
    if (lowerMessage.includes('problem') || lowerMessage.includes('issue')) {
      return 'complaint';
    }
    if (lowerMessage.includes('please') || lowerMessage.includes('can you')) {
      return 'request';
    }
    
    return 'question';
  }

  async shutdown() {
    this.logger.info('Shutting down Response Generator');
    this.emit('shutdown', { timestamp: new Date() });
  }
}

module.exports = ResponseGenerator;
