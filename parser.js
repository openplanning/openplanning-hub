var cheerio = require('cheerio'),
    util = require('util');

var NODE_DEBUG = process.env.NODE_DEBUG || '';
var DEBUG = NODE_DEBUG.split(',').indexOf('parser') > -1;

function Parser(definition) {
  this.definition = definition;
};

Parser.parseForm = function(formSelector, html) {
  var $ = cheerio.load(html);
  var formData = {};
  $(formSelector + ' input').each(function() {
    var key = $(this).attr('name');
    var type = $(this).attr('type');
    if (key !== undefined && type !== 'submit')
      formData[key] = $(this).attr('value');
    if (formData[key] === undefined) {
      formData[key] = '';
    }
  });
  return {
    action: $(formSelector).attr('action'),
    data: formData
  };
}

Parser.prototype.parse = function(html) {
  var self = this,
      scraperDefinition = this.definition;
  var $ = cheerio.load(html);

  var models = [];
  if (! (scraperDefinition instanceof Array)) {
    models.push(scraperDefinition);
  } else {
    models = scraperDefinition;
  }
  
  var doc = {};
  models.forEach(function(model) {
    self._parse(model, $, doc);
  });
  return doc;
};

Parser.prototype._parse = function(model, $, doc) {

  var self = this;

  if (typeof(model.preProcess) === 'function') {
    model.preProcess.call(this, $);
  }

  var root = undefined;
  if (typeof(model.rootNode) === 'function') {
    root = model.rootNode.call(this, $);
  } else if (typeof(model.rootNode) === 'string') {
    root = $(model.rootNode);
  }

  if (model.hasMultiple === true && doc.records === undefined)
    doc.records = [];

  if (DEBUG) {
    console.log('root node found: ', root.length === 1);
  }

  var iterator;
  if (model.iterator) {
    iterator = $(model.iterator, root);
  } else {
    iterator = $(root);
  }

  iterator.each(function () {

      var el = this;
      var match,
          rowDoc = {};
      model.scraperProperties.forEach(function(scraperProperty) {
        match = $(scraperProperty.selector, el);
        if (match.length > 0) {

          if (DEBUG) {
            console.log('%s matches found for %s', match.length, scraperProperty.key);
          }

          //console.log('match for ' + scraperProperty.selector);
          if (model.hasMultiple !== true && rowDoc[scraperProperty.key] !== undefined) {
            return;
          }
          if (typeof(scraperProperty.selectIndex) === 'number') {
            //console.log('match', match);
            match = $(match.get(scraperProperty.selectIndex));
          }
          if (scraperProperty.selector_attr !== undefined) {
            rowDoc[scraperProperty.key] = match.attr(scraperProperty.selector_attr).trim();
          } else if (typeof(scraperProperty.selectValue) === 'function') {
            rowDoc[scraperProperty.key] = scraperProperty.selectValue.call(self, match);
          } else if (scraperProperty.regex !== undefined) {
            
            //var matchText = match.html().replace(/(\r\n|\n|\r)/gm,'');
            var matchText = match.html();
            if (DEBUG) {
              console.log('Attempting to match text ', matchText);
            }

            if (scraperProperty.debug)
              console.log('HTML found by %s selector: ', scraperProperty.key, matchText);
            var regexMatches = matchText.match(scraperProperty.regex);
            
            if (regexMatches && regexMatches.length > 1)
              rowDoc[scraperProperty.key] = regexMatches[1];
          } else {
            rowDoc[scraperProperty.key] = match.text().trim();
          }
        }
      });

    if (model.hasMultiple === true && (Object.keys(rowDoc).length > 0) ) {
      doc.records.push(rowDoc);
    } else {
      // a little dangerous since it's private
      util._extend(doc, rowDoc);
    }
  });
};

module.exports = Parser;