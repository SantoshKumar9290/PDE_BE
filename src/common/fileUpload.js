const multer = require('multer');
const fs = require('fs');
const Path =require('path');
class FileUpload {
	
    uploadStorage = multer.diskStorage({
		
        destination: function (req, file, cb) {
			const reqParams =req.params;
			let imageDir;
			if(reqParams.fileName === 'document' || reqParams.fileName === 'anywheredocument' ){
				imageDir=Path.join(__dirname,`../../../../../pdfs/${reqParams.documentId}`);
				fs.mkdirSync(imageDir, { recursive: true })
			}else{
				imageDir=`./public/uploads/${reqParams.documentId}`;
				fs.mkdirSync(imageDir, { recursive: true })
			} 
            if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
                cb(null, imageDir)
            } else if (file.mimetype == "application/pdf") {
                cb(null, imageDir)
            } else {
                cb(new Error('invalid file type.'))
            }
        },
        filename: function (req, file, cb) {
			const reqParams =req.params;
			if(file.mimetype == "application/pdf"){
				if(reqParams.fileName === undefined){
					cb(null,file.fieldname +'.pdf')
				}else{
					cb(null, reqParams.fileName + '.pdf');
				}

			}else{
				if(reqParams.fileName ==undefined){
					cb(null,file.fieldname +'.png')
				}else{
					cb(null, reqParams.fileName + '.png');
				}
				
			}
            
        }
    });
    uploadStore = multer({ storage: this.uploadStorage });
}

module.exports = new FileUpload({});
