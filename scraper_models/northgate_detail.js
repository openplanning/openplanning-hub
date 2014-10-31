var getPropertyValue = function($) {
  return ($.parent()[0]).children[2].data.trim();
};

module.exports = {
  rootNode: function($) {
    return ($('.dataview').last())[0];
  },
  iterator: 'li',
  scraperProperties: [
    {
      key: 'address',
      selector: "span:contains('Site Address')",
      selectValue: getPropertyValue
    },
    {
      key: 'type',
      selector: "span:contains('Application Type')",
      selectValue: getPropertyValue
    },
    {
      key: 'dev_type',
      selector: "span:contains('Development Type')",
      selectValue: getPropertyValue
    },
    {
      key: 'title',
      selector: "span:contains('Proposal')",
      selectValue: getPropertyValue
    },
    {
      key: 'current_status',
      selector: "span:contains('Current Status')",
      selectValue: getPropertyValue
    },
    {
      key: 'applicant_name',
      selector: "span:contains('Applicant')",
      selectValue: getPropertyValue
    },
    {
      key: 'agent_name',
      selector: "span:contains('Agent')",
      selectValue: getPropertyValue
    },
    {
      key: 'ward',
      selector: "span:contains('Wards')",
      selectValue: getPropertyValue
    },
    {
      key: 'location_coordinates',
      selector: "span:contains('Location Co ordinates')",
      selectValue: getPropertyValue
    },
    {
      key: 'parish',
      selector: "span:contains('Parishes')",
      selectValue: getPropertyValue
    },
    {
      key: 'case_officer',
      selector: "span:contains('Case Officer / Tel')",
      selectValue: getPropertyValue
    },
    {
      key: 'division',
      selector: "span:contains('Division')",
      selectValue: getPropertyValue
    },
    {
      key: 'planning_officer',
      selector: "span:contains('Planning Officer')",
      selectValue: getPropertyValue
    },
    {
      key: 'district',
      selector: "span:contains('District')",
      selectValue: getPropertyValue
    },
    {
      key: 'determination_level',
      selector: "span:contains('Determination Level')",
      selectValue: getPropertyValue
    },
    {
      key: 'existing_land_use',
      selector: "span:contains('Existing Land Use')",
      selectValue: getPropertyValue
    },
    {
      key: 'proposed_land_use',
      selector: "span:contains('Proposed Land Use')",
      selectValue: getPropertyValue
    }
  ]
};