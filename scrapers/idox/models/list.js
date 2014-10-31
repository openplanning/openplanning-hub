module.exports = {
  "rootNode": "#searchresults",
  "iterator": "li",
  "hasMultiple": true,
  "scraperProperties": [
    {
      key: "ref",
      selector: "p.metaInfo",
      regex: /\s(\d+\/\S+)\s/i
    },
    {
      key: "local_id",
      selector: "a",
      selectValue: function($) {
        return $.attr('href').split('=').pop();
      }
    }
  ]
};