#!/usr/bin/env node

var mongoose  = require('mongoose'),
    winston   = require('winston'),
    _         = require('underscore'),
    Scraper   = require('../lib/Scraper'),
    nomnom    = require('nomnom'),
    util      = require('util'),
    path      = require('path');

var planningAuthorities;
try {
  planningAuthorities  = require(path.resolve(process.cwd()) + '/planningauthorities.json');
} catch(e) {
  console.log('Cannot find planningauthorities.json');
}

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

function createScraper(opts) {
  if (! opts.planningAuthorityKey) {
    console.log(nomnom.getUsage());
    process.exit();
  }
  var laConfig = planningAuthorities[opts.planningAuthorityKey];

  opts.logger = logger;
  if (opts.debug) {
    logger.transports.console.level = 'debug';
  }
  
  try {
    //console.log('path', path.resolve(process.cwd()) + '/main.js');
    var ChildScraper = require(path.resolve(process.cwd()) + '/main.js');
  } catch(e) {
    console.log('Cannot find main.js', e);
    process.exit(1);
  }
  var childScraper = new ChildScraper(laConfig);

  var scraper = new Scraper(childScraper, laConfig, opts);
  return scraper;
}

nomnom.command('find')
    .callback(function(opts) {
      var scraper = createScraper(opts);
      scraper.find(opts);
    })
    .option('planningAuthorityKey', {
      position: 1,
      choices: _.keys(planningAuthorities),
      requred: true,
      help: 'Planning Authority key defined in planningAuthorities.json'
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
    .option('planningAuthorityKey', {
      position: 1,
      choices: _.keys(planningAuthorities),
      requred: true,
      help: 'Planning Authority key defined in planningAuthorities.json'
    })
    .callback(function(opts) {
      var scraper = createScraper(opts);
      scraper.collect();
    });

nomnom.parse();

mongoose.connect('mongodb://localhost/landdb');



