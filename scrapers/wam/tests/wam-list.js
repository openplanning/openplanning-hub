var fs = require('fs'),
    cheerio = require('cheerio')
    Parser = require('../parser');

var scraperDefinition = {
  iterator: '#searchresults tbody tr',
  hasMultiple: true,
  scraperProperties: [
    {
      key: 'planning_ref',
      selector: "td:nth-child(2)",
    }
  ],
  preProcess: function($) {
    // remove table header to prevent empty row
    $(this.definition.iterator).first().remove();
  }
};
var outputDocument = {};

fs.readFile('./tests/wam-list.html', 'utf8', function (err, html) {
  if (err) {
    return console.log(err);
  }
  var parser = new Parser(scraperDefinition);
  var doc = parser.parse(html);

  console.log(doc);
});