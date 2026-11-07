import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  options: {
    type: [String],
    validate: {
      validator: (val) => val.length >= 2 && val.length <= 4,
      message: 'Question must have between 2 and 4 options'
    },
    required: true
  },
  correctOptionIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  }
}, { timestamps: true });

questionSchema.index({ quizId: 1 });

export default mongoose.model('Question', questionSchema);
