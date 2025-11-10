import { Router } from "express";
import StudentController from "../controllers/student.controller.js";

const studentRouter = Router();

studentRouter.get("/", StudentController.getAllStudents);
studentRouter.get("/:id", StudentController.getStudentById);
studentRouter.post("/", StudentController.createStudent);
studentRouter.put("/:id", StudentController.updateStudenetId);
studentRouter.delete("/:id", StudentController.deleteStudentById);

export default studentRouter;
