var fs = require('fs'),
    cheerio = require('cheerio')
    Parser = require('../parser');

var scraperDefinition = {
  iterator: '#casefilesummary',
  scraperProperties: [
  {
    key: 'location',
    selector: "#locationbreak"
  },
  {
    key: 'title',
    selector: "#development + td"
  },
  {
    key: 'ward',
    selector: "#parish + td"
  },
  {
    key: 'case_officier',
    selector: "#caseofficer + td"
  },
  {
    key: 'applicant_name',
    selector: "#applicant + td"
  },
  // {
  //   key: 'house_name_no',
  //   selector: "td:contains('House Name/Number') + td"
  // },
  // {
  //   key: 'street',
  //   selector: "td:contains('Road') + td"
  // },
  // {
  //   key: 'village',
  //   selector: "td:contains('Village') + td"
  // },
  // {
  //   key: 'town',
  //   selector: "td:contains('Town') + td"
  // },
  // {
  //   key: 'postcode',
  //   selector: "td:contains('Postcode') + td"
  // },
  // {
  //   key: 'parish',
  //   selector: "td:contains('Parish') + td"
  // },


  // {
  //   key: 'agent_name',
  //   selector: "td:contains('Agent Name') + td"
  // },
  // {
  //   key: 'agent_address',
  //   selector: "td:contains('Agent Address') + td"
  // },
  // {
  //   key: 'date_received',
  //   selector: "td:contains('Date Received') + td"
  // },
  // {
  //   key: 'date_valid',
  //   selector: "td:contains('Date Valid') + td"
  // },
  // {
  //   key: 'target_date',
  //   selector: "td:contains('Target Date') + td"
  // },
  // {
  //   key: 'fee_received',
  //   selector: "td:contains('Fee Received') + td"
  // },

  // {
  //   key: 'decision',
  //   selector: "tr:nth-child(12) td + td"
  // },
  // {
  //   key: 'type',
  //   selector: "tr:nth-child(13) td + td"
  // },
  // {
  //   key: 'app_type_other',
  //   selector: "tr:nth-child(10) td + td"
  // },
  // {
  //   key: 'decision_date',
  //   selector: "td:contains('Decision Date') + td"
  // },
  // {
  //   key: 'committee_date',
  //   selector: "td:contains('Committee Date') + td"
  // }
  ]
};
var outputDocument = {};

fs.readFile('./tests/wam-details.html', 'utf8', function (err, html) {
  if (err) {
    return console.log(err);
  }
  var parser = new Parser(scraperDefinition);
  var doc = parser.parse(html);

  console.log(doc);

});
