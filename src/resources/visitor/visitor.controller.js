const { Router } = require("express");
const visitorService = require("./visitor.service");
const {
  getVisitor,
  deleteVisitor,
  updateVisitor,
  createVisitor,
} = require("./visitor.validation");
const { jsonResponse } = require("../../utils/jsonResponse.util");
const logger = require("./../../config/logger");
const zodValidator = require("../../middleware/zod.middleware");
const verifyUser = require("../../middleware/verifyUser");

class VisitorController {
  path = "/visitors";
  router = Router();
  visitorService = new visitorService();
  constructor() {
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get(
      `${this.path}/stat/`,
      verifyUser,
      this.visitorService.getAll
    );
  }
}

module.exports = { VisitorController };
