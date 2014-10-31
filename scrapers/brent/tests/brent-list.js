var fs = require('fs'),
    cheerio = require('cheerio')
    Parser = require('../parser'),
    scraperModel = require('../scraper_models/brent_list');

fs.readFile('./tests/brent-list.html', 'utf8', function (err, html) {
  if (err) {
    return console.log(err);
  }
  var parser = new Parser(scraperModel);

  console.log(parser.parse(html));
});