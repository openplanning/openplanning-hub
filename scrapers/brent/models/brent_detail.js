var getPropertyValue = function($) {
  //console.log('value', $.parent().parent().children(1).html());
  return $.parent().parent().children(1).text().trim();
};
var getCleanDate = function($) {
  var dateStr = getPropertyValue($);
  return dateStr.replace(/\s/gi, '');
};
var trimWhiteSpace = function(str) {
  return str.replace(/( +){2,}/gi, ', ');
};
var getPostcode = function($) {
  // https://gist.github.com/simonwhitaker/5748487
  var postcodeMatches = getPropertyValue($).match(/[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}/g);
  return (postcodeMatches && postcodeMatches.length > 0) ? postcodeMatches[0] : '';
};
var getName = function($) {
  return $.parent().parent().children(1).find('strong').text().trim();
};
var getAddress = function($) {
  var address = getPropertyValue($).replace(getName($), '').trim();
  if (address.substr(0, 1) === ',') {
    address = address.substr(1, address.length).trim();
  }
  address = trimWhiteSpace(address);
  return address;
};
var getAgentAddress = function($) {
  return getAddress($).replace(',, ', '').trim();
};
var getCaseOfficer = function($) {
  var text = getPropertyValue($);
  return text.substr(0, text.indexOf('\n'));
};

module.exports = {
  rootNode: '#detailsDiv table',
  iterator: 'tr',
  scraperProperties: [
    {
      key: 'type',
      selector: "td strong:contains('Application Type')",
      selectValue: getPropertyValue
    },
    {
      key: 'current_status',
      selector: "td strong:contains('Status')",
      selectValue: getPropertyValue
    },
    {
      key: 'address',
      selector: "td strong:contains('Location')",
      selectValue: getPropertyValue
    },
    {
      key: 'postcode',
      selector: "td strong:contains('Location')",
      selectValue: getPostcode
    },
    {
      key: 'title',
      selector: "td strong:contains('Proposal')",
      selectValue: getPropertyValue
    },
    {
      key: 'date_received',
      selector: "td strong:contains('Received Date')",
      selectValue: getCleanDate
    },
    {
      key: 'agent_name',
      selector: "td strong:contains('Agent')",
      selectValue: getName
    },
    {
      key: 'agent_address',
      selector: "td strong:contains('Agent')",
      selectValue: getAgentAddress
    },
    {
      key: 'applicant_name',
      selector: "td strong:contains('Applicant')",
      selectValue: getName
    },
    {
      key: 'applicant_address',
      selector: "td strong:contains('Applicant')",
      selectValue: getAddress
    },
    {
      key: 'case_officer',
      selector: "td strong:contains('Case Officer')",
      selectValue: getCaseOfficer
    },
    {
      key: 'certificate',
      selector: "td strong:contains('Certificate')",
      selectValue: getPropertyValue
    },
    {
      key: 'decision_date',
      selector: "td strong:contains('Decision Date')",
      selectValue: getCleanDate
    },
    {
      key: 'decision',
      selector: "td strong:contains('Decision:')",
      selectValue: getPropertyValue
    }
  ]
};