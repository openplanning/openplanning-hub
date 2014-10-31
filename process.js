var mongoose = require('mongoose'),
    Planning = require('./model/planning').model,
    moment = require('moment'),
    _ = require('underscore'),
    async = require('async');

async.waterfall([
  function mongoConnect(callback) {
    mongoose.connect('mongodb://localhost/landdb');
    var db = mongoose.connection;
    db.on('error', callback);
    db.once('open', callback);
  }, 
  function batchProcessRecords(callback) {
    var count = 0;
    async.forever(
      function(next) {
        var fields = 'title date_received house_name_no street postcode x_coordinate y_coordinate';
        var conditions = {
          internal_status: 2
        };
        var query = Planning.find(conditions, fields).limit(50);
        query.exec(function(err, records) {
          if (err)
            return next('Could not find planning records');

          if (records.length === 0) {
            next('Completed processing all records');
            return;
          }

          var updateRecord = function(record, cb) {
            record.tags = getTags(record).join(' ');
            record.num_dwellings = getApproxNumDwellings(record.title);
            record.internal_status = 4;
            console.log('%s saving %s with num_dwellings %s', ++count, record._id, record.num_dwellings);
            record.save(cb);
          };

          async.each(records, updateRecord, function(err) {
            if (err)
              console.log('err', err);
            next(err);
          });
        });
      },
      callback
    );
  }
],
function(err) {
  if (err)
    console.log(err);
  console.log('All done');
  process.exit(0);
});

function getDateReceived(date) {
  if (! date)
    return null;
  return moment(date).format('YYYYMMDD');
}

function getApproxNumDwellings(title) {

  if (! isDwelling(title)) {
    return 0;
  }
  title = title.toLowerCase();

  if (title.indexOf('dwelling') > -1) {
    if (title.indexOf('dwellings') === -1) {
      return 1;
    }
  } else {
    return 0;
  }

  // Find the word dwellings
  // Remove any occurances of number of bed
  title = title.replace(/\d[\D]+(bedroom|bed)/i, '');

  // Remove odd occurances of "the dwellings" and "of dwellings"
  title = title.replace(/(of|the) dwellings/g, '');

  // Alternative plural cases
  title = title.replace('dwellinghouses', 'dwellings');
  title = title.replace('dwelling houses', 'dwellings');

  // Replace text numbers
  title = title.replace(/one/gi, '1');
  title = title.replace(/two/gi, '2');
  title = title.replace(/three/gi, '3');
  title = title.replace(/four/gi, '4');
  title = title.replace(/five/gi, '5');
  title = title.replace(/six/gi, '6');
  title = title.replace(/seven/gi, '7');
  title = title.replace(/eight/gi, '8');
  title = title.replace(/nine/gi, '9');
  title = title.replace(/ten/gi, '10');

  // Remove commas eg. (1,700 dwellings)
  title = title.replace(/,/g, '');

  // Only use text before the word "dwellings"
  title = title.substr(0, title.indexOf('dwellings'));

  // Find the first occurance of a digit before the word "dwellings"
  var numbers = title.match(/\d+/g);

  if (numbers === null) {
    return 1;
  }
  return numbers.pop();
}

function isDwelling(title) {
  return (title.match(/dwelling/i) !== null);
}

function getTags(record) {
  var tags = [];

  if (isDwelling(record.title))
    tags.push('dwelling');

  return tags;
}

function getTitle(title) {
  if (title.length > 80) {
    return title.substr(0, 80) + '...';
  }
  return title;
}

function getDescription(record) {
  return [record.house_name_no, record.street, record.postcode].join(', ');
}
