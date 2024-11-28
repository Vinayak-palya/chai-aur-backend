import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath){
            return null;
        }
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        console.log(response);
        // console.log("file has been uploaded on cloudinary successfully")
        fs.unlinkSync(localFilePath)
        return response
    }
    catch(error){
        console.log(localFilePath);
        fs.unlinkSync(localFilePath)
        // remove the locally saved temporary file as the upload operation got failed
    }
}

const createPublicId = async(cloudinaryLink) => {
    const array = cloudinaryLink.split("/")
    const public_id = array[array.length- 1]
    return public_id
}

const deleteFromCloudinary = async (public_id) => {
    try {
        const result = await cloudinary.uploader.destroy(public_id)
        console.log(result)
        return result
    } catch (error) {
        console.error("error deleting file from cloudinary", error)
    }
}


export {
    uploadOnCloudinary,
    deleteFromCloudinary,
    createPublicId
}