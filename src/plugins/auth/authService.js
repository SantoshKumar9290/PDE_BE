var jwt = require('jsonwebtoken');
const userModel = require('../../model/userModel');
const officerModel = require('../../model/officerModel');
const docsModel = require("../../model/documentDetailsModel")
const {decryptWithAESPassPhrase, encryptWithAESPassPhrase} = require('../../utils/index');
const fs = require('fs');
const Path = require('path');
const { getDataFromCache } = require('../nodeCache/myCache');
const path = Path.join(__dirname,'../../../certificates/jwtRS256.key')
const RSA_PR_KEY = fs.readFileSync(path);
const verifyUser = (req, res) => {
    try {
        return new Promise(function (resolve, reject) {
            const Header = req.headers["authorization"];
            if (typeof Header !== "undefined") {
                try {
                    const verified = jwt.verify(Header, RSA_PR_KEY,{algorithms:'RS256'});

                    if (verified) {
                        resolve(verified);
                    } else {
                        reject('Invalid User');
                    }
                } catch (error) {
                    reject('Invalid User');
                }
            } else {
                reject('Invalid User');
            }
        })
    } catch (e) {
        logger.warn(e.message);
        res.status(403).send({
            success: false,
            message: e.message,
            data: {}
        });
    }
}

const authUser = (req, res, next) => {
    verifyUser(req, res).then(result => {
        req.userId = result.userId;
        req.userTypeId = result.userTypeId;
        next();
    }).catch(error => {
        res.status(401).send({
            status: false,
            message: error,
            data: {}
        });
    });
}

const authGenerator = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}



const getUserInfo = async (user)=>{
	const userInfo= {
		_id:user._id,
		userId:user._id,
		loginEmail: user.loginEmail,
		loginName:user.loginName,
		loginMobile: user.loginMobile,
		loginType:user.loginType,
        loginId:user.loginId
	}

	let userAadhaar = 0;
	if(user!=null && user!=undefined && user?.aadhar)
		userAadhaar = parseInt(user.aadhar);
	userInfo.aadhar = userAadhaar;
	if(user.loginType === "officer"){
		userInfo.sroDistrict = user.sroDistrict;
		userInfo.sroOffice = user.sroOffice;
		userInfo.sroNumber = user.sroNumber;
		userInfo.sroName = user.sroName;
	}
	return userInfo;
};

const createToken =async (user,refreshTokenUrl) => {

	let jwtSecretKey = RSA_PR_KEY;
	const expiresIn =process.env.JWT_EXP_IN;
	const token = jwt.sign(user,jwtSecretKey,{ expiresIn: expiresIn,algorithm:'RS256' });
	// await tokenModel.findOneAndUpdate({userId:user._id,loginType:user.loginType,status:false},{refreshToken:refreshTokenUrl,status:true},{upsert:true});
	return{
        token,
        expires: expiresIn,
		refreshTokenUrl
    };
}

/*Middleware for verifying the JWT Token. */
const verifyjwt = async function (req, res, next) {
	try {
		let tokenHeader = req.headers['authorization'];
		if (tokenHeader) {
			let token = await tokenHeader.split(" ");
			  let decoded = jwt.verify(token[1], RSA_PR_KEY,{algorithms:"RS256"});
			if (decoded) {
				let isTokenInvalid = getDataFromCache(token[1]);
				if(isTokenInvalid != null && isTokenInvalid == true){
					return res.status(401).json({ success: false, error: 'Unauthorized Token. User Token is not valid.' });
				}
				let user;
				req.user = decoded;
				let loginTypeVal = (decoded.loginType)
                if(decoded.loginMode =='VSWS'){
                return next();
                }
				if(loginTypeVal =='officer'){
					user = await officerModel.findOne({loginEmail:req.user.loginEmail,loginType:req.user.loginType});
				}else if(loginTypeVal =='USER' || loginTypeVal =='CSC'){
                    if(decoded.loginEmail == 'CRDA'){
                       loginTypeVal = 'CRDA'
                    }
					user = await userModel.findOne({loginEmail:req.user.loginEmail,loginType:loginTypeVal});
				}else if(loginTypeVal =='SERVICES'){
					user = await userModel.findOne({loginName:req.user.loginName,loginType:req.user.loginType});
				}
				if(user == undefined || user ==  null){
					return res.status(401).json({ success: false, error: 'Unauthorized Access.' })
				}
				let currentTime = (new Date().getTime())/1000;
				if(decoded.exp < currentTime)
					return res.status(401).json({ success: false, error: 'Token Validity Expired.' });
				else    
					return next();
				// return res.status(200).json({ success:decoded})
			}else{
				return res.status(401).json({ success: false, error: 'Unauthorized Token. User Token required.' });
			}      
		}else{
			return res.status(401).json({ success: false, error: "Unauthorized Token. User Token required." })
		}
	} catch (error) {
		console.log("error ::: ", error);
		return res.status(401).json({ success: false, error: 'JWT Token is expired.' })
	}
}

