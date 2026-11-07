import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  passingPercentage: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  }
}, { timestamps: true });

quizSchema.index({ courseId: 1 });

export default mongoose.model('Quiz', quizSchema);
