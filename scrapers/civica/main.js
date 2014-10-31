var request = require('request'),
    cheerio = require('cheerio'),
    async   = require('async'),
    moment = require('moment'),
    format  = require('util').format,
    qs      = require('querystring'),
    Parser = require('../parser');

var planningDetailsParser = {
  iterator: 'tbody tr',
  scraperProperties: [
  {
    key: 'house_name_no',
    selector: "td:contains('House Name/Number') + td"
  },
  {
    key: 'street',
    selector: "td:contains('Road') + td"
  },
  {
    key: 'village',
    selector: "td:contains('Village') + td"
  },
  {
    key: 'town',
    selector: "td:contains('Town') + td"
  },
  {
    key: 'postcode',
    selector: "td:contains('Postcode') + td"
  },
  {
    key: 'parish',
    selector: "td:contains('Parish') + td"
  },
  {
    key: 'ward',
    selector: "td:contains('Ward') + td"
  },
  {
    key: 'title',
    selector: "td:contains('Proposal') + td"
  },
  {
    key: 'applicant_name',
    selector: "td:contains('Applicant Name') + td"
  },
  {
    key: 'agent_name',
    selector: "td:contains('Agent Name') + td"
  },
  {
    key: 'agent_address',
    selector: "td:contains('Agent Address') + td"
  },
  {
    key: 'date_received',
    selector: "td:contains('Date Received') + td"
  },
  {
    key: 'date_valid',
    selector: "td:contains('Date Valid') + td"
  },
  {
    key: 'target_date',
    selector: "td:contains('Target Date') + td"
  },
  {
    key: 'fee_received',
    selector: "td:contains('Fee Received') + td"
  },
  {
    key: 'case_officier',
    selector: "td:contains('Case Officer') + td"
  },
  {
    key: 'decision',
    selector: "tr:nth-child(12) td + td"
  },
  {
    key: 'type',
    selector: "tr:nth-child(13) td + td"
  },
  {
    key: 'app_type_other',
    selector: "tr:nth-child(10) td + td"
  },
  {
    key: 'decision_date',
    selector: "td:contains('Decision Date') + td"
  },
  {
    key: 'committee_date',
    selector: "td:contains('Committee Date') + td"
  }
  ]
};

var Scraper = function(options) {
  this.baseURL = 'http://planning.northamptonboroughcouncil.com';
  this.requiredRequestPath = '/Planning/_javascriptDetector_?goto=/Planning/lg/GFPlanningWelcome.page';
  this.searchFormPath = '/Planning/lg/GFPlanningSearch.page?org.apache.shale.dialog.DIALOG_NAME=gfplanningsearch&Param=lg.Planning';
  this.searchPath = '/Planning/lg/GFPlanningSearch.page';
  this.cookieJar = null;
  this.formInfo = null;
  this.planningIds = [];
};

Scraper.prototype.init = function(callback) {
  console.log('init scraper');
  var self = this;
  async.waterfall([
    function initSession(next) {
      self.cookieJar = request.jar();
      // This request is necessary. Very odd. This is for non-JS browsers.
      request.get({ url: self.baseURL + self.requiredRequestPath, jar: self.cookieJar }, next);
    },
    function requestSearchFrom(response, body, next) {
      console.log('requestSearchFrom');
      request.get({ url: self.baseURL + self.searchFormPath, jar: self.cookieJar }, next);
    },
    function parseForm(response, body, next) {
      self.formInfo = Parser.parseForm('#_id122', body);
      next(null);
    }
  ], callback);
};

Scraper.prototype.scrapeFullData = function(doc, callback) {

  var editSearchForm = function(formInfo) {
    formInfo.data['_id122:_id180'] = 'Search';
    formInfo.data['_id122:SDescription'] = doc.ref;
    return formInfo;
  };

  this.search(editSearchForm, function(err, body) {
    var parser = new Parser(planningDetailsParser);
    var parsedData = parser.parse(body);

    doc.title = parsedData.title;
    //doc.description = parsedData.foo;
    doc.type = Scraper.getType(parsedData.type);
    // location
    doc.house_name_no = parsedData.house_name_no;
    doc.street = parsedData.street;
    doc.village = Scraper.cleanText(parsedData.village);
    doc.town = parsedData.town;
    doc.ward = parsedData.ward;
    doc.county = 'Northamptonshire';
    doc.postcode = parsedData.postcode;

    doc.applicant_name = parsedData.applicant_name;
    doc.agent_name = parsedData.agent_name;
    doc.agent_address = parsedData.agent_address;

    doc.date_received = Scraper.cleanDate(parsedData.date_received);
    doc.date_valid = Scraper.cleanDate(parsedData.date_valid);
    doc.target_date = Scraper.cleanDate(parsedData.target_date);
    
    doc.decision = parsedData.decision;
    doc.decision_date = Scraper.cleanDate(parsedData.decision_date);
    doc.committee_date = Scraper.cleanDate(parsedData.committee_date);

    doc.other = {
      fee_received: parsedData.fee_received,
      case_officier: parsedData.case_officier,
      original_type: parsedData.type
    };

    callback(err);
  });
};

