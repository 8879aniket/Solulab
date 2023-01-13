const express = require('express')
const { validate } = require('express-jsonschema')
const { Wrap } = require('../common/utils/util')

const CreateConversationDTO = require('../controller/conversation/dtos/create.dto')
const CreateConversationMessageDTO = require('../controller/conversation/dtos/create-message.dto')
const GetAllConversationDTO = require('../controller/conversation/dtos/get-all.dto')
const GetAllConversationMessageDTO = require('../controller/conversation/dtos/get-all-message.dto')



const conversationController = require('../controller/conversation') 

const router = express.Router();
// Conversation Routes
router.post(
    '/',
    validate({ body: CreateConversationDTO }),
    Wrap(conversationController.Create)
);
router.get(
    '/',
    validate({ query: GetAllConversationDTO }),
    Wrap(conversationController.GetAll)
);



// Conversation Message Routes
router.post(
    '/:conversationId/messages',
    validate({ body: CreateConversationMessageDTO }),
    Wrap(conversationController.CreateMessage)
);
router.get(
    '/:conversationId/messages',
    validate({ query: GetAllConversationMessageDTO }),
    Wrap(conversationController.GetAllMessage)
);


module.exports = router;
