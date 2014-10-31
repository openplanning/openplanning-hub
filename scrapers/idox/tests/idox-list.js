var fs = require('fs'),
    cheerio = require('cheerio')
    Parser = require('../../../parser'),
    scraperModel = require('../models/list');

fs.readFile('./tests/idox-list-lambeth.html', 'utf8', function (err, html) {
  if (err) {
    return console.log(err);
  }
  var parser = new Parser(scraperModel);
  var doc = parser.parse(html);

  console.log(doc);
});