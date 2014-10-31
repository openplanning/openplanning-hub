var fs = require('fs'),
    cheerio = require('cheerio')
    Parser = require('../parser'),
    detailModel = require('../scraper_models/brent_detail');

fs.readFile('./tests/brent-details4.html', 'utf8', function (err, html) {
  if (err) {
    return console.log(err);
  }
  var parser = new Parser(detailModel);
  var doc = parser.parse(html);
  console.log(doc);
});
