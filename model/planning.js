var mongoose = require('mongoose'),
    uniqueValidator = require('mongoose-unique-validator');

var planningSchema = mongoose.Schema({
    // The planning ref and GSS (location) code makes a unqiue value
    // Ref is often in the format {YEAR}/{NUMBER} where NUMBER is auto increment
    ref: { type: String, required: true},
    gss_code: { type: String, required: true},

    /*
    internal_status
        0: unprocessed
        1: processed
        2: geocoded
        3: ungeocodable
        4: processed (added further attributes to geocoded)
    */
    internal_status: { type: Number, required: true, default: 0 },
    created: { type: Date, default: Date.now },
    modified: { type: Date, default: Date.now },

    title: String,
    description: String,
    type: String,
    // Planning record unqiue ID
    // Some local planning systems will have this in addition to their planning ref.
    local_id: String,

    // address field
    address: String,
    // or separate address fields:
    house_name_no: String,
    street: String,
    village: String,
    town: String,
    district: String,
    county: String,
    postcode: String,
    ward: String,
    parish: String,
    postcode: String,

    applicant_name: String,
    agent_name: String,
    agent_address: String,

    date_received: Date,
    date_valid: Date,
    target_date: Date,
    
    decision: String,
    decision_date: Date,
    committee_date: Date,

    other: { type: mongoose.Schema.Types.Mixed }

}, { collection: 'planning', autoIndex: true });

planningSchema.index({
    ref: 1,
    gss_code: 1
}, {
    background: true,
    unique: true, 
    dropDups: true
});

planningSchema.plugin(uniqueValidator);

planningSchema.pre('save', function(next){
  this.modified = new Date();
  if (! this.created) {
    this.created = this.modified;
  }
  next();
});

module.exports.model = mongoose.model('Planning', planningSchema);
module.exports.schema = planningSchema;
