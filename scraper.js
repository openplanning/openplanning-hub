var mongoose  = require('mongoose'),
    winston   = require('winston'),
    async     = require('async'),
    Planning  = require('./model/planning').model,
    moment    = require('moment'),
    _         = require('underscore'),
    scrapersList  = require('./data/scrapers.json'),
    nomnom    = require('nomnom');

var scraperConfig,
    debug = false;

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)()
  ]
});

nomnom.option('debug', {
  abbr: 'd',
  flag: true,
  help: 'Print debugging info'
});

function init(opts) {
  if (! opts.scraper) {
    console.log(nomnom.getUsage());
    process.exit();
  }
  scraperConfig = scrapersList[opts.scraper];

  scraperConfig.logger = logger;
  if (opts.debug) {
    logger.transports.console.level = 'debug';
  }
}

nomnom.command('find')
    .callback(function(opts) {
      init(opts);
      finder(opts);
    })
    .option('scraper', {
      position: 1,
      choices: _.keys(scrapersList),
      requred: true,
      help: 'Scraper key defined in data/scrapers.json'
    })
    .option('startdate', {
      position: 2,
      abbr: 'start',
      help: 'Start date in the format dd/mm/yyyy'
    })
    .option('continue', {
       flag: true
     })
    .help("Find planning application IDs");

nomnom.command('collect')
    .option('scraper', {
      position: 1,
      choices: _.keys(scrapersList),
      requred: true,
      abbr: 'scraper',
      help: 'Scraper key defined in data/scrapers.json'
    })
    .callback(function(opts) {
      init(opts);
      collector();
    });

nomnom.parse();

mongoose.connect('mongodb://localhost/landdb');

function finder(opts) {
  console.log('Using options: ', opts);
  var continueSearch = true,
      failureCount = 0;
  async.whilst(
    function() { return continueSearch; },
    function(callback) {
      continueSearch = opts.continue;
      findByWeek(opts, function(noNewRecords) {
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
}

function findByWeek(opts, finalCallback) {
    async.waterfall([
      function scrapeIDs(callback) {
        var ScraperClass = require('./scrapers/' + scraperConfig.scraper + '/main');
        var scraper = new ScraperClass(scraperConfig);
        var options = {
            searchStartDate: opts.startdate
        };
        scraper.fetchIDs(options, callback);
      },
      function saveDocs(newDocs, callback) {
        var numSaved = 0,
            numFailed = 0;
        var saveDoc = function(doc, next) {
          doc.internal_status = 0;
          doc.gss_code = scraperConfig.gss_code;
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


var fullScraper;

function scrapeFullData(doc, callback) {
  if (! fullScraper) {
    var ScraperClass = require(scraperConfig.path);
    fullScraper = new ScraperClass(scraperConfig);
  }
  async.waterfall([
    function(next) {
      fullScraper.scrapeFullData(doc, next);    
    },
    function(next) {
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

function collector() {
    async.forever(
        function(next) {
            var conditions = { 
              internal_status: 0,
              gss_code: scraperConfig.gss_code
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
              scrapeFullData(doc, next);
            });
        },
        function(err) {
          if (err.code === 'ECONNRESET' || err.code === 'ENETDOWN' || err.code === 'ENOTFOUND') {
            logger.warn('Connection issues, trying again in 2 mins.');
            setTimeout(collector, (2 * (60* 1000)));
          } else if (err.code === 'ETIMEDOUT') {
            logger.warn('Request timeout, trying again in 5 mins.');
            setTimeout(collector, (5 * (60* 1000)));
          } else if (err) {
            logger.error(err);
          } else {
            logger.info('Finished collecting IDs');
            process.exit(0);
          }
        }
    );
}

