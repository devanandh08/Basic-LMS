import Course from '../models/Course.js';

export const getCourses = async (req, res) => {
  try {
    const { search, category, sort = 'newest', page = 1, limit = 9, accessCode } = req.query;
    const query = {};

    if (accessCode) {
      query.accessCode = accessCode.trim().toUpperCase();
    } else if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { accessCode: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    // Determine sort order
    let sortOption = { createdAt: -1 }; // default newest
    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'title_asc') {
      sortOption = { title: 1 };
    } else if (sort === 'title_desc') {
      sortOption = { title: -1 };
    }

    const skip = (page - 1) * limit;
    const courses = await Course.find(query)
      .populate('instructor', 'name email')
      .skip(skip)
      .limit(Number(limit))
      .sort(sortOption);

    const total = await Course.countDocuments(query);

    // Ensure older courses in DB without an accessCode get one assigned in memory
    const formattedCourses = courses.map(c => {
      const doc = c.toObject();
      if (!doc.accessCode) {
        doc.accessCode = 'POTTER101'; // Default access code for seeded course
      }
      return doc;
    });

    res.json({
      success: true,
      count: formattedCourses.length,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: Number(page),
      totalCourses: total,
      data: formattedCourses
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('instructor', 'name email');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    const doc = course.toObject();
    if (!doc.accessCode) {
      doc.accessCode = 'POTTER101';
    }
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyCourseCode = async (req, res) => {
  try {
    const { code, courseId } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Please provide an access code' });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check specific courseId or search by code
    let course;
    if (courseId) {
      course = await Course.findById(courseId).populate('instructor', 'name email');
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }
      const actualCode = (course.accessCode || 'POTTER101').toUpperCase();
      if (actualCode !== cleanCode) {
        return res.status(400).json({ success: false, message: 'Incorrect access code for this course' });
      }
    } else {
      course = await Course.findOne({ accessCode: cleanCode }).populate('instructor', 'name email');
      if (!course && cleanCode === 'POTTER101') {
        course = await Course.findOne({ title: /Harry Potter/i }).populate('instructor', 'name email');
      }
      if (!course) {
        return res.status(404).json({ success: false, message: 'No course found with this access code' });
      }
    }

    const doc = course.toObject ? course.toObject() : course;
    if (!doc.accessCode) doc.accessCode = cleanCode;

    res.json({
      success: true,
      valid: true,
      message: 'Access granted!',
      data: doc
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCourse = async (req, res) => {
  try {
    let { title, description, category, isPublished, accessCode, isPrivate } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: 'Title, description, and category are required' });
    }

    if (!accessCode || !accessCode.trim()) {
      accessCode = 'LMS-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    } else {
      accessCode = accessCode.trim().toUpperCase();
    }

    const course = await Course.create({
      title,
      description,
      category,
      accessCode,
      isPrivate: Boolean(isPrivate),
      isPublished: isPublished !== undefined ? isPublished : true,
      instructor: req.user._id
    });
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this course' });
    }

    const updates = { ...req.body };
    if (updates.accessCode) {
      updates.accessCode = updates.accessCode.trim().toUpperCase();
    }

    course = await Course.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this course' });
    }

    await course.deleteOne();
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
