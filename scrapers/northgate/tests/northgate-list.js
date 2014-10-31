var fs = require('fs'),
    cheerio = require('cheerio')
    Parser = require('../parser'),
    scraperModel = require('../scraper_models/northgate_list');

fs.readFile('./tests/northgate-list.html', 'utf8', function (err, html) {
  if (err) {
    return console.log(err);
  }
  var parser = new Parser(scraperModel);
  var doc = parser.parse(html);

  var $ = cheerio.load(html);

  console.log('has next page', $('.dataview .align_center .results_page_number_sel +a').length > 0);
  console.log('next link', $('.dataview .align_center .results_page_number_sel +a').attr('href'));

  console.log(doc);
});