const verifyAPIKey = function (req, res, next) {
    try {
        console.log("Inside of validateThirdPartyAccess :::: ");
        // const authHeader = req.headers["authorization"];
 
        const APIKEY = req.headers["api-key"];
        console.log("APIKEY :::: ", APIKEY);
        if (APIKEY != undefined) {
            try {
                let verified;
                // let validAuthValue = 'Basic '+process.env.BASIC_AUTH_CODE;
                console.log("APIKEY :::: ", process.env.API_KEY);
 
                if(APIKEY == process.env.API_KEY)
                    verified = true;
 
                if (verified) {
                    req.isMeeSeva = true;
                    console.log("End of validateThirdPartyAccess :::: ");
                    return next();
                } else {
                    console.log("End of validateThirdPartyAccess :::: ");
                    return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
                }
            } catch (error) {
                console.log("End of validateThirdPartyAccess :::: ");
                return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
            }
        } else {
            console.log("End of validateThirdPartyAccess :::: ");
            return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
        }
    } catch (e) {
        console.log("End of validateThirdPartyAccess :::: ");
        logger.warn(e.message);
        return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
    }
}

const validateThirdPartyAccess = function (req, res, next) {
    try {
        console.log("Inside of validateThirdPartyAccess :::: ");
        const authHeader = req.headers["authorization"];
        const APIKEY = req.headers["api-key"];
        console.log("authHeader :::: ", authHeader);
        console.log("APIKEY :::: ", APIKEY);
        if (authHeader != undefined && APIKEY != undefined) {
            try {
                let verified;
                let validAuthValue = 'Basic '+process.env.BASIC_AUTH_CODE;
                console.log("validAuthValue :::: ", validAuthValue);
                console.log("APIKEY :::: ", process.env.EC_API_KEY);
 
                if(authHeader == validAuthValue && APIKEY == process.env.EC_API_KEY)
                    verified = true;
 
                if (verified) {
                    req.isMeeSeva = true;
                    console.log("End of validateThirdPartyAccess :::: ");
                    return next();
                } else {
                    console.log("End of validateThirdPartyAccess :::: ");
                    return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
                }
            } catch (error) {
                console.log("End of validateThirdPartyAccess :::: ");
                return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
            }
        } else {
            console.log("End of validateThirdPartyAccess :::: ");
            return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
        }
    } catch (e) {
        console.log("End of validateThirdPartyAccess :::: ");
        logger.warn(e.message);
        return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
    }
}

const validateCDMAAccess = function (req, res, next) {
    try {
        console.log("Inside of validateThirdPartyAccess :::: ");
        const authHeader = req.headers["authorization"];
        const APIKEY = req.headers["api-key"];
        console.log("authHeader :::: ", authHeader);
        console.log("APIKEY :::: ", APIKEY);
        if (authHeader != undefined && APIKEY != undefined) {
            try {
                let verified;
                let validAuthValue = 'Basic '+process.env.BASIC_AUTH_CODE;
                console.log("validAuthValue :::: ", validAuthValue);
                console.log("APIKEY :::: ", process.env.EC_API_KEY);
 
                if(authHeader == validAuthValue && APIKEY == process.env.EC_API_KEY)
                    verified = true;
 
                if (verified) {
                    req.isMeeSeva = true;
                    console.log("End of validateThirdPartyAccess :::: ");
                    return next();
                } else {
                    console.log("End of validateThirdPartyAccess :::: ");
                    return res.status(401).json({ 
                        status:"Failure",
                        code:'401',
                        error: 'Unauthorized User Access.' });
                }
            } catch (error) {
                console.log("End of validateThirdPartyAccess :::: ");
                return res.status(401).json({ 
                    status: "Failure",
                    code: '401',
                    error: 'Unauthorized User Access.'
                });
            }
        } else {
            console.log("End of validateThirdPartyAccess :::: ");
                return res.status(401).json({ 
                    status: "Failure",
                    code: '401',
                    error: 'Unauthorized User Access.'
                });
        }
    } catch (e) {
        console.log("End of validateThirdPartyAccess :::: ");
        logger.warn(e.message);
                return res.status(401).json({ 
                    status: "Failure",
                    code: '401',
                    error: 'Unauthorized User Access.'
                });
    }
}

