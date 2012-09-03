/*global require:true, module:true, console:true, process:true*/

var fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    Post = require('./post').Post;

var Posts = function (options) {
  this.options = options;
  if (!this.options) { throw "You must pass all required options to Posts.process."; }
  if (!this.options.configPath || this.options.configPath.length < 1) { throw "You must pass the path to the adn2do config file."; }
  if (!this.options.dayonePath || this.options.dayonePath.length < 1) { throw "You must pass the path to the dayone CLI."; }
  if (!this.options.postsPath || this.options.postsPath.length < 1) { throw "You must pass the path to the adn2do IFTTT directory."; }

  this._configProcessed = {};
  this._processedPosts = {};

  this._filesToProcess = 0;
  this._postsToProcess = {};
};

Posts.process = function (options) {
  var posts = new Posts(options);
  posts.process();

  return posts;
};

Posts.prototype.process = function () {
  this._processConfiguration(this._processDirectory.bind(this));
};

Posts.prototype._hasProcessed = function (key) {
    return this._configProcessed.hasOwnProperty(key) === true || this._processedPosts.hasOwnProperty(key) === true;
};

Posts.prototype._processConfiguration =  function (callback) {
  fs.exists(this.options.configPath, function (exists) {
    if (exists === true) {
      fs.readFile(this.options.configPath, function (err, data) {
        if (err) { throw err; }

        var lines = data.toString().split('\n');

        for (var i = 0, j = lines.length; i < j; i++) {
          var line = lines[i].trim();

          if (line.length > 0) { this._configProcessed[line] = line; }
        }

        callback();
      }.bind(this));
    } else {
      callback();
    }
  }.bind(this));
};

Posts.prototype._processDirectory = function () {
  fs.stat(this.options.postsPath, function (err, stats) {
    if (err) {
      console.error('An error occurred, the posts directory may not exist.');
      process.exit();
    }

    if (stats.isDirectory() === false) {
      console.error('The path for posts is not a directory.');
      process.exit();
    }

    fs.readdir(this.options.postsPath, function (err, files) {
      this._filesToProcess = files.length;

      for (var i = 0, j = files.length; i < j; i++) {
        var postsFilePath = path.normalize(this.options.postsPath + '/' + files[i]);
        this._processFile(postsFilePath);
      }
    }.bind(this));
  }.bind(this));
};

Posts.prototype._processFile = function (filePath) {
  fs.readFile(filePath, function (err, data) {
    if (err) { throw err; }

    var postsString = data.toString();
    var posts = postsString.split('- - - - -');

    this._postsToProcess[filePath] = posts.length;

    var execCallback = function (post) {
      return function (err, stdout, stderr) {
        if (err) {
          console.error('An error occurred while processing post: ' + post.key() + '\n\n');
          console.error(stderr + '\n\n');
        }
        else {
          this._processedPosts[post.key()] = post;
        }

        this._postsToProcess[filePath] -= 1;

        if (this._postsToProcess[filePath] === 0) {
          this._filesToProcess -= 1;

          if (this._filesToProcess === 0) {
            this._writeConfig();
          }
        }
      }.bind(this);
    }.bind(this);

    for (var i in posts) {
      if (posts[i] && posts[i].trim().length > 0) {
        var post = Post.parse(posts[i]);

        if (this._hasProcessed(post.key()) === false) {
          if (this.options.hasOwnProperty('alterPost')) { this.options.alterPost(post); }
          exec('echo "' + post.dayOneEntry() + '" | ' + this.options.dayonePath + ' -d="' + post.date + '" new', execCallback(post));
        } else {
          this._postsToProcess[filePath] -= 1;
        }
      } else {
        this._postsToProcess[filePath] -= 1;
      }
    }
  }.bind(this));
};

Posts.prototype._writeConfig = function () {
  var config = fs.createWriteStream(this.options.configPath, { flags: 'a' });
  for (var i in this._processedPosts) {
    if (this._configProcessed.hasOwnProperty(i) === false) {
      config.write(i + '\n');
    }
  }
};

module.exports.Posts = Posts;