import {createCourse, createMultipleCourses, getCourseById, getAllCourses, updateCourseById, deleteCourseById} from '../services/course.service.js';

class CourseController {
    // Create new course
    async createCourse(req, res, next) {
        try {
            if (Array.isArray(req.body.courses)) {
                const courseData = req.body.courses;
                const newCourses = await createMultipleCourses(courseData);
                return res.status(201).json(newCourses);
            }
            const courseData = req.body;
            const newCourse = await createCourse(courseData);
            if (!newCourse) {
                console.log("Error when creating new course");
                res.status(404).json({ message: 'Error when creating new course' });
            }
            res.status(201).json(newCourse);
        } catch (error) {
            console.log(`Error: ${error}`);
            next(error);
        }
    }

    // Get course by ID
    async getCourseById(req, res, next) {
        try {
            const course_id = req.params.id;
            const course = await getCourseById(course_id);
            if (!course) {
                return res.status(404).json({ message: 'Course not found' });
            }
            res.status(200).json(course);
        }
        catch (error) {
            console.error('Error getting course by ID:', error);
            next(error);
        }
    }

    // Update course by ID
    async updateCourseById(req, res, next) {
        try {
            const course_id = req.params.id;
            const updateData = req.body;
            const updatedCourse = await updateCourseById(course_id, updateData);
            if (!updatedCourse) {
                return res.status(404).json({ message: 'Course not found' });
            }
            res.status(200).json(updatedCourse);
        }
        catch (error) {
            console.error('Error updating course by ID:', error);
            next(error);
        }
    }
    // Delete course by ID
    async deleteCourseById(req, res, next) {
        try {
            const course_id = req.params.id;
            const deletedCourse = await deleteCourseById(course_id);
            if (!deletedCourse) {
                return res.status(404).json({ message: 'Course not found' });
            }
            res.status(200).json({ message: 'Course deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting course by ID:', error);
            next(error);
        }
    }

    // Get all courses
    async getAllCourses(req, res, next) {
        try {
            const courses = await getAllCourses();
            res.status(200).json(courses);
        }
        catch (error) {
            console.error('Error getting all courses:', error);
            next(error);
        }
    }
}

export default new CourseController();