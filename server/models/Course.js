import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  accessCode: {
    type: String,
    trim: true,
    uppercase: true,
    default: null
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ category: 1, isPublished: 1 });
courseSchema.index({ instructor: 1 });

export default mongoose.model('Course', courseSchema);
