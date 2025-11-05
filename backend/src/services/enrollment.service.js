import { db } from './config/firebase.config.js';

enrollmentCollection = db.collection('enrollments');

// CRREATE ENROLLMENT
// Create new enrollment
const createEnrollment = async (enrollmentData) => {
    try {
        enrollment_id = enrollmentData.enrollment_id;  
        if  (!enrollment_id) {
            throw new Error('enrollment_id is required');
        }
        const enrollmentRef = enrollmentCollection.doc(enrollment_id);
        await enrollmentRef.set(enrollmentData);
        console.log(`✅ Enrollment with ID ${enrollment_id} created successfully.`);
        return { id: enrollmentRef.id, ...enrollmentData };
    } catch (error) {
        throw new Error('Error creating enrollment: ' + error.message);
    }
};


// READ ENROLLMENT
// Get enrollment by ID
const getEnrollmentById = async (enrollment_id) => {
    try {
        const enrollRef = enrollmentCollection.doc(enrollment_id);
        const doc = await enrollRef.get();
        if (!doc.exists) {
            throw new Error(`Enrollment with ID ${enrollment_id} not found`);
        }
        return { id: doc.id, ...doc.data() };
    }
    catch (error) {
        throw new Error('Error getting enrollment: ' + error.message);
    }
};

// get all enrollments
const getAllEnrollments = async () => {
    try {
        const snapshot = await enrollmentCollection.get();
        const enrollments = [];
        snapshot.forEach(doc => {
            enrollments.push({ id: doc.id, ...doc.data() });
        });
        return enrollments;
    } catch (error) {
        throw new Error('Error getting enrollments: ' + error.message);
    }
};

// Get course of student by student ID
const getCoursesOfStudent = async (student_id) => {
    try {
        const enrollments = await enrollmentCollection
            .where('student_id', '==', student_id)
            .get();

        // Mapping enrollment documents to their corresponding course documents
        const enrollmentMap = {};
        enrollments.forEach(doc => {
            enrollmentMap[doc.course_id] = doc.data();
        });
        const course_ids = enrollments.docs.map(doc => doc.data().course_id);
        const coursePromises = course_ids.map(id => db.collection('courses').doc(String(id)).get());
        const courses = await Promise.all(coursePromises);
        return courses.map(doc => ({...doc.data(), type: enrollmentMap[doc.id]?.type || 'unknown', rating: enrollmentMap[doc.id]?.rating || null }));
    } catch (error) {
        throw new Error('Error getting courses of student: ' + error.message);
    }
};


// EXPORTS

export { createEnrollment, getEnrollmentById, getAllEnrollments, getCoursesOfStudent };