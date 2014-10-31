module.exports = {
  "iterator": "table.display_table tr",
  "hasMultiple": true,
  "preProcess": function($) {
    // remove table header to prevent empty row
    $(this.definition.iterator).first().remove();
  },
  "scraperProperties": [
    {
      "key": "ref",
      "selector": ".TableData",
    },
    {
      "key": "local_id",
      "selector": ".TableData",
      "regex": /(\d+)/gi
    }
  ]
};