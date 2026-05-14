// app/models/DailyReportModel.ts
import mongoose from 'mongoose';

const DailyReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  activities: [{
    time: String,
    activity: String,
    notes: String,
  }],
  achievements: {
    type: String,
    default: '',
  },
  challenges: {
    type: String,
    default: '',
  },
  tomorrowPlan: {
    type: String,
    default: '',
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['draft', 'submitted'],
    default: 'submitted',
  },
});

const DailyReportModel = mongoose.models.DailyReport || mongoose.model('DailyReport', DailyReportSchema);
export default DailyReportModel;