var request = require('request'),
    winston = require('winston'),
    cheerio = require('cheerio'),
    async   = require('async'),
    moment = require('moment'),
    util  = require('util'),
    qs      = require('querystring'),
    Parser = require('../parser'),
    scraperListModel = require('../scraper_models/brent_list'),
    scraperDetailModel = require('../scraper_models/brent_detail');

var Scraper = function(options) {
  this.logger = options.logger || winston;
  this.baseURL = options.base_url;
  this.searchFormPath = '/ep.ext?extId=769119&byPeriod=Y&st=&periodUnits=day&periodMultiples=14&byOther1=Y&other1List=Development_types&other1Label=Development%20type&byStreet=Y&byOther2=Y&other2Label=Status&other2List=Application_status';
  this.searchFormSelector = '#NonStopGov';
  this.planningPageURL = this.baseURL + '/ep.ext?extId=101150&reference=%s&st=PL&print=Y';
  this.cookieJar = null;
  this.formInfo = null;
  this.planningIds = [];
};

Scraper.prototype.init = function(callback) {
  var self = this;
  async.waterfall([
    function requestSearchFrom(next) {
      self.cookieJar = request.jar();
      request.get({ url: self.baseURL + self.searchFormPath, jar: self.cookieJar }, next);
    },
    function parseForm(response, body, next) {
      self.formInfo = Parser.parseForm(self.searchFormSelector, body);
      next(null);
    }
  ], callback);
};

Scraper.prototype.scrapeFullData = function(doc, callback) {

  var self = this;
  var pageURL = util.format(this.planningPageURL, doc.local_id);

  console.log('pageURL', pageURL);

  this.logger.debug('GET request', {id: doc._id.toString() });
  request.get({
    uri: pageURL,
    gzip: true,
    jar: this.cookieJar,
    timeout: (20 * 1000),
    headers: {
      'Referer' : this.baseURL + this.searchFormPath,
      'User-Agent': 'Linux Mozilla'
    }
    }, function(err, response, body) {
      self.logger.debug('Received response from GET', {id: doc._id.toString() });
      if (err)
        return callback(err);
      if (response.statusCode !== 200)
        return callback('Received status code ' + response.statusCode);

      var parser = new Parser(scraperDetailModel);
      var parsedData = parser.parse(body);

      doc.title = parsedData.title;
      doc.type = Scraper.getType(parsedData.type);
      
      doc.address = parsedData.address;
      doc.postcode = parsedData.postcode;

      doc.applicant_name = parsedData.applicant_name;
      doc.agent_name = parsedData.agent_name;
      doc.agent_address = parsedData.agent_address;

      doc.date_received = Scraper.cleanDate(parsedData.date_received);
      doc.decision = parsedData.decision;
      doc.decision_date = Scraper.cleanDate(parsedData.decision_date);

      doc.other = {
        original_type: parsedData.type,
        current_status: parsedData.current_status,
        case_officer: parsedData.case_officer,
        applicant_address: parsedData.applicant_address,
        certificate: parsedData.certificate
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
      formInfo = editSearchForm(formInfo);

      //console.log('Requesting results page');
      request.post({
        headers: {
          'Content-Type' : 'application/x-www-form-urlencoded',
          'User-Agent': 'Linux Mozilla'
        },
        uri: self.baseURL + self.searchFormPath,
        jar: self.cookieJar,
        gzip: true,
        body: qs.stringify(formInfo.data)
      }, callback);
    },
    function processResponse(response, body, next) {
      if (response.statusCode == 302 && response.headers.location) {
        request.get({
          uri: self.baseURL + response.headers.location,
          gzip: true,
          jar: self.cookieJar,
          headers: {
            'Referer' : self.baseURL + self.searchFormPath,
            'User-Agent': 'Linux Mozilla'
          }
          }, function(err, response, body) {
            next(null, body);
        });
      } else {
        next(null, body)  
      }
    }
  ], function(err, body) {
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

        formInfo.data['from'] = searchStartDate.format('DD/MM/YYYY');
        formInfo.data['until'] = searchEndDate.format('DD/MM/YYYY');
        formInfo.data['other1'] = '%';
        formInfo.data['other2'] = '%';

        return formInfo;
      };

      self.search(editSearchForm, callback);
    },
    function parseResults(body, callback) {
      //console.log('body', body);
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

Scraper.prototype.parsePlanningIDs = function(body, callback, options) {
    options = options || {
      followNextLinks: true
    };
    var self = this;
    var parser = new Parser(scraperListModel);
    var doc = parser.parse(body);
    self.planningIds = self.planningIds.concat(doc.records);

    callback(null, []);
}

Scraper.getType = function(type) {
  switch(type) {
    case 'Full Planning Permission': 
      return 'Full';
    case 'Outline Planning Permission':
      return 'Outline';
    case 'Change of Use':
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
  if (typeof(dateStr) === 'string')
    dateStr = dateStr.trim();
  var d = moment(dateStr, "DD/MM/YYYY");
  if (! d.isValid())
    return null;
  return d.toDate();
};

module.exports = Scraper;
