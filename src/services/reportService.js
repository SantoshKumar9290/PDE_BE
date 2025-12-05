const { NAMES } = require("../constants/errors");
const PDEError = require("../errors/customErrorClass");
const { constructPDEError } = require("../handlers/errorHandler");
let {generatReport,genTeluguReports} = require('../utils/report');
const Path = require('path');
const pdfMake = require('pdfmake');
const pdfDoc = require('pdfkit');
const mongoose = require('mongoose');
const fs = require('fs');
const PDFMerger = require('pdf-merger-js');
const PDFPageCounter = require('pdf-page-counter');
const { PDFDocument } = require('pdf-lib');
const {Logger} = require('../../services/winston');
const DocumentDetailsDao = require("../dao/documentDetailsDao");
const PartiesService = require("../services/partiesService");


var fonts = {
	Roboto: {
	  normal:
		"fonts/telugu.ttf",
	  bold: "node_modules/roboto-font/fonts/Roboto/roboto-bold-webfont.ttf",
	  italics:
		"node_modules/roboto-font/fonts/Roboto/roboto-italic-webfont.ttf",
	  bolditalics:
		"node_modules/roboto-font/fonts/Roboto/roboto-bolditalic-webfont.ttf",
	}
};

class ReportService {
	constructor(){
		this.documentDetailsDao = new DocumentDetailsDao();
		this.partiesService = new PartiesService();
	}

	createTheFile  = async (finalReport, documentPath) => {
		return new Promise(async resolve => {
			let createWriteData ;
			let pdfmake = new pdfMake(fonts);
			// const finalReport = await generatReport(reqData,reportType);
			let pdfDoc = pdfmake.createPdfKitDocument(finalReport, {});
			pdfDoc.pipe(createWriteData = fs.createWriteStream(documentPath));
			pdfDoc.end();
			createWriteData.on('finish', resolve);
		})
	}

	fileResolve  = async (createWriteData) => {
		return new Promise(async resolve => {
			createWriteData.on('finish', resolve);
		})
	}

		
	report = async (reqData,reqUrl,reportType,loginDetails)=>{
		try{
			console.log("ReportService - report - reqUrl", reqUrl);
			const path = Path.join(__dirname, `../../../../../pdfs/`);
			if(!fs.existsSync(path)){
				fs.mkdirSync(path);
			}
			if(!fs.existsSync(`${path}/${reqData.applicationId}`)){
				fs.mkdirSync(`${path}/${reqData.applicationId}`);
			}
			if(reportType ==="formSixty"){ 
				return `formSixty`;
			}
			if(reportType === "userManual"){
				return `userManual`;
			}
			if(reportType === "document"){
				return `${reqData.applicationId}/document`;
			}
			console.log("ReportService - report", path);
			// let pdfmake = new pdfMake(fonts);
			const finalReport = await generatReport(reqData,reportType,`${path}/${reqData.applicationId}/${reportType}.pdf`,loginDetails );
			// let pdfDoc = pdfmake.createPdfKitDocument(finalReport, {});
			// pdfDoc.pipe(fs.createWriteStream(`${path}/${reqData.applicationId}/${reportType}.pdf`));
			// pdfDoc.end();
			// await this.createTheFile(finalReport, );
			if(reportType !== "engDocs"){
                		await this.createTheFile(finalReport, `${path}/${reqData.applicationId}/${reportType}.pdf`);
            		}
			let fUrl;
			if(reportType !== "engDocs"){
				fUrl = `${reqData.applicationId}/${reportType}`
			}else{
				let imageFolder  ="";
				let pdfPaths =[];
				if(fs.existsSync(Path.join(__dirname,`../../../../../pdfs/public/uploads/${reqData.applicationId}`)) === true){
					imageFolder =Path.join(__dirname,`../../../../../pdfs/public/uploads/${reqData.applicationId}`);
					fs.readdirSync(imageFolder).forEach(file => {
						pdfPaths.push(file);
					});
					fs.readdirSync(imageFolder).forEach(file => {
						pdfPaths.push(file);
					});
				}
			   if(pdfPaths && pdfPaths.length === 0){
				   fUrl = `${reqData.applicationId}/${reportType}`;
			   }else{
				   let path = await this.mergingReports(reqData.applicationId,reportType);
				   console.log("Merging REPORTS :::",`${path}`)
					fUrl =`${path}`; 
			   }
			}
			console.log("URL :::",fUrl)
			return fUrl;
		}catch(ex){
			Logger.error(ex.message);
			console.error("ReportService - report || Error : ", ex.message);
            throw constructPDEError(ex);
		}
	};


	teluguReports = async(reqData,rUrl, type)=>{
		try{
			console.log("teluguReports - report - reqUrl", rUrl);
			const path = Path.join(__dirname, `../../../../../pdfs`);
			if(!fs.existsSync(path)){
				fs.mkdirSync(path);
			}
			if(!fs.existsSync(`${path}/${reqData.applicationId}`)){ //telugu folder later change with application id
				fs.mkdirSync(`${path}/${reqData.applicationId}`);
			}
			let fPath =`${path}/${reqData.applicationId}/${type}Telugu.pdf`;
			await genTeluguReports(reqData,fPath,type);
			// return `${rUrl}/${reqData.applicationId}/${type}Telugu.pdf`;
			let imageFolder ;
			let pdfPaths =[];
			let fUrl;
			if(fs.existsSync(Path.join(__dirname,`../../../../../pdfs/public/uploads/${reqData.applicationId}`)) === true){
				imageFolder =Path.join(__dirname,`../../../../pdfs/public/uploads/${reqData.applicationId}`);
				fs.readdirSync(imageFolder).forEach(file => {
					pdfPaths.push(file);
				});
				type = `${type}Telugu`
				let path = await this.mergingReports(reqData.applicationId,type);
				console.log("Merging REPORTS :::",`${rUrl}/${path}`)
				fUrl =`${path}`;
			}else{
				fUrl = `${reqData.applicationId}/${type}Telugu`;
			}
			console.log("URL :::",fUrl)
			return fUrl;
		}catch(ex){
			Logger.error(ex.message);
			console.log("ERROR :::",ex)
			throw constructPDEError(ex);
		}
	}
	
