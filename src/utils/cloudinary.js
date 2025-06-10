import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
    });

const UploadFile = async (localFilePath) => {
    if(!localFilePath) return null;

    try {
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })

        //console.log("File uploaded successfully to Cloudinary", response.url );
        fs.unlinkSync(localFilePath); // delete the file from local storage after upload
        //console.log("File deleted from local storage after upload");
        return response
        
    } catch (error) {
        
        fs.unlinkSync(localFilePath);
        return null; // return null if upload fails
         // delete the file from local storage
    }
}

export { UploadFile }
