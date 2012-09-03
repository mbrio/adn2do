/*global module:true*/

var Post = function (data) {
  for (var attr in data) {
    this[attr] = data[attr];
  }
};

Post.prototype.key = function () {
  return this.link;
};

Post.prototype.dayOneEntry = function () {
  return this.message + '\n\n' + this.via + '\n' + this.link;
};

Post.parse = function (data) {
  var lines = data.split('\n');
  var trueLines = [];

  for (var n in lines) {
    var line = lines[n].trim();
    if (line.length > 0) {
      trueLines.push(line);
    }
  }

  var messageLines = trueLines.length - 3;
  var message = '';

  if (messageLines > 0) {
    // TEST MULTI LINE
    for (var j = 0, k = trueLines.length - 3; j < k; j++) {
      message += trueLines[j].trim();
    }
  }

  var via = trueLines[trueLines.length - 3].trim();
  var link = trueLines[trueLines.length - 2].trim();
  var date = trueLines[trueLines.length - 1].trim().replace(' at', '');

  return new Post({
    message: message,
    via: via,
    link: link,
    date: date
  });
};

module.exports.Post = Post;