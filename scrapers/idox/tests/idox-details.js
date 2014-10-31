var fs = require('fs'),
    cheerio = require('cheerio')
    Parser = require('../../../parser'),
    scraperModel = require('../models/detail');

fs.readFile('./tests/idox-details-lambeth.html', 'utf8', function (err, html) {
  if (err) {
    return console.log(err);
  }
  var parser = new Parser(scraperModel);
  var doc = parser.parse(html);

  console.log(doc);
});
