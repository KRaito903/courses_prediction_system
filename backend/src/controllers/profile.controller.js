// // src/controllers/profile.controller.js
// import { db } from '../config/firebase.config.js';

// /**
//  * Lấy thông tin đầy đủ của user (kết hợp users + students)
//  */
// export const getFullProfile = async (req, res) => {
//     try {
//         const { uid } = req.user; // Từ middleware checkAuth

//         // 1. Lấy thông tin user từ collection users
//         const userRef = db.collection('users').doc(uid);
//         const userDoc = await userRef.get();

//         if (!userDoc.exists) {
//             return res.status(404).send({ message: 'User profile không tồn tại.' });
//         }

//         const userData = userDoc.data();
//         const { student_code } = userData;

//         // 2. Lấy thông tin student từ collection students
//         if (!student_code) {
//             return res.status(200).send({
//                 message: 'Profile chưa có MSSV.',
//                 profile: { uid, ...userData }
//             });
//         }

//         const studentRef = db.collection('students').doc(student_code);
//         const studentDoc = await studentRef.get();

//         if (!studentDoc.exists) {
//             return res.status(404).send({ 
//                 message: `Student với MSSV ${student_code} không tồn tại.` 
//             });
//         }

//         const studentData = studentDoc.data();

//         // 3. Kết hợp data từ 2 collections
//         const fullProfile = {
//             uid,
//             email: userData.email,
//             displayName: userData.displayName,
//             emailVerified: userData.emailVerified,
//             createdAt: userData.createdAt,
//             // Student info
//             student_id: studentData.student_id,
//             name: studentData.name,
//             major: studentData.major || null,
//             semester: studentData.semester || null,
//             gpa: studentData.gpa || null,
//             // ... other student fields
//         };

//         res.status(200).send({
//             message: 'Lấy profile thành công.',
//             profile: fullProfile
//         });

//     } catch (error) {
//         console.error('Lỗi khi lấy profile:', error);
//         res.status(500).send({ message: 'Lỗi server', error: error.message });
//     }
// };

// /**
//  * Cập nhật thông tin user (chỉ các field trong users collection)
//  */
// export const updateUserProfile = async (req, res) => {
//     try {
//         const { uid } = req.user;
//         const { displayName } = req.body; // Chỉ cho phép update displayName

//         if (!displayName) {
//             return res.status(400).send({ message: 'Thiếu thông tin cần cập nhật.' });
//         }

//         const userRef = db.collection('users').doc(uid);
//         const userDoc = await userRef.get();

//         if (!userDoc.exists) {
//             return res.status(404).send({ message: 'User profile không tồn tại.' });
//         }

//         await userRef.update({
//             displayName,
//             updatedAt: new Date().toISOString()
//         });

//         const updatedDoc = await userRef.get();

//         res.status(200).send({
//             message: 'Cập nhật profile thành công.',
//             profile: { uid, ...updatedDoc.data() }
//         });

//     } catch (error) {
//         console.error('Lỗi khi cập nhật profile:', error);
//         res.status(500).send({ message: 'Lỗi server', error: error.message });
//     }
// };
