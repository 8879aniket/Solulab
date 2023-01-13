import { Router } from 'express'

import {
	createProject,
	submitProject,
	getAllProject,
	getProject,
	unApproveProjectRejection,
	preVerificationRejection,
	fullVerificationRejection,
	verifyProject,
	getSignedDoc,
	signDoc,
	updateProjectByAdmin,
	preVerificationApprovalController,
	preVerificationSuccessController,
	getUserDraftProjects,
	fullVerificationSuccessController,
	liveSeedProjectController,
	getAllUserProjects,
	getUserPublishedProjects,
	getProjectWallet,
	createWithdrawRequest,
	approveWithdrawRequest,
	rejectWithdrawRequest,
	getAllWithdrawRequest,
	getProjectForInvestment,
	updateProjectTransaction,
	createTokenTransaction,
	addSeedVccCredits,
	editYearlyProjectProjectionController,
	getYearlyProjectProjectionController,
	getMyportfolio,
	investInProject,
	updateVccTokenTransaction,
	updateSeedVCCCredits,
	getGtpMintedProjects,
	getAllTransactions,
	getAllBalances,
	getTransaction,
	getBalance,
	getTotalGTPAndVCC,
	getUserInvestedProjects,
	getAllVccTrasactions,
	getCountriesData,
	getCountryData,
	signDocument,
	getProjectDevDashboardGraph,
	RetireGTP,
	transferProjectFees,
	createVCCTokenTransaction,
	createTokenTransactionAfterSwap,
	getProjectDevProjects,
	getInvestedProjects,
	getInvestorDashboardGraph,
	getstateData,
	getDistrictData,
	getInvestorSummaryDashboardGraph,
	getRetiredCredits,
	getTotalRetiredCredits,
	getInvestorDetails,
	getCreditRealised,
	getUserRetireHistory,
	updateRoadmapValidationStatus,
	updateRoadmapValidation,
	createRoadmap,
	deleteRoadmapValidation,
	getAvailableCreditsToRetire,
	listProjectsToRetireGTP,
	getRoadmap,
	getAllRoadMap,
	getUserProjectRoadmap,
	getMyPortfolioData,
	returnFundsToInvestor,
	deleteProjectDraft,
	getProjectDevSummaryDashboardGraph,
	getProjectWithAllDetails,
	getProjectPublic,
	updateVvbRegistryLogo,
	getPojectVccPublicData,
	getAdminDashboardGraph,
	getPlatformStats,
	changeProjectDisableStatus,
	getPlatformStatsGraph,
	enableNotifyMe,
	disableNotifyMe,
	userPortfolioData,
} from '@projects/controller'
import Authorize from '@middlewares/authorize'

import authorizeApproval from '@middlewares/projectApprovalAuthorize'
import checkIsAdmin from '@middlewares/checkIsAdmin'
import checkIsSuperAdmin from '@middlewares/checkIsSuperAdmin'
import { restrictToDeveloper, restrictToInvester } from '@middlewares/restrictRoutes'
import checkPasswordChanged from '@middlewares/checkPasswordChanged'

const router = Router()

router.put('/updateProjectTransaction', updateProjectTransaction)
router.post('/createTokenTransaction', createTokenTransaction)
router.put('/vccTokenTransaction', updateVccTokenTransaction)
router.put('/updateSeedVCCCredits', updateSeedVCCCredits)
router.get('/getCountriesData', getCountriesData)
router.get('/getCountryData/:countryId', getCountryData)
router.post('/createVCCTokenTransaction', createVCCTokenTransaction)
router.post('/createTokenTransactionAfterSwap', createTokenTransactionAfterSwap)
router.get('/getStateData/:countryName', getstateData)
router.get('/getDistrictData/:countryName', getDistrictData)
router.get('/getProjectPublic/:projectId', getProjectPublic)
router.get('/getPojectVccPublicData/:id/:tokenId', getPojectVccPublicData)

