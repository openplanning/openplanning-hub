var fs = require('fs'),
    cheerio = require('cheerio')
    Parser = require('../parser');


var outputDocument = {};

fs.readFile('./tests/civica-search.html', 'utf8', function (err, html) {
  if (err) {
    return console.log(err);
  }
  
  var $ = cheerio.load(html);

  var formData = {};
  $('#_id122 input').each(function() {

    var key = $(this).attr('name');
    var type = $(this).attr('type');
    if (key !== undefined && type !== 'submit')
      formData[key] = $(this).attr('value');
  });

  formData['_id122:_id180'] = 'Search';

  //console.log(doc);
  console.log(formData);

});
