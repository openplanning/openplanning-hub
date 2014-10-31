var getPropertyValue = function($) {
  return ($.parent()[0]).children[2].data.trim();
};

module.exports = {
  rootNode: function($) {
    var root = $('.dataview').get(2);
    if (typeof(root) === 'object' && root.length > 0)
      return root[0];
    return $;
  },
  iterator: 'li',
  scraperProperties: [
    {
      key: 'date_received',
      selector: "span:contains('Application Registered')",
      selectValue: getPropertyValue
    },
    {
      key: 'date_consultation_end',
      selector: "span:contains('Comments Until')",
      selectValue: getPropertyValue
    },
    {
      key: 'committee_date',
      selector: "span:contains('Date of Committee')",
      selectValue: getPropertyValue
    },
    {
      key: 'decision',
      selector: "span:contains('Decision')",
      selectValue: getPropertyValue
    },
    {
      key: 'appeal_lodged',
      selector: "span:contains('Appeal Lodged')",
      selectValue: getPropertyValue
    },
    {
      key: 'appeal_decision',
      selector: "span:contains('Appeal Decision')",
      selectValue: getPropertyValue
    }
  ]
};