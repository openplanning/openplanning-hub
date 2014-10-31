var request = require('request'),
    winston = require('winston'),
    cheerio = require('cheerio'),
    async   = require('async'),
    moment = require('moment'),
    util  = require('util'),
    qs      = require('querystring'),
    Parser = require('../parser'),
    scraperListModel = require('../scraper_models/northgate_list'),
    scraperDetailModel = require('../scraper_models/northgate_detail'),
    scraperDetailProgressModel = require('../scraper_models/northgate_progress');

var Scraper = function(options) {
  this.logger = options.logger || winston;
  this.baseURL = 'http://apps.hackney.gov.uk';
  this.searchFormPath = '/servapps/Northgate/PlanningExplorer/generalsearch.aspx';
  this.planningPageURL = this.baseURL + '/servapps/Northgate/PlanningExplorer/Generic/StdDetails.aspx?PT=Planning%20Applications%20On-Line&TYPE=PL/PlanningPK.xml&PARAM0=%s&XSLT=/servapps/Northgate/PlanningExplorer/SiteFiles/Skins/Hackney/xslt/PL/PLDetails.xslt&FT=Planning%20Application%20Details&PUBLIC=Y&XMLSIDE=/servapps/Northgate/PlanningExplorer/SiteFiles/Skins/Hackney/Menus/PL.xml&DAURI=PLANNING';
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
      self.formInfo = Parser.parseForm('#M3Form', body);
      next(null);
    }
  ], callback);
};

Scraper.prototype.scrapeFullData = function(doc, callback) {

  var self = this;
  var pageURL = util.format(this.planningPageURL, doc.local_id);

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
      doc.ward = parsedData.ward;
      doc.parish = parsedData.parish;
      doc.district = parsedData.district;

      doc.applicant_name = parsedData.applicant_name;
      doc.agent_name = parsedData.agent_name;
      doc.agent_address = parsedData.agent_address;

      doc.other = {
        dev_type: parsedData.dev_type,
        current_status: parsedData.current_status,
        location_coordinates: parsedData.location_coordinates,
        case_officer: parsedData.case_officer,
        planning_officer: parsedData.planning_officer,
        division: parsedData.division,
        determination_level: parsedData.determination_level,
        existing_land_use: parsedData.existing_land_use,
        proposed_land_use: parsedData.proposed_land_use
      };

      parser = new Parser(scraperDetailProgressModel);
      parsedData = parser.parse(body);

      doc.date_received = Scraper.cleanDate(parsedData.date_received);
      doc.decision = parsedData.decision;
      doc.committee_date = Scraper.cleanDate(parsedData.committee_date);

      doc.other.date_consultation_end = Scraper.cleanDate(parsedData.date_consultation_end);
      doc.other.appeal_lodged = parsedData.appeal_lodged;
      doc.other.appeal_decision = parsedData.appeal_decision;

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

      console.log('Requesting results page');
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

        formInfo.data['cboSelectDateValue'] = 'DATE_RECEIVED';
        formInfo.data['cboMonths'] = '1';
        formInfo.data['cboDays'] = '1';
        formInfo.data['rbGroup'] = 'rbRange';
        formInfo.data['dateStart'] = searchStartDate.format('DD/MM/YYYY');;
        formInfo.data['dateEnd'] = searchEndDate.format('DD/MM/YYYY');
        formInfo.data['csbtnSearch'] = 'Search';

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
  var nextLink = $('.dataview .align_center .results_page_number_sel +a').attr('href');
  var records = [];
  if (! nextLink) {
    return callback(null, records);
  }
  request.get({
    headers: {
      'Content-Type' : 'application/x-www-form-urlencoded',
      'User-Agent': 'Linux Mozilla'
    },
    uri: self.baseURL + '/servapps/Northgate/PlanningExplorer/Generic/' + nextLink,
    jar: self.cookieJar,
    gzip: true
  }, function(err, response, body) {
    if (err)
      return callback(err);
    self.parsePlanningIDs(body, callback, { followNextLinks: true });
  });
}

Scraper.prototype.parsePlanningIDs = function(body, callback, options) {
    options = options || {
      followNextLinks: true
    };
    var self = this;
    var parser = new Parser(scraperListModel);
    var doc = parser.parse(body);
    self.planningIds = self.planningIds.concat(doc.records);

    if (options.followNextLinks) {
      var $ = cheerio.load(body);
      var hasNextLink = $('.dataview .align_center .results_page_number_sel +a').length > 0;
      if (hasNextLink) {
        self.doNextSearch(body, callback);
        return;
      }
    }
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
