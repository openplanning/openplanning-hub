var fs = require('fs'),
    cheerio = require('cheerio')
    Parser = require('../parser'),
    detailModel = require('../scraper_models/northgate_detail'),
    progressModel = require('../scraper_models/northgate_progress');

fs.readFile('./tests/northgate-details.html', 'utf8', function (err, html) {
  if (err) {
    return console.log(err);
  }
  var parser = new Parser(detailModel);
  var doc = parser.parse(html);
  console.log(doc);

  var parser = new Parser(progressModel);
  var doc = parser.parse(html);
  console.log(doc);
});
