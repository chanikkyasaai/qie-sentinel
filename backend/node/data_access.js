/**
 * Data Access Layer - Abstraction for JSON/MongoDB storage
 * 
 * This module provides a unified interface for data operations,
 * allowing seamless migration from JSON files to MongoDB in the future.
 */

const fs = require('fs');
const path = require('path');

class DataAccess {
  constructor(config = {}) {
    this.type = config.type || 'json';
    this.basePath = config.basePath || path.join(__dirname, '../');
    this.mongoClient = null;
    this.cache = {};
    this.cacheEnabled = config.useCache !== false;
  }

  /**
   * Read data from storage
   * @param {String} collection - Collection/file name
   * @returns {*} Parsed data
   */
  async read(collection) {
    try {
      // Check cache first
      if (this.cacheEnabled && this.cache[collection]) {
        return this.cache[collection];
      }

      if (this.type === 'json') {
        const filePath = this._resolveJsonPath(collection);
        
        if (!fs.existsSync(filePath)) {
          console.warn(`⚠️  Data file not found: ${filePath}`);
          return null;
        }
        
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContent);
        
        // Update cache
        if (this.cacheEnabled) {
          this.cache[collection] = data;
        }
        
        return data;
      } else if (this.type === 'mongodb') {
        // MongoDB implementation (future)
        throw new Error('MongoDB not yet implemented');
      }
    } catch (error) {
      console.error(`❌ Error reading ${collection}:`, error.message);
      return null;
    }
  }

  /**
   * Write data to storage
   * @param {String} collection - Collection/file name
   * @param {*} data - Data to write
   * @returns {Boolean} Success status
   */
  async write(collection, data) {
    try {
      if (this.type === 'json') {
        const filePath = this._resolveJsonPath(collection);
        
        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        
        // Update cache
        if (this.cacheEnabled) {
          this.cache[collection] = data;
        }
        
        return true;
      } else if (this.type === 'mongodb') {
        // MongoDB implementation (future)
        throw new Error('MongoDB not yet implemented');
      }
    } catch (error) {
      console.error(`❌ Error writing ${collection}:`, error.message);
      return false;
    }
  }

  /**
   * Append to array-based collection
   * @param {String} collection - Collection/file name
   * @param {*} item - Item to append
   * @returns {Boolean} Success status
   */
  async append(collection, item) {
    try {
      const data = await this.read(collection) || [];
      
      if (!Array.isArray(data)) {
        console.error(`❌ Cannot append to non-array collection: ${collection}`);
        return false;
      }
      
      data.push(item);
      return await this.write(collection, data);
    } catch (error) {
      console.error(`❌ Error appending to ${collection}:`, error.message);
      return false;
    }
  }

  /**
   * Update specific item in collection
   * @param {String} collection - Collection/file name
   * @param {Function} matcher - Function to find item
   * @param {Function} updater - Function to update item
   * @returns {Boolean} Success status
   */
  async update(collection, matcher, updater) {
    try {
      const data = await this.read(collection);
      
      if (!data) {
        return false;
      }
      
      if (Array.isArray(data)) {
        const index = data.findIndex(matcher);
        if (index !== -1) {
          data[index] = updater(data[index]);
          return await this.write(collection, data);
        }
      } else {
        // Object update
        const updated = updater(data);
        return await this.write(collection, updated);
      }
      
      return false;
    } catch (error) {
      console.error(`❌ Error updating ${collection}:`, error.message);
      return false;
    }
  }

  /**
   * Query collection with filter
   * @param {String} collection - Collection/file name
   * @param {Function} filter - Filter function
   * @returns {Array} Filtered results
   */
  async query(collection, filter) {
    try {
      const data = await this.read(collection);
      
      if (!data) {
        return [];
      }
      
      if (Array.isArray(data)) {
        return data.filter(filter);
      }
      
      // For objects, return wrapped in array if filter passes
      return filter(data) ? [data] : [];
    } catch (error) {
      console.error(`❌ Error querying ${collection}:`, error.message);
      return [];
    }
  }

  /**
   * Clear cache for collection or all
   * @param {String} collection - Collection name (optional)
   */
  clearCache(collection = null) {
    if (collection) {
      delete this.cache[collection];
    } else {
      this.cache = {};
    }
  }

  /**
   * Resolve JSON file path
   * @private
   */
  _resolveJsonPath(collection) {
    // Handle different path patterns
    if (collection.includes('/') || collection.includes('\\')) {
      return path.resolve(this.basePath, collection);
    }
    
    // Default patterns
    if (collection.startsWith('config.')) {
      return path.join(this.basePath, 'config', `${collection.replace('config.', '')}.json`);
    }
    
    if (collection.startsWith('logs.')) {
      return path.join(this.basePath, 'logs', `${collection.replace('logs.', '')}.json`);
    }
    
    // Default to config directory
    return path.join(this.basePath, 'config', `${collection}.json`);
  }

  /**
   * Initialize MongoDB connection (future implementation)
   * @private
   */
  async _initMongoDB() {
    // TODO: Implement MongoDB connection
    throw new Error('MongoDB not yet implemented');
  }
}

// ============ Singleton Export ============

let instance = null;

module.exports = {
  /**
   * Get or create DataAccess instance
   * @param {Object} config - Configuration options
   * @returns {DataAccess} DataAccess instance
   */
  getInstance(config = {}) {
    if (!instance) {
      instance = new DataAccess(config);
    }
    return instance;
  },

  /**
   * Create new DataAccess instance
   * @param {Object} config - Configuration options
   * @returns {DataAccess} New DataAccess instance
   */
  createInstance(config = {}) {
    return new DataAccess(config);
  },

  DataAccess
};
