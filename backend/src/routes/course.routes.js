import { Router } from "express";
import CourseController from "../controllers/course.controller.js";

const courseRouter = Router();

courseRouter.get("/", CourseController.getAllCourses);
courseRouter.get("/:id", CourseController.getCourseById);
courseRouter.post("/", CourseController.createCourse);
courseRouter.put("/:id", CourseController.updateCourseById);
courseRouter.delete("/:id", CourseController.deleteCourseById);

export default courseRouter;