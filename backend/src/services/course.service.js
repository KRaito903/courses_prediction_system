import { db } from '../config/firebase.config.js';

const courseCollection = db.collection('courses');

// Create new course
const createCourse = async (courseData) => {
    try {
        const course_id = courseData.course_id.toString();  
        if  (!course_id) {
            throw new Error('course_id is required');
        }
        const courseRef = courseCollection.doc(course_id);
        await courseRef.set(courseData);
        console.log(`✅ Course with ID ${course_id} created successfully.`);
        return { id: courseRef.id, ...courseData };
    } catch (error) {
        throw new Error('Error creating course: ' + error.message);
    }
};

// create mutilple courses
const createMultipleCourses = async (coursesData) => {
   try {
         const batch = db.batch();
         if (!Array.isArray(coursesData)) {
             throw new Error('coursesData must be an array');
         };
         coursesData.forEach((courseData) => {
             const course_id = courseData.course_id.toString();
             if (!course_id) {
                 throw new Error('course_id is required for each course');
             }
             const courseRef = courseCollection.doc(course_id);
             batch.set(courseRef, courseData);
         });
         await batch.commit();
         console.log(`✅ ${coursesData.length} courses created successfully.`);
         return coursesData.map(courseData => ({ id: courseData.course_id, ...courseData }));
   }
   catch (error) {
       throw new Error('Error creating multiple courses: ' + error.message);
   }
};

// Get course by ID
const getCourseById = async (course_id) => {
    try {
        const coursRef = courseCollection.doc(course_id);
        const doc = await coursRef.get();
        if (!doc.exists) {
            throw new Error(`Course with ID ${course_id} not found`);
        }
        return { id: doc.id, ...doc.data() };
    }
    catch (error) {
        throw new Error('Error getting course: ' + error.message);
    }
};

// get all courses
const getAllCourses = async () => {
    try {
        const snapshot = await courseCollection.get();
        const courses = [];
        snapshot.forEach(doc => {
            courses.push({ id: doc.id, ...doc.data() });
        });
        return courses; 
    } catch (error) {
        throw new Error('Error getting courses: ' + error.message);
    }
};

// Update course by ID
const updateCourseById = async (course_id, updateData) => {
    try {
        const courseRef = courseCollection.doc(course_id);
        await courseRef.update(updateData);
        console.log(`✅ Course with ID ${course_id} updated successfully.`);
        const updatedDoc = await courseRef.get();
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }
    catch (error) {
        throw new Error('Error updating course: ' + error.message);
    }
};

// Delete course by ID
const deleteCourseById = async (course_id) => {
    try {
        const courseRef = courseCollection.doc(course_id);
        await courseRef.delete();
        console.log(`✅ Course with ID ${course_id} deleted successfully.`);
        return { message: `Course with ID ${course_id} deleted successfully.` };
    } catch (error) {
        throw new Error('Error deleting course: ' + error.message);
    }
};

export {
    createCourse,
    createMultipleCourses,
    getCourseById,
    getAllCourses,
    updateCourseById,
    deleteCourseById
};