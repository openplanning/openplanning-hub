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
      doc = {},
      root = undefined;
  var $ = cheerio.load(html);

  if (typeof(this.definition.preProcess) === 'function') {
    this.definition.preProcess.call(this, $);
  }

  if (typeof(this.definition.rootNode) === 'function') {
    root = this.definition.rootNode.call(this, $);
  } else if (typeof(this.definition.rootNode) === 'string') {
    root = $(this.definition.rootNode);
  }

  if (this.definition.hasMultiple === true)
    doc.records = [];

  if (DEBUG) {
    console.log('root node found: ', root.length === 1);
  }

  $(this.definition.iterator, root).each(function () {

      var el = this;
      var match,
          rowDoc = {};
      self.definition.scraperProperties.forEach(function(scraperProperty) {
        match = $(scraperProperty.selector, el);
        if (match.length > 0) {
          //console.log('match for ' + scraperProperty.selector);
          if (self.definition.hasMultiple !== true && rowDoc[scraperProperty.key] !== undefined) {
            return;
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

    if (self.definition.hasMultiple === true && (Object.keys(rowDoc).length > 0) ) {
      doc.records.push(rowDoc);
    } else {
      // a little dangerous since it's private
      util._extend(doc, rowDoc);
    }
  });
  return doc;
};

module.exports = Parser;