'use strict';

const fs = require('fs');
const path = require('path');
const constants = {
  'Http2Pusher' : 'Http2Pusher',
  'CONSOLE' : 'CONSOLE',
  'BUNYAN' : 'bunyan'
};
const packageName = constants.Http2Pusher;
const defaults = {
  'logger' : {
    'type' : constants.CONSOLE
  }
};

class Http2Pusher {
  constructor(options) {
    if(!options || !options.config) {
      throw new Error(`ERROR: ${packageName}: 'config' property is undefined.`);
    }

    if(!options.basePath) {
      throw new Error(`ERROR: ${packageName}: 'basePath' property is undefined.`);
    }

    if(!!options.logger && 
      !!options.logger.type &&
      (options.logger.type === constants.BUNYAN) && 
      (!options.logger.instance || !options.logger.instance.info)) {
      throw new Error(`ERROR: ${packageName}: logger is misconfigured - please see documentation.`);
    }

    this.options = Object.assign({}, defaults, options);
    this.push = this.push.bind(this);
  }

  log(message, data) {
    if(this.options.logger) {
      let fullMessage = `${constants.packageName}: ${message}`;

      if(this.options.logger.type === constants.BUNYAN) {
        this.options.logger.instance.info(data, fullMessage);
      } else if(this.options.logger.type === constants.CONSOLE) {
        console.log(fullMessage, data);
      }
    }
  }

  push(req, res, next) {
    if(!!res && res.push && !!req && req.url) {
      this.pushFiles(req, res, next);
    } else if(!!next) {
      next();
    }
  }

  pushFiles(req, res, next) {
    let group = Http2Pusher.getFiles(req.url, this.options.config);
    let self = this;

    if((!group || !group.files) && !!next) {
      next();
    } else {
      let files = group.files;

      files.forEach((file, index) => {
        let push = res.push(file.path);

        push.stream.on('error', error => {
          self.log('Error pushing file.', {
            'file' : file.path, 
            'err' : error.message
          });

          push.stream.removeAllListeners();
        });

        push.stream.on('end', () => {
          push.stream.removeAllListeners();
        })

        push.writeHead(200, file.headers);

        fs.createReadStream(`${self.options.basePath}${file.path}`).pipe(push);
      });
      
      if(!!next) {
        next();
      }
    }
  }

  static getFiles(path, config) {
    if(!config.groups || !Array.isArray(config.groups)) {
      return [];
    }

    let groups = {};
    
    config.groups.forEach((group) => {
      let trimmedPath = (group.path.indexOf('/*') > -1)
        ? group.path.split('/*')[0]
        : null;

      if(path === group.path) {
        groups.matched = group;
      } else if(!!trimmedPath && path.indexOf(trimmedPath) === 0) {
        if(!groups.patternMatched || group.path.length > groups.patternMatched) {
          groups.patternMatched = group;
        }
      }
    });

    if(groups.matched) {
      return groups.matched;
    } else if(groups.patternMatched) {
      return groups.patternMatched;
    } else {
      return null;
    }
  }
}

module.exports = Http2Pusher;
