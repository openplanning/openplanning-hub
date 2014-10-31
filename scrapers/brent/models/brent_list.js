module.exports = {
  "iterator": "#detailsDiv div",
  "hasMultiple": true,
  "preProcess": function($) {
    // remove table header to prevent empty row
    //$(this.definition.iterator).first().remove();
  },
  "scraperProperties": [
    {
      "key": "ref",
      "selector": "strong a"
    },
    {
      "key": "local_id",
      "selector": "strong",
      "regex": /(\d+)/gi
    }
  ]
};