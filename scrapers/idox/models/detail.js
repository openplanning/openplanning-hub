module.exports = {
  rootNode: 'table#simpleDetailsTable',
  iterator: 'tr',
  scraperProperties: [
  {
    key: 'title',
    selector: "th:contains('Proposal') + td"
  },
  {
    key: 'received_date',
    selector: "th:contains('Application Received') + td"
  },
  {
    key: 'reference',
    selector: "th:contains('Reference') + td"
  },
  {
    key: 'address',
    selector: "th:contains('Address') + td"
  },
  {
    key: 'status',
    selector: "tr:nth-child(5) th + td"
  },
  {
    key: 'appeal_status',
    selector: "th:contains('Appeal Status') + td"
  },
  {
    key: 'appeal_decision',
    selector: "th:contains('Appeal Decision') + td"
  }
  ]
};