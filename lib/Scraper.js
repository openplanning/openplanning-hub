var mongoose  = require('mongoose'),
    winston   = require('winston'),
    async     = require('async'),
    Planning  = require('../model/planning').model,
    moment    = require('moment'),
    _         = require('underscore');

var logger = null;

var Scraper = function(workerScraper, laConfig, options) {
  this.worker = workerScraper;
  this.config = laConfig;
  this.options = options;

  logger = this.options.logger || winston;
};

Scraper.prototype.find = function (opts) {
  console.log('Using options: ', opts);
  var self = this,
      continueSearch = true,
      failureCount = 0;
  async.whilst(
    function() { return continueSearch; },
    function(callback) {
      continueSearch = opts.continue;
      self.findByWeek(opts, function(noNewRecords) {
        opts.startdate = moment(opts.startdate, 'DD/MM/YYYY').subtract('weeks', 1).format('DD/MM/YYYY');
        if (noNewRecords)
          failureCount++;
        var err = failureCount === 3 ? 'FAILURE_LIMIT_REACHED': null;
        callback(err);
      });
    },
    function(err) {
      if (err) {
        console.log(err);
      }
      process.exit(0);
    }
  );
};

Scraper.prototype.findByWeek = function(opts, finalCallback) {
  var self = this;
    async.waterfall([
      function scrapeIDs(callback) {
        var options = {
            searchStartDate: opts.startdate
        };
        self.worker.fetchIDs(options, callback);
      },
      function saveDocs(newDocs, callback) {
        var numSaved = 0,
            numFailed = 0;
        var saveDoc = function(doc, next) {
          doc.internal_status = 0;
          doc.gss_code = self.config.gss_code;
          Planning.create(doc, function(err) {
            if (err) {
              numFailed++;
            } else {
              numSaved++;
            }
            next(null);
          });
        };
        var finalize = function(err) {
          callback(null, numSaved, numFailed);
        }
        async.each(newDocs, saveDoc, finalize);
      }
    ], function(err, numSaved, numFailed) {
      if (err) {
        console.log(err);
      } else {
        console.log('Created %s new records (%s already exist) for week %s ', numSaved, numFailed, opts.startdate);
      }
      // Reduce load on server
      setTimeout(function() {
        finalCallback(null, numSaved === 0);
      }, 2000);
    });
}

Scraper.prototype.scrapeFullData = function(doc, callback) {
  var self = this;
  async.waterfall([
    function(next) {
      self.worker.scrapeFullData(doc, next);    
    },
    function(scrapedData, next) {

      self.mapScrapedData(doc, scrapedData);

      doc.markModified('other');  // need to tell mongoose this or else it won't save
      doc.internal_status = 1;

      logger.info('Saving update to document', {id: doc._id.toString(), ref: doc.ref });
      doc.save(next);
    },
    function(doc, numSaved, next) {
      logger.debug('Document saved', {id: doc._id.toString() });
      // Reduce load on server
      setTimeout(next, 1000);
    }
  ], callback);
}

// Here is where we do some basic sanity checks before storing the data
Scraper.prototype.mapScrapedData = function(doc, scrapedData, callback) {

  var map = [
    'title',
    'description',
    'type',
    'status',
    'decision',

    'address',
    'street',
    'village',
    'town',
    'district',
    'county',
    'postcode',
    'ward',
    'parish',
    'postcode',

    'applicant_name',
    'agent_name',
    'agent_address',

    'date_received',
    'date_valid',
    'target_date',
    'decision_date',
    'committee_date'
  ];

  doc.other = {};

  // TODO: check dates are valid
  // TODO: check we have an address

  // address OR house_name_no, street, postcode
  for (var k in scrapedData) {
    var index = map.indexOf(k);
    if (index > -1) {
      doc[k] = scrapedData[k];
    } else {
      doc.other[k] = scrapedData[k];
    }
  }
  logger.debug('Mapped fields: ', _.keys(doc.toObject()));
  logger.debug('Missing fields: ', _.difference(map, _.keys(doc.toObject())));
  logger.debug('Non-matched fields: ', _.keys(doc.other));
};

Scraper.prototype.collect = function() {
  var self = this;
    async.forever(
        function(next) {
            var conditions = { 
              internal_status: 0,
              gss_code: self.config.gss_code
            };
            logger.debug('Finding next record to process');
            Planning.findOne(conditions).sort({modified: 1}).limit(1).exec(function(err, doc) {
              if (err) {
                next(err);
                return;
              }
              if (! doc) {
                next('No more records to process');
                return;
              }
              self.scrapeFullData(doc, next);
            });
        },
        function(err) {
          if (err.code === 'ECONNRESET' || err.code === 'ENETDOWN' || err.code === 'ENOTFOUND') {
            logger.warn('Connection issues, trying again in 2 mins.');
            setTimeout(self.collect, (2 * (60* 1000)));
          } else if (err.code === 'ETIMEDOUT') {
            logger.warn('Request timeout, trying again in 5 mins.');
            setTimeout(self.collect, (5 * (60* 1000)));
          } else if (err) {
            logger.error(err);
            process.exit(1);
          } else {
            logger.info('Finished collecting IDs');
            process.exit(0);
          }
        }
    );
}

module.exports = Scraper;