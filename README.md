openplanning-hub
================

An open central hub for UK planning applications.

This hub is designed to work with local open data feeds and scrapers to create a central open database of planning applications.

# Usage

To store all planning IDs for a particular week, use the command: 

    scraper.js find [scraper] [startdate]

eg.
    scraper.js find brent 12/08/2004

To continously record planning IDs without stopping, use the command:

    scraper.js find brent 12/08/2004 --continue

To scrape all data associated with a planning reference number, use the following command:

    scraper.js collect

# Setting up indexes

Use the following command to set-up indexes to make sure the database remains fast.

    mongo
    use landdb;
    db.planning.ensureIndex( { ref: 1 }, { unique: true } );
    db.planning.ensureIndex( { internal_status: 1 } );

# How to find the GSS code for a borough

http://statistics.data.gov.uk/explore
or look in mongodb planningauthorities collection

