import EnrollementController from "../controllers/enrollment.controller.js";
import { Router } from "express";

const enrollmentRouter = Router();

enrollmentRouter.get("/", EnrollementController.getAllEnrollments);
enrollmentRouter.get("/:id", EnrollementController.getEnrollmentById);
enrollmentRouter.post("/", EnrollementController.createEnrollment);
enrollmentRouter.put("/:id", EnrollementController.updateEnrollmentById);
enrollmentRouter.delete("/:id", EnrollementController.deleteEnrollmentById);
enrollmentRouter.get("/student/:student_id", EnrollementController.getCoursesOfStudent);

export default enrollmentRouter;