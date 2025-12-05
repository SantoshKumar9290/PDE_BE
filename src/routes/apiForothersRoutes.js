const ApiHandler = require('../handlers/apiForOthersHandler');
const { verifyAPIKey, validateThirdPartyAccess, validateAPIkey,verifyThirdPartyToken,validateAPIEODBkey,validateAPIkeyAPCTDP,validateAPIkeyAPCFSS} = require('../plugins/auth/authService');
const express = require('express');

const handler = new ApiHandler();
const router = express.Router();

router.get('/doctdetails',verifyAPIKey,[handler.doctdetailsHndlr]);
router.get('/downloadCCgsws',[handler.downloadCCgswshndlr]);
router.get('/DoctdetailsbyPAN',validateThirdPartyAccess,[handler.DoctdetailsbyPANhndlr]);
router.get('/docTransDataByPan',validateThirdPartyAccess, [handler.docTransDataByPan]);
router.get('/pdeDocStatus', validateThirdPartyAccess,[handler.pdeDocStatushndl]);


router.post('/getDocumentRegistrationService',validateThirdPartyAccess, [handler.getDocumentRegistrationService])
router.post('/getDocumentECService',validateThirdPartyAccess, [handler.getDocumentECService])
router.post('/getDocumentCCService',validateThirdPartyAccess, [handler.getDocumentCCService])
router.get('/getHigherEducationData',validateThirdPartyAccess,[handler.getHigherEducationDataHndlr]);
router.get('/DoctdetailsbyTAX',validateThirdPartyAccess,[handler.DoctdetailsbyTAXhndlr]);
router.get('/getDocsDetails',validateThirdPartyAccess,[handler.getDocsDetails]);

//IVRS APIs
router.get('/getECdownloaddetails',validateAPIkey, [handler.getECdownloaddetails]);
router.get('/getCCdownloaddetails',validateAPIkey, [handler.getCCdownloaddetails]);
router.get('/GetSlotBookingStatistics',validateAPIkey,[handler.GetSlotBookingStatistics]);
router.get('/GetTotalregistartiondetails',validateAPIkey,[handler.GetTotalregistartiondetails]);

//VMC CC Download API
router.get('/certifyCopyVMC',verifyThirdPartyToken,[handler.downloadCCForVMC])

//APDBMS API
router.get('/getDocDetailsAPDPMS',validateAPIkey,[handler.getHigherEducationDataHndlr]);

//EODB API
router.get('/getmutationsuccesscount',validateAPIEODBkey,[handler.mutationsuccesscount]);
//UPDATE FIRMS
router.put('/mangooseddbtoorcaledb',[handler.MangoosedDbToOrcaleDB]);

//APDTCP API 
router.get('/getDocDetailsAPDTCP',validateAPIkeyAPCTDP,[handler.getAPDTCPdocumentsDataHndlr]);
//APDTCP VILLAGE WISE API 
router.get('/getDocDetailsAPDTCPBYRegistrationDeatils',validateAPIkeyAPCTDP,[handler.getAPDTCPbySurveyDocumentsDataHndlr]);

//APCFSS API 
router.get('/getDocDetailsAPCFSS',validateAPIkeyAPCFSS,[handler.getAPCFSSdocumentsDataHandler]);

//APCFSS VILLAGE WISE API 
router.get('/getDocDetailsAPCFSSBYRegistrationDeatils',validateAPIkeyAPCFSS,[handler.getAPCFSSbySurveyDocumentsDataHndlr]);
//CDMA MV API
router.post('/getMvUnitRate',validateThirdPartyAccess,[handler.getMvUnitRateService]);

router.post('/storethirdpartyapiresponse',[handler.storeThirdPartyAPIResponse])
//Commercial tax PAN
router.get('/doctransactiondatabypan',validateThirdPartyAccess, [handler.getdoctransactiondatabypan]);
module.exports = router;