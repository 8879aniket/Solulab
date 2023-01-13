/* eslint-disable semi */
const express = require("express");
const membersController = require("../../controller/admin/members");
const dashboardController = require("../../controller/admin/dashboard");
const coinsController = require("../../controller/admin/coins");
const bankNoteController = require("../../controller/admin/bankNote");
const gradedCoinsController = require("../../controller/admin/gradedCoins");
const gradedNoteController = require("../../controller/admin/gradedNote");
const orderController = require("../../controller/admin/order");
const auctionController = require("../../controller/admin/auction");
const cmsController = require ('../../controller/admin/cms')
const drController = require('../../controller/admin/disputeRequest')
const adminController = require('../../controller/admin/admin')
const isAdmin = require('../../common/middlewares/authCheck')
const { uploadS3 } = require('../../common/utils/uploadAdminPic');
const { validate } = require("express-jsonschema");

const router = express.Router();

const { ACCESSURL } = require("../../config/config");

// const { authenticateAdmin } = require('../../../common/middlewares/authCheck');

// const {
//   dashboard,
// } = require('../../../controllers/v1/admin/admin');

// Login Routes
router.get('/login', adminController.renderLogin)
router.get('/logout', adminController.logout)
router.post('/login', adminController.login)
router.post('/registerAdmin', adminController.createAdmin)
router.put('/updatePassword', isAdmin.verifyToken, adminController.updatePassword)
router.get('/update-password', isAdmin.verifyToken, adminController.renderUpdatePassword)
router.get('/profile', isAdmin.verifyToken,  adminController.adminProfile)
router.put('/profile/uploadProfilePic',  isAdmin.verifyToken, uploadS3.array('file'), adminController.uploadProfilePic)
router.post('/reset-password',  adminController.sendResetLink)
router.get('/verifyToken/:token', adminController.verifyResetToken)
router.put('/resetPassword/:token', adminController.resetPassword)
router.get('/forgotPassword', adminController.renderForgotPassword)


// DashBoard API's
router.get("/dashboard", isAdmin.verifyToken, dashboardController.dashboard);
router.get("/dashboard-chartData", isAdmin.verifyToken, dashboardController.chartData);

// members section routes
router.get("/members",isAdmin.verifyToken, membersController.getAll);
router.get("/member/:id", isAdmin.verifyToken, membersController.getOne);
router.put("/block-member/:userId", membersController.blockUser);

//Coins Section routes
router.get("/coins",isAdmin.verifyToken, coinsController.getCoins);
router.get("/coin/:coinId",isAdmin.verifyToken, coinsController.getCoin);
router.get("/delete-coin/:coinId",isAdmin.verifyToken, coinsController.deleteCoin);

//Graded Coins Section routes
router.get("/graded-coins",isAdmin.verifyToken, gradedCoinsController.getGradedCoins);
router.get("/graded-coin/:coinId",isAdmin.verifyToken, gradedCoinsController.getGradedCoin);
router.get("/delete-graded-coin/:coinId",isAdmin.verifyToken, gradedCoinsController.deleteGradedCoin);

// Bank Note routes
router.get('/bankNotes',isAdmin.verifyToken, bankNoteController.getBankNotes)
router.get('/bankNote/:noteId',isAdmin.verifyToken, bankNoteController.getOneNote)
router.get('/delete/bankNote/:noteId',isAdmin.verifyToken, bankNoteController.deleteNote)

//Graded Bank-Notes routes
router.get("/graded-notes",isAdmin.verifyToken, gradedNoteController.getGradedNotes);
router.get("/graded-note/:noteId",isAdmin.verifyToken, gradedNoteController.getOneNote);
router.get("/delete-graded-note/:noteId",isAdmin.verifyToken, gradedNoteController.deleteNote);


//Order section routes
router.get("/orders",isAdmin.verifyToken, orderController.getOrders);
router.get("/order/:orderId",isAdmin.verifyToken, orderController.getOrder);

//Auction section routes
router.get("/auctions",isAdmin.verifyToken, auctionController.getAuctions)
router.get("/auction/:auctionId",isAdmin.verifyToken, auctionController.getSingleAuction);
router.get("/delete-auction/:auctionId",isAdmin.verifyToken, auctionController.deleteAuction);

//CMS Page section routes
router.get('/cmsPages',isAdmin.verifyToken, cmsController.getCms)
router.get('/cmsPage/:cmsId',isAdmin.verifyToken, cmsController.getSingleCms)
router.put('/updateCmsPage/:cmsId',isAdmin.verifyToken, cmsController.updateCms)
router.get('/updateCmsPage/:cmsId',isAdmin.verifyToken, cmsController.updateSingleCms)
router.get('/deleteCmsPage/:cmsId',isAdmin.verifyToken, cmsController.deleteCms)
router.post('/cmsPage/add',isAdmin.verifyToken, cmsController.createCms)

//DISPUTE REQUEST ROUTES

router.get('/disputeRequest',isAdmin.verifyToken, drController.getAll)
router.get('/disputeRequest/message/:msgId',isAdmin.verifyToken, drController.getMessageDetails)
router.put('/disputeRequest/approved/:msgId',isAdmin.verifyToken, drController.markApproved)

//KYC ROUTES
router.get('/kycRequests', isAdmin.verifyToken, membersController.kyc)
router.get('/kycDetail/:userId', isAdmin.verifyToken, membersController.getKycDetails)
router.get('/approveKyc/:userId', isAdmin.verifyToken, membersController.approveKyc)
router.put('/rejectKyc/:userId',isAdmin.verifyToken, membersController.rejectKyc)


module.exports = router;
