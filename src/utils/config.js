// This object defines that which database model contains the document id or a unique key

const uniqueKeyInCollectionToStoreLogs = {
    'party_represent_detail': 'documentId',
    'document_details': "documentId",
    'party_sale_details': "document_id",
    'property_details': "propertyId",
    'party_details': "applicationId",
    'property_structure_details': "propertyId"
}
const thirdPartyDepartments={
    webland:'CCLA',
    muncipal:'CDMA',
    franking:'FRANKING',
    stockHolding:'STOCKHOLDING',
    rera:'RERA',
    passport:"PASSPORT",
    pan:"PAN",
    buildingPermission:"BUILDINGPERMISSION"
}
module.exports={uniqueKeyInCollectionToStoreLogs,thirdPartyDepartments}