	mergingReports = async (documentId,type)=>{
		try {
			console.log("ReportService - mergingReports ::",documentId,type);
			let testFolder = Path.join(__dirname, `../../../../../pdfs/${documentId}`);
			let imageFolder = Path.join(__dirname,`../../../../../pdfs/public/uploads/${documentId}`);
			let pdfPaths =[];
			fs.readdirSync(imageFolder).forEach(file => {
				pdfPaths.push(file);
			});
			if(pdfPaths && pdfPaths.length === 0){
				throw new PDEError("No Merging Files Found")
			}
			let createWriteData;
			let pdfDocs = new pdfDoc();
			pdfDocs.pipe(createWriteData = fs.createWriteStream(`${testFolder}/images.pdf`));
			if(pdfPaths.length >0){
				let x1=40,y1=20;
				for(let i in pdfPaths){
					if(y1 > 500 && pdfPaths[i]){
						pdfDocs.addPage();
						y1=20;
					}
					let extName = Path.extname(pdfPaths[i]);
					if(extName === ".png" || extName === ".jpg" || extName === ".jpeg"){
						pdfDocs.image(Path.join(__dirname, `../../../../../pdfs/public/uploads/${documentId}/` + pdfPaths[i]),x1,y1,{ fit: [400, 400], align: 'left', valign: 'justify'}).stroke();
						y1=y1+420;
						pdfDocs.moveDown();
					}
				}
				pdfDocs.end();
			}
			await this.fileResolve(createWriteData);
			var merger = new PDFMerger();
			// (async () => {
				await merger.add(`${testFolder}/${type}.pdf`);
				await merger.add(`${testFolder}/images.pdf`); 
				if(pdfPaths.length >0){
					for(let i in pdfPaths){
						let extName = Path.extname(pdfPaths[i]);
						if(extName === ".pdf"){
							await merger.add(`${imageFolder}/${pdfPaths[i]}`);
						}
					}
				}
				await merger.save(`${testFolder}/${type}.pdf`);
			// })();
			return `${documentId}/${type}`
		} catch (ex) {
			Logger.error(ex.message);
			console.log("ERRR :::",ex.message);
			throw constructPDEError(ex.message);
		}
	}

	merge_pdf = async (reqBody) => {

		let pdf1Path = Path.join(__dirname, `../../../../../pdfs/${reqBody.documentId}`);
		let pdf2Path = Path.join(__dirname, `../../../../../pdfs/${reqBody.documentId}/SaleTelugu.pdf`);
		// let pdfPath1Arr =[];
		// let pdfPath2Arr =[];
		// fs.readdirSync(pdf1Path).forEach(file => {
		// 	if(file === 'engDocs.pdf')
		// 		pdfPath1Arr.push(file);
		// 	else if(file === 'SaleTelugu.pdf')
		// 		pdfPath2Arr.push(file)
		// });
		let dataBuffer1 = fs.readFileSync("../../../../../pdfs/"+reqBody.documentId+"/engDocs.pdf");
		let pdf1Data = await PDFPageCounter(`../../../../../pdfs/${reqBody.documentId}/SaleTelugu.pdf`);
		let dataBuffer2 = fs.readFileSync(pdf2Path);
		let pdf2Data = await PDFPageCounter(dataBuffer2);
		// let maxPageCount = pdf1Data.numpages > pdf2Data.numpages ? pdf1Data.numpages : pdf2Data.numpages;
		var merger = new PDFMerger();
		for(let i=1; i<= pdf1Data.numpages; i++){
			for(let j=1; j<= pdf2Data.numpages; i++){
				for(let k in dataBuffer1){
					for(let l in pdf2Path){
						await merger.add(dataBuffer1[l], pdf1Data.numpages[i]);
						await merger.add(dataBuffer2[k], pdf1Data.numpages[j]);
					}
				}
			}
		}
		let fPath = Path.join(__dirname, `../../../../../pdfs/${documentId}/merge.pdf`);
		await merger.save(fPath);
		return `${documentId}/merge.pdf`
	}
	
	getDocumentPartyDetails = async (documentData) => {		
        try {
			const docIdExist = Object.keys(documentData).includes('documentId');
            var documentDbFilter = {...documentData};
			let documentDbResponse;
			if(docIdExist === true){
				documentDbResponse= await this.documentDetailsDao.getOneByFilters(documentDbFilter);
				if(documentDbResponse == null || documentDbResponse.length == 0){
					console.log("ReportService - getDocumentPartyDetails || No Document Present");
					throw new PDEError({name: NAMES.NOT_FOUND, err: "No Document Present"});
				}
				let partySaleDetailsDbResponse = await this.partiesService.getParties(documentDbResponse.documentId);								
				return partySaleDetailsDbResponse;
			}
        } catch (error) {
			Logger.error(error.message);
            console.error("ReportService - getDocumentPartyDetails ||  Error : ", error);
            throw constructPDEError(error);
        }
    }

}

module.exports = ReportService;