const roleAuthorization = (roles, hashCheck = false)=>{
	return async (req,res,next)=>{
		// if(hashCheck){
		// 	if(req == null || req.body == null || req.body.hash == null){
		// 		return res.status(422).send({ error: 'Request Mismatch.' });
		// 		// next();
		// 	}
		// 	var origialText = decryptWithAESPassPhrase(req.body.hash.toString(), "123456");
		// 	const { ['hash']: hash, ...reqBodyWithoutHash } = req.body;
		// 	if(JSON.stringify(reqBodyWithoutHash) != origialText){
		// 		return res.status(422).send({ error: 'Request Mismatch.' });
		// 		// return next();
		// 	}

		// }
		let query;
		if(req.method === "DELETE"){
			query = req.params.documentId ? {documentId:req.params.documentId}:req.params.applicationId?{documentId:req.params.applicationId}:{documentId:req.params.docId};
		}else{
			query = req.body.documentId ?{documentId:req.body.documentId}:req.body.applicationId?{documentId:req.body.applicationId}:{documentId:req.body.document_id};
		}

		const documentData = await docsModel.findOne(query);
        const user = req.user;
        if(user.loginMode == "VSWS" ){
           return next();
		}
		if(user.loginType == "USER" && documentData && documentData.userId !== user.userId){
			return res.status(401).send({statusCode:401, error: `UnAuthorized` });
            next();
		}
        let findUser =await userModel.findById(user.userId);
		if(findUser == null){
			findUser = await officerModel.findOne({_id:user._id})
		}
        if(findUser){
            if(findUser.loginType == 'CRDA'){
                findUser.loginType = 'USER'
            }
        }
        if(!findUser){
            res.status(422).send({ error: 'No user found.' });
            return next();
        }
        else if(roles.indexOf(findUser.loginType) > -1){
            return next();
        }else{
            return res.status(401).send({statusCode:401, error: `As a ${roles},Your Not a authorized person to view this content` });
            next();
        }
    }
}


const validateAPIkey = function (req, res, next) {
    try {
        console.log("Inside of validateThirdPartyAccess :::: ");
        const authHeader = req.headers["authorization"];
        const APIKEY = req.headers["api-key"];
        if (authHeader != undefined && APIKEY != undefined) {
            try {
                let verified;
                let validAuthValue = 'Basic '+process.env.IGRS_BASIC_AUTH_CODE;
                let validAPDBMSAuthValue = 'Basic '+process.env.APDBMS_BASIC_AUTH_CODE;                
                if( (authHeader == validAuthValue || authHeader == validAPDBMSAuthValue) && APIKEY == process.env.API_KEY)
                    verified = true;
 
                if (verified) {
                    req.isMeeSeva = true;
                    console.log("End of validateThirdPartyAccess :::: ");
                    return next();
                } else {
                    console.log("End of validateThirdPartyAccess :::: ");
                    return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
                }
            } catch (error) {
                console.log("End of validateThirdPartyAccess :::: ");
                return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
            }
        } else {
            console.log("End of validateThirdPartyAccess :::: ");
            return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
        }
    } catch (e) {
        console.log("End of validateThirdPartyAccess :::: ");
        logger.warn(e.message);
        return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
    }
}

