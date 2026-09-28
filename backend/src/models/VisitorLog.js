const mongoose = require('mongoose');

const visitorLogSchema = new mongoose.Schema({
  monumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monument',
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
  },
  hour: {
    type: Number,
    required: true,
  },
  visitorCount: {
    type: Number,
    default: 0,
  },
  actualVisitDuration: {
    type: Number,
  },
  dayType: {
    type: String,
    enum: ['weekday', 'weekend', 'holiday'],
  },
});

module.exports = mongoose.model('VisitorLog', visitorLogSchema);
