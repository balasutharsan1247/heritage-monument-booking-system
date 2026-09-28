const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  monumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monument',
    required: true,
    index: true,
  },
  targetDate: {
    type: Date,
    required: true,
    index: true,
  },
  predictedVisitorCount: {
    type: Number,
    required: true,
  },
  modelName: {
    type: String,
  },
  mae: {
    type: Number,
  },
  rmse: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Prediction', predictionSchema);
