const { Router } = require("express");
const chatService = require("../chat/chat.service");
const {
  getChat,
  deleteChat,
  updateChat,
  createChat,
} = require("./chat.validation");
const { jsonResponse } = require("../../utils/jsonResponse.util");
const logger = require("./../../config/logger");
const zodValidator = require("../../middleware/zod.middleware");

class ChatController {
  path = "/chatuser";
  router = Router();
  chatService = new chatService();
  constructor() {
    this.initializeRoutes();
  }

  initializeRoutes() {

    this.router.get(`${this.path}/`, this.chatService.getAllChatUser);
  }
}

module.exports = { ChatController };