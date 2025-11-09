import { db } from "../config/firebase.config.js";


const userCollection = db.collection('users');


// get user by id
const getUserById = async (id) => {
    try {
        const userDoc = await userCollection.doc(id).get();
        return userDoc;
    } catch (error) {
        console.error("Error getting user by ID:", error);
        throw new Error("Error getting user by ID");
    }
}

// update display name
const updateUserDisplayName = async (id, displayName) => {
    try {
        const userRef = userCollection.doc(id);
        const userSnapshot = await userRef.get();
        if (!userSnapshot.exists) {
            throw new Error("User not found");
        }
        await userRef.update({ displayName });
        const updatedUserDoc = await userRef.get();
        return updatedUserDoc;
    } catch (error) {
        console.error("Error updating user display name:", error);
        throw new Error("Error updating user display name");
    }
};



export { getUserById, updateUserDisplayName };