router.use(Authorize)
router.get('/getAllProject', checkIsAdmin, getAllProject)
router.post('/seedVccCredits', checkIsSuperAdmin, addSeedVccCredits)
router.post('/editYearlyProjection/:projectId', checkIsAdmin, editYearlyProjectProjectionController)
router.get('/gtp-minted', checkIsAdmin, getGtpMintedProjects) // Transaction management Api in Admin panel
router.put('/updateProjectByAdmin', updateProjectByAdmin)
router.put('/verifyProject', verifyProject)
router.post('/preVerificationApprovalController', preVerificationApprovalController)
router.post('/preVerificationSuccessController', preVerificationSuccessController)
router.post('/unApproveProjectRejection', unApproveProjectRejection)
router.post('/preVerificationRejection', preVerificationRejection)
router.post('/fullVerificationRejection', fullVerificationRejection)
router.post('/fullVerificationSuccessController', fullVerificationSuccessController)
router.post('/liveSeedProjectController', liveSeedProjectController)
router.post('/approveWithdrawRequest/:withdrawId', approveWithdrawRequest)
router.get('/getAllWithdrawRequest/:projectId/:withdrawStatus', getAllWithdrawRequest)
router.post('/rejectWithdrawRequest', rejectWithdrawRequest)
router.get('/getAllWithdrawRequest/:projectId/:withdrawStatus', getAllWithdrawRequest)
router.post('/seedVccCredits', checkIsSuperAdmin, addSeedVccCredits)
router.get('/getYearlyProjection/:projectId', getYearlyProjectProjectionController)
router.get('/invested/users/:userId', checkIsAdmin, getUserInvestedProjects)
router.post('/transferProjectFees/:projectId', checkIsSuperAdmin, transferProjectFees)
router.get('/getCreditRealised/:projectId', getCreditRealised)
router.put('/updateRoadmapValidationStatus', checkIsSuperAdmin, updateRoadmapValidationStatus)
router.put('/updateRoadmapValidation', checkIsSuperAdmin, updateRoadmapValidation)
router.post('/createRoadmap', checkIsSuperAdmin, createRoadmap)
router.delete('/deleteRoadmapValidation/:roadmapId', checkIsSuperAdmin, deleteRoadmapValidation)
router.get('/getProjectRoadmaps/:projectId', getAllRoadMap)
router.get('/getRoadmap/:id', getRoadmap)
router.get('/getUserProjectRoadmap/:projectId', getUserProjectRoadmap)
router.get('/getProject/:projectId', getProject)
router.get('/getProjectWithAllDetails/:projectId', getProjectWithAllDetails)
router.get('/getInvestorDetails/:projectId', getInvestorDetails)
router.get('/getProjectWallet', getProjectWallet)
router.post('/createProject', restrictToDeveloper, createProject)
router.post('/rejectWithdrawRequest', rejectWithdrawRequest)
router.post('/update-vvb-registry-logo', checkIsAdmin, updateVvbRegistryLogo)
router.get('/dashboard-graph/admin', checkIsAdmin, getAdminDashboardGraph)
router.get('/platform-stats', checkIsAdmin, getPlatformStats)
router.get('/retired-credits/total', checkIsAdmin, getTotalRetiredCredits)
router.put(
	'/changeProjectDisableStatus/:projectId/:isDisableData',
	checkIsSuperAdmin,
	changeProjectDisableStatus
)
router.get('/platform-stats/graph', checkIsAdmin, getPlatformStatsGraph)

router.use(checkPasswordChanged)
router.get('/getAllUserProject', restrictToDeveloper, getAllUserProjects)
router.post('/submitProject/:projectId', authorizeApproval, submitProject)
router.post('/signDoc/:projectId', signDocument)
router.get('/getDoc/:projectId', getSignedDoc)
router.get('/getUserDraftProjects', restrictToDeveloper, getUserDraftProjects)
router.get('/getPublishedProjects', getUserPublishedProjects)
router.post('/createWithdrawRequest', createWithdrawRequest)
router.get('/myPortfolio', restrictToInvester, getMyportfolio)
router.get('/getMyPortfolioData', restrictToInvester, getMyPortfolioData)
router.post('/investInProject', restrictToInvester, investInProject)
router.get('/getAllTransactions', getAllTransactions)
router.get('/getAllBalances', getAllBalances)
router.get('/getTransaction/:transactionId', getTransaction)
router.get('/getBalance/:balanceId', getBalance)
router.get('/totalGTPAndVCC', getTotalGTPAndVCC)
router.get('/getAllVccTransactions', getAllVccTrasactions)
router.get('/:projectId/dashboard-graph/developer', getProjectDevDashboardGraph)
router.get('/dashboard-graph/developer', getProjectDevSummaryDashboardGraph)
router.get('/getAllVccTransactions', getAllVccTrasactions)
router.post('/RetireGTP', restrictToInvester, RetireGTP)
router.get('/getProjectDevProjects', getProjectDevProjects)
router.get('/getAllInvestedProjects', getInvestedProjects)
router.get('/:projectId/dashboard-graph/investor', getInvestorDashboardGraph)
router.get('/dashboard-graph/investor', getInvestorSummaryDashboardGraph)
router.get('/retired-credits', getRetiredCredits)
router.get('/retireHistory', getUserRetireHistory)
router.get('/:projectId/retired-credits', getAvailableCreditsToRetire)
router.get('/retire-gtp', listProjectsToRetireGTP)
router.get('/returnFundsToInvestor/:projectId', returnFundsToInvestor)
router.delete('/:projectId', restrictToDeveloper, deleteProjectDraft)
router.post('/notifyme/:projectId', enableNotifyMe)
router.delete('/disableNotify/:projectId', disableNotifyMe)
router.get('/getProjectForInvestment', getProjectForInvestment)
router.get('/userPortfolioData', restrictToInvester, userPortfolioData)

export default router
