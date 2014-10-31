var fs = require('fs'),
    cheerio = require('cheerio')
    Parser = require('../parser');

var scraperDefinition = {
  iterator: 'tbody tr',
  hasMultiple: true,
  scraperProperties: [
  {
    key: 'title',
    selector: "td:nth-child(2)",
  },
  {
    key: 'planning_ref',
    selector: "input",
    selector_attr: 'value'
  }
  ]
};
var outputDocument = {};

fs.readFile('./tests/civica-list.html', 'utf8', function (err, html) {
  if (err) {
    return console.log(err);
  }
  var parser = new Parser(scraperDefinition);
  var doc = parser.parse(html);

  var $ = cheerio.load(html);

  console.log('num pages', $('.scroller:first-of-type td').length -4);

  var formData = Parser.parseForm('#_id123', html);

  console.log(doc);
  console.log(formData);

});
