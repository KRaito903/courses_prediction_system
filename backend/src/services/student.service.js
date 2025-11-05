import e from 'express';
import { db } from '../services/firebase.service';


studentCollection = db.collection('students');
//  --CREATE STUDENT--
// Create new student
const createStudent = async (studentData) => {
    try {
        student_id = studentData.student_id;
        if (!student_id) {
            throw new Error('student_id is required');
        }
        const studentRef = studentCollection.doc(student_id);
        await studentRef.set(studentData);
        console.log(`✅ Student with ID ${student_id} created successfully.`);
        return { id: studentRef.id, ...studentData };
    } catch (error) {
        throw new Error('Error creating student: ' + error.message);
    }
};

// creat multiple students  
const createMultipleStudents = async (studentsData) => {
   try {
         const batch = db.batch();
         if (!Array.isArray(studentsData)) {
             throw new Error('studentsData must be an array');
         };
         studentsData.forEach((studentData) => {
             const student_id = studentData.student_id;
             if (!student_id) {
                 throw new Error('student_id is required for each student');
             }
             const studentRef = studentCollection.doc(student_id);
             batch.set(studentRef, studentData);
         });
         await batch.commit();
         console.log(`✅ ${studentsData.length} students created successfully.`);
         return studentsData.map(studentData => ({ id: studentData.student_id, ...studentData }));
   }
   catch (error) {
       throw new Error('Error creating multiple students: ' + error.message);
   }
};

// --READ STUDENT--

// Get student by ID
const getStudentById = async (student_id) => {
    try {
        const studentRef = studentCollection.doc(student_id);
        const doc = await studentRef.get();
        if (!doc.exists) {
            throw new Error(`Student with ID ${student_id} not found`);
        }
        return { id: doc.id, ...doc.data() };
    } catch (error) {
        throw new Error('Error getting student: ' + error.message);
    }
};

// get all students
const getAllStudents = async () => {
    try {
        const snapshot = await studentCollection.get();
        const students = [];
        snapshot.forEach(doc => {
            students.push({ id: doc.id, ...doc.data() });
        });
        return students;
    } catch (error) {
        throw new Error('Error getting students: ' + error.message);
    }
};

// --UPDATE STUDENT--

// Update student by ID
const updateStudentById = async (student_id, updateData) => {
    try {
        const studentRef = studentCollection.doc(student_id);
        await studentRef.update(updateData);
        console.log(`✅ Student with ID ${student_id} updated successfully.`);
        const updatedDoc = await studentRef.get();
        return { id: updatedDoc.id, ...updatedDoc.data() };
    } catch (error) {
        throw new Error('Error updating student: ' + error.message);
    }
};

// --DELETE STUDENT--

// Delete student by ID
const deleteStudentById = async (student_id) => {
    try {
        const studentRef = studentCollection.doc(student_id);
        await studentRef.delete();
        console.log(`✅ Student with ID ${student_id} deleted successfully.`);
        return { message: `Student with ID ${student_id} deleted successfully.` };
    } catch (error) {
        throw new Error('Error deleting student: ' + error.message);
    }
};

export { createStudent, getStudentById, updateStudentById, deleteStudentById };