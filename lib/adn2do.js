/*global require:true, process:true, module:true*/

var path = require('path'),
    configPath = path.normalize(process.env.HOME + '/.adn2do'),
    dayonePath = path.normalize('/usr/local/bin/dayone'),
    postsPath = path.normalize(process.env.HOME + '/Dropbox/adn2do/'),
    defaults = {
      configPath: configPath,
      dayonePath: dayonePath,
      postsPath: postsPath
    },
    Posts = require('./posts.js').Posts;

module.exports = {
  process: function (options) {
    for (var i in options) {
      defaults[i] = options[i];
    }

    Posts.process(defaults);
  }
};