Scraper.prototype.search = function(editSearchForm, next) {
  var self = this;

  async.waterfall([
    function initSession(callback) {
      if (self.formInfo === null) {
        self.init(callback);
      } else {
        process.nextTick(callback);
      }
    },
    function doSearch(callback) {

      var formInfo = self.formInfo;
      // Clean-up form variables.
      delete formInfo.data['_id122:_id180'];
      delete formInfo.data['_id122_SUBMIT'];
      formInfo.data['_id122:_id180'] = 'Search';
      formInfo.data['_id122_SUBMIT'] = '1';
      formInfo.data['_id122:_idcl'] = '';
      formInfo.data['_id122:_link_hidden_'] = '';

      formInfo = editSearchForm(formInfo);

      console.log('Requesting results page');
      request.post({
        headers: {
          'Content-Type' : 'application/x-www-form-urlencoded',
          'User-Agent': 'Linux Mozilla'
        },
        uri: self.baseURL + self.searchPath,
        jar: self.cookieJar,
        gzip: true,
        body: qs.stringify(formInfo.data)
      }, callback);
    }
  ], function(err, response, body) {
    if (err)
      console.log(err);
    next(err, body);
  });
};

Scraper.prototype.fetchIDs = function(searchCriteria, next) {

  if (! searchCriteria.searchStartDate)
    return next('Search start date is required');

  var self = this;
  var searchStartDate = moment(searchCriteria.searchStartDate, "DD/MM/YYYY");
  var searchEndDate = moment(searchStartDate).add('days', 7);

  async.waterfall([
    function doSearch(callback) {

      var editSearchForm = function(formInfo) {
        // Edit form vars
        formInfo.data['_id122:SDate1From'] = searchStartDate.format('DD/MM/YYYY');
        formInfo.data['_id122:SDate1To'] = searchEndDate.format('DD/MM/YYYY');

        // Some forms vars missing - added via JavaScript
        formInfo.data['_id122:SDate3From'] = 'dd/mm/yyyy';
        formInfo.data['_id122:SDate3To'] = 'dd/mm/yyyy';

        return formInfo;
      };

      self.search(editSearchForm, callback);
    },
    function parseResults(body, callback) {
      self.parsePlanningIDs(body, callback);
    },
    function addNewPlanningIDs(nextPlanningIds, callback) {
      self.planningIds.concat(nextPlanningIds);
      callback(null);
    }
  ], function(err) {
    if (err)
      console.log(err);
    next(err, self.planningIds);
  });

};

Scraper.prototype.doNextSearch = function(body, callback) {

  var self = this;
  var $ = cheerio.load(body);
  var numPages = $('.scroller:first-of-type td').length-4;
  var currentPage = 1;
  var records = [];
  var pagingForm = Parser.parseForm('#_id123', body);

  async.whilst(
      function () { return currentPage < numPages; },
      function (callback) {
          currentPage++;

          pagingForm.data['_id123_SUBMIT'] = '1';
          pagingForm.data['_id123:scroll_1'] = 'idx' + currentPage;
          pagingForm.data['_id123:_idcl'] = '_id123:scroll_1idx' + currentPage;

          console.log('Requesting results page %s', currentPage);
          request.post({
            headers: {
              'Content-Type' : 'application/x-www-form-urlencoded',
              'User-Agent': 'Linux Mozilla'
            },
            uri: self.baseURL + pagingForm.action,
            jar: self.cookieJar,
            gzip: true,
            body: qs.stringify(pagingForm.data)
          }, function(err, response, body) {
            if (err)
              return callback(err);
            self.parsePlanningIDs(body, callback, { followNextLinks: false });
          });  

      },
      function (err) {
          callback(err, records);
      }
  );
}

Scraper.prototype.parsePlanningIDs = function(body, callback, options) {
    options = options || {
      followNextLinks: true
    };
    var self = this;

    var scraperDefinition = {
      iterator: 'tbody tr',
      hasMultiple: true,
      scraperProperties: [
      {
        key: 'ref',
        selector: "input",
        selector_attr: 'value'
      }
      ]
    };
    var parser = new Parser(scraperDefinition);
    var doc = parser.parse(body);
    self.planningIds = self.planningIds.concat(doc.records);

    if (options.followNextLinks) {
      var $ = cheerio.load(body);
      if ($('.scroller').length > 0) {
        self.doNextSearch(body, callback);
        return;
      }
    }
    callback(null, []);
}

Scraper.getType = function(type) {
  switch(type) {
    case 'FULL APPLICATION': 
      return 'Full';
    case 'OUTLINE APPLICATION':
      return 'Outline';
    case 'CHANGE OF USE':
      return 'Change of use';
    default:
      console.log('Warning, planning type not found', type);
  }
  return 'OTHER';
};

Scraper.cleanText = function(text) {
  if (text == '-')
    return null;
  return text;
};

Scraper.cleanDate = function(dateStr) {
  if (dateStr.length === 0)
    return null;
  return moment(dateStr, "DD/MM/YYYY").toDate();
};

module.exports = Scraper;
