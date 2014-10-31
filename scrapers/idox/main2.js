var request = require('request')
  , cheerio = require('cheerio')
  , async = require('async')
  , format = require('util').format;

var baseURL = 'https://searchapplications.bromley.gov.uk/onlineapplications';
var formURL = '/advancedSearchResults.do?action=firstPage';

var descriptionTemplate = {
  key: 'description',
  template: '<th scope="row" width="40%">*Proposal*</th><td>{{description}}</td>'
};


async.waterfall([
  // function submitInspireForm(callback) {
  //   var formURL = '/advancedSearchResults.do?action=firstPage';

  //   // submit form
  //   console.log('reqesting %s', baseURL + formURL);
  //   request.post({
  //     headers: {'content-type' : 'application/x-www-form-urlencoded'},
  //     url:     baseURL + formURL,
  //     body:    "searchCriteria.resultsPerPage=100&date(applicationReceivedStart)=07/07/2014&searchType=Application" 
  //   }, callback);

  //   //callback();
  // }
  // ,function parsePage(response, body, callback) {
  //   var $ = cheerio.load(body);
  //   var planningRefs = [];

  //   $('li.searchresult').each(function () {

  //     // $('a', this).each(function() {
  //     //   console.log('title', $(this).html());
  //     //   console.log('link', $(this).attr('href'));
  //     // });
  //     //console.log('address', $('p.address', this).text());

  //     var metaInfo = $('p.metaInfo', this).text();
  //     // remove line breaks
  //     metaInfo = metaInfo.replace(/(\r\n|\n|\r)/gm,'');

  //     // (Ref. No: {{planningRef}} |
  //     var matchGroup = metaInfo.match(/(Ref. No:[\s]*)(\S*)[\s]*\|/i);
  //     var planningRef = (matchGroup && matchGroup.length > 2) ? matchGroup[2] : '';

  //     console.log('planning ID', planningRef);
  //     planningRefs.push(planningRef);
  //   });

  //   callback(planningRefs);
  // },
  function temp(callback) {
    callback(null, ['14/02744/HHPA']);
  },
  function requestEachPage(planningRefs, callback) {

    var requestPage = function(item, callback) {

      
      console.log('requesting page', (baseURL + formURL));
      request.post({
        headers: {'content-type' : 'application/x-www-form-urlencoded'},
        url:     baseURL + formURL,
        body:    "searchType=Application&searchCriteria.reference=" + item
      }, function(err, response, body) {
        console.log('Page response', body);

          var $ = cheerio.load(body);
          $('#simpleDetailsTable tr').each(function () {
            console.log('row', $(this).html());
          });

      });
    };

    async.eachLimit(planningRefs, 2, requestPage, callback);
  }
], function() {

});

function scrapePlanningPage(planningRef, callback) {



}

