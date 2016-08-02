'use strict';

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const Http2Pusher = require('../');

function instantiateWithoutOptions(){
  let http2Pusher = new Http2Pusher();
}

function instantiateWithoutConfig(){
  let http2Pusher = new Http2Pusher({
    'basePath' : '/some/path'
  });
}

function instantiateWithoutBasePath(){
  let http2Pusher = new Http2Pusher({
    'config' : {
      'groups' : [
        {
          'path' : '/foo/*',
          'files' : [
            {
              'path' : '/public/images/favicon.ico'
            }
          ]
        }
      ]
    }
  });
}

function instantiate(){
  let http2Pusher = new Http2Pusher({
    'basePath' : '/some/path',
    'config' : {
      'groups' : [
        {
          'path' : '/foo/*',
          'files' : [
            {
              'path' : '/public/images/favicon.ico'
            }
          ]
        }
      ]
    }
  });
}

describe('new Http2Pusher(): Create and instance of Http2Pusher.', () => {
  it('Should throw an error when instantiated without options.', () => {
    expect(instantiateWithoutOptions).to.throw(Error);
  });

  it('Should throw an error when instantiated without a config option.', () => {
    expect(instantiateWithoutConfig).to.throw(Error);
  });

  it('Should throw an error when instantiated without a basePath option.', () => {
    expect(instantiateWithoutBasePath).to.throw(Error);
  });

  it('Should not throw an error when instantiated with correct options.', () => {
    expect(instantiate).to.not.throw(Error);
  });
});

describe('Http2Pusher.getFiles(): Get file group from configuration matched against a URL.', () => {
  let config = {
    'groups' : [
      {
        'path' : '/foo/*',
        'files' : [
          {
            'path' : '/public/images/favicon.ico'
          }
        ]
      }
    ]
  }

  it('Should return null for a non exact match and non pattern match.', () => {
    let result = Http2Pusher.getFiles('/', config);
    expect(result).to.equal(null);
  });

  it('Should return a group object for a pattern match.', () => {
    let result = Http2Pusher.getFiles('/foo/bar', config);

    expect(result).to.eql({
      'path' : '/foo/*',
      'files' : [
        {
          'path' : '/public/images/favicon.ico'
        }
      ]
    });
  });

  it('Should return a group object for an exact match.', () => {
    let config = {
      'groups' : [
        {
          'path' : '/foo/bar',
          'files' : [
            {
              'path' : '/public/images/favicon.ico'
            }
          ]
        }
      ]
    }
    let result = Http2Pusher.getFiles('/foo/bar', config);

    expect(result).to.eql({
      'path' : '/foo/bar',
      'files' : [
        {
          'path' : '/public/images/favicon.ico'
        }
      ]
    });
  });

  it('Should return a group object for the exact match in the case of an existence of both exact and pattern.', () => {
    let config = {
      'groups' : [
        {
          'path' : '/foo/*',
          'files' : [
            {
              'path' : '/public/images/favicon.ico'
            }
          ]
        },
        {
          'path' : '/foo/bar',
          'files' : [
            {
              'path' : '/public/images/favicon.ico'
            }
          ]
        }
      ]
    }
    let result = Http2Pusher.getFiles('/foo/bar', config);

    expect(result).to.eql({
      'path' : '/foo/bar',
      'files' : [
        {
          'path' : '/public/images/favicon.ico'
        }
      ]
    });
  });

  it('Should return a group object for the pattern match that has the longest match in the case of multiple matches.', () => {
    let config = {
      'groups' : [
        {
          'path' : '/foo/*',
          'files' : [
            {
              'path' : '/public/images/favicon.ico'
            }
          ]
        },
        {
          'path' : '/foo/bar/*',
          'files' : [
            {
              'path' : '/public/images/favicon.ico'
            },
            {
              'path' : '/public/css/main.css'
            }
          ]
        }
      ]
    }
    let result = Http2Pusher.getFiles('/foo/bar', config);

    expect(result).to.eql({
      'path' : '/foo/bar/*',
      'files' : [
        {
          'path' : '/public/images/favicon.ico'
        },
        {
          'path' : '/public/css/main.css'
        }
      ]
    });
  });

  it('Should return a group object for the pattern match that has the longest match in the case of multiple matches... regardless of order.', () => {
    let config = {
      'groups' : [
        {
          'path' : '/foo/bar/*',
          'files' : [
            {
              'path' : '/public/images/favicon.ico'
            },
            {
              'path' : '/public/css/main.css'
            }
          ]
        },
        {
          'path' : '/foo/*',
          'files' : [
            {
              'path' : '/public/images/favicon.ico'
            }
          ]
        }
      ]
    }
    let result = Http2Pusher.getFiles('/foo/bar', config);

    expect(result).to.eql({
      'path' : '/foo/bar/*',
      'files' : [
        {
          'path' : '/public/images/favicon.ico'
        },
        {
          'path' : '/public/css/main.css'
        }
      ]
    });
  });
});