const verifyThirdPartyToken = async function(req, res, next)
    {
        try {
            let apiKey = req.headers['api-key'];
            let origin = req.headers['Origin'];
            if(origin==null)
            origin = "";
            if (apiKey && apiKey == process.env.API_KEY_VMC) {
                return next();
            } else {
                return res.status(401).json({ success: false, error: 'Unauthorized Access.' })
            }
        } catch (error) {
        console.log("error ::: ", error);
        return res.status(401).json({ success: false, error: 'Session Expired, Please Login' })
      }
    }
   const validateAPIEODBkey = function (req, res, next) {
    try {
        console.log("Inside of validateThirdPartyAccess :::: ");
        const authHeader = req.headers["authorization"];
        const APIKEY = req.headers["api-key"];
        if (authHeader != undefined && APIKEY != undefined) {
            try {
                let verified;
                let validAuthValue = 'Basic '+process.env.IGRS_EODB_BASIC_AUTH_CODE;
                // let validAPDBMSAuthValue = 'Basic '+process.env.APDBMS_BASIC_AUTH_CODE;                
                if( (authHeader == validAuthValue ) && APIKEY == process.env.API_KEY)
                    verified = true;
 
                if (verified) {
                    req.isMeeSeva = true;
                    console.log("End of validateThirdPartyAccess :::: ");
                    return next();
                } else {
                    console.log("End of validateThirdPartyAccess :::: ");
                    return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
                }
            } catch (error) {
                console.log("End of validateThirdPartyAccess :::: ");
                return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
            }
        } else {
            console.log("End of validateThirdPartyAccess :::: ");
            return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
        }
    } catch (e) {
        console.log("End of validateThirdPartyAccess :::: ");
        logger.warn(e.message);
        return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
    }
}
   
const validateAPIkeyAPCTDP = function (req, res, next) {
    try {
        console.log("Inside of validateThirdPartyAccess :::: ");
        const authHeader = req.headers["authorization"];
        const APIKEY = req.headers["api-key"];
        if (authHeader != undefined && APIKEY != undefined) {
            try {
                let verified;
                let validAuthValue = 'Basic '+process.env.APDTCP_BASIC_AUTH_CODE;
                console.log(validAuthValue,"validAuthValue");
                console.log(authHeader,"authHeader");
                
                
                if( (authHeader == validAuthValue ) && APIKEY == process.env.API_KEY)
                    verified = true;
 
                if (verified) {
                    req.isMeeSeva = true;
                    console.log("End of validateThirdPartyAccess :::: ");
                    return next();
                } else {
                    console.log("End of validateThirdPartyAccess :::: ");
                    return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
                }
            } catch (error) {
                console.log("End of validateThirdPartyAccess :::: ");
                return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
            }
        } else {
            console.log("End of validateThirdPartyAccess :::: ");
            return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
        }
    } catch (e) {
        console.log("End of validateThirdPartyAccess :::: ");
        logger.warn(e.message);
        return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
    }
}
const validateAPIkeyAPCFSS = function (req, res, next) {
    try {
        console.log("Inside of validateThirdPartyAccess :::: ");
        const authHeader = req.headers["authorization"];
        const APIKEY = req.headers["api-key"];
        if (authHeader != undefined && APIKEY != undefined) {
            try {
                let verified;
                let validAuthValue = 'Basic '+process.env.APCFSS_BASIC_AUTH_CODE;
                
                if( (authHeader == validAuthValue ) && APIKEY == process.env.API_KEY)
                    verified = true;
 
                if (verified) {
                    req.isMeeSeva = true;
                    console.log("End of validateThirdPartyAccess :::: ");
                    return next();
                } else {
                    console.log("End of validateThirdPartyAccess :::: ");
                    return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
                }
            } catch (error) {
                console.log("End of validateThirdPartyAccess :::: ");
                return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
            }
        } else {
            console.log("End of validateThirdPartyAccess :::: ");
            return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
        }
    } catch (e) {
        console.log("End of validateThirdPartyAccess :::: ");
        logger.warn(e.message);
        return res.status(401).json({ success: false, error: 'Unauthorized User Access.' });
    }
}

// exports.authUser = authUser;
// exports.authGenerator = authGenerator;
module.exports ={getUserInfo,createToken,authUser,authGenerator,verifyjwt,roleAuthorization,validateCDMAAccess,validateThirdPartyAccess, verifyAPIKey, validateAPIkey, verifyThirdPartyToken,validateAPIEODBkey,validateAPIkeyAPCTDP,validateAPIkeyAPCFSS}