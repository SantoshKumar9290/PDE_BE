const { NAMES_STATUS_MAPPINGS, NAMES } = require("../constants/errors");
const PDEError = require("../errors/customErrorClass");
const { constructPDEError } = require("./errorHandler");
const ReportService = require('../services/reportService');
const DocumentService = require('../services/documentService');
const { raw } = require("body-parser");
const fs = require('fs');
const Path = require('path');
class ReportHandler {
	constructor(){
		this.ReportService = new ReportService();
		this.documentService = new DocumentService();
	}
	getCheckSlip = async (req,res)=>{
	    let loginDetails = req.query;  
		let report = {};
		report = req?.params;
		if( report.documentId == null || report.type == null){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
            {
                status: false,
                message: NAMES.VALIDATION_ERROR
            });
		}
		
		try{
			const [local, rest] = req.get("host").split(":");
			let Url = process.env.STATIC_PATH_PDf;
			//   local === "localhost"
			// 	? req.protocol + "://" + req.get("host") + "/pdfs"
			// 	: "http://" + req.get("host") + "/pdfs";
			let docsData ={};
			if(report.type != "userManual"){
				docsData = await this.documentService.getDocumentDetails(report);
			}
			let flag = false;
			if(report.type === 'engDocs'){
				flag = docsData.esignExecuted || [...docsData.executent, ...docsData.claimant].some(d => d.esignStatus === 'Y' || d.represent.some(f => f.esignStatus === 'Y'));
			}
			if(!flag){
				docsData.eStamp = report.stamp;
			let response = await this.ReportService.report(docsData,Url,report.type,loginDetails);
			let bitmap;
			const path =  Path.join(__dirname, `../../../../../pdfs/`);
			let fPath = `${path}/${response}.pdf`.replace("//","/")
			setTimeout(()=>{
				bitmap = fs.readFileSync(fPath);
				let convertBase64 = bitmap.toString('base64');
				return res.status(200).send({
					status:true,
					Success:true,
					Url: `${response}.pdf`,dataBase64:convertBase64, fileName:`${response}.pdf`, documentNature: docsData.documentNature
				})
			},1000);
			} else {
				return res.status(400).send({
					status: false,
					message: "Execution is done. Cannot generate document."
				})
			}
			
		}catch(ex){
			console.error("ReportHandler - getCheckSlip || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}



	getTeluguReports = async (req,res)=>{
		console.log("ReportHandler - getTeluguReports || Request is ",req.params);
		let report = {};
		report = req?.params;
		// if( report.documentId == null || report.type == null){
		// 	return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
        //     {
        //         status: false,
        //         message: NAMES.VALIDATION_ERROR
        //     });
		// }
		
		try{
			const [local, rest] = req.get("host").split(":");
			let Url =  req.protocol + "://" + req.get("host") + "/pdfs";
			//   local === "localhost"
			// 	? req.protocol + "://" + req.get("host") + "/pdfs"
			// 	: "http://" + req.get("host") + "/pdfs";
			let docsData = await this.documentService.getDocumentDetails({documentId:report.documentId});
			if(docsData.esignExecuted || [...docsData.executent, ...docsData.claimant].some(d => d.esignStatus === 'Y' || d.represent.some(f => f.esignStatus === 'Y'))){
				return res.status(400).send({
					status: false,
					message: "Execution is done for the document. Cannot create new file."
				})
			} else {
				let [type ,rest2]= docsData.registrationType.TRAN_DESC.split(" ");
			docsData.eStamp = report.stamp;
			let response = await this.ReportService.teluguReports(docsData,Url,type);
			let bitmap;
			const path =  Path.join(__dirname, `../../../../../pdfs/`);
			setTimeout(()=>{
				bitmap = fs.readFileSync(`${path}/${response}.pdf`);
				let convertBase64 = bitmap.toString('base64');
				return res.status(200).send({
					status:true,
					Success:true,
					Url: `${response}.pdf`,dataBase64:convertBase64, fileName:`${response}.pdf`
				})
			},1000);
			}
		}catch(ex){
			console.error("ReportHandler - getTeluguReports || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}


	mergePdf = async (req,res)=>{
		console.log("ReportHandler - mergePdf || Request is ", req.params);
		let report = {};
		report = req?.params;
		if( report.documentId == null){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
            {
                status: false,
                message: NAMES.VALIDATION_ERROR
            });
		}
		try{
			let response = await this.ReportService.merge_pdf(report);
			res.status(200).send(
                {
                    status:true, 
                    code: "200",
                    data: response
                }
            );

		}catch(ex){
			console.error("ReportHandler - getCheckSlip || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: pdeError.message
                }
            );
		}
	}
	getCheckSlipdata = async (req,res)=>{
		console.log("ReportHandler - getCheckSlipdata || Request is ", req.params);
		let report = {};
		report = req?.params;
		if( report.documentId == null || report.documentId == ''){
			return res.status(NAMES_STATUS_MAPPINGS[NAMES.VALIDATION_ERROR]).send(
            {
                status: false,
                message: NAMES.VALIDATION_ERROR
            });
		}
		
		try{
			let docsData ={};
				docsData = await this.ReportService.getDocumentPartyDetails(report);
			if(docsData){
				return res.status(200).send({
					status:true,
					Success:true,
					Data: docsData
				})
			} else {
				return res.status(400).send({
					status: false,
					message: "Party Details not found."
				})
			}
			
		}catch(ex){
			console.error("ReportHandler - getCheckSlipdata || Error :", ex.message);
            var pdeError = constructPDEError(ex);
            return res.status(NAMES_STATUS_MAPPINGS[pdeError.name]).send(
                {
                    status: false,
                    message: NAMES.INTERNAL_SERVER_ERROR
                }
            );
		}
	}
}

module.exports = ReportHandler;