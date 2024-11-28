import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {Apiresponse} from "../utils/Apiresponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    
})

const publishAVideo = asyncHandler(async (req, res) => {
try {
        const { title, description} = req.body
        // TODO: get video, upload to cloudinary, create video
    
        const {_id:ownerId} = req.user;
        // getting a video
        const videoFilePath = req.files?.videoFile[0]?.path;
        const thumbNailPath = req.files?.thumbNail[0]?.path;
    
        if(!videoFile || !thumbNail){
            throw new ApiError(404, "VideoFile or thumbNail is missing")
        }
    
        // uploading the video on cloudinary
        const videoFile = await uploadOnCloudinary(videoFilePath)
        const thumbNail = await uploadOnCloudinary(thumbNailPath)
    
        if(!videoFile || !thumbNail)
            {
                throw new ApiError(404, "avatar file or videoFile is missing")
            }    
            const duration = videoFile.duration

            // creating a video
            const newVideo = await Video.create({
                videoFile:videoFile.url,
                thumbNail:thumbNail.url,
                title,
                description,
                duration,
                owner:ownerId
            })

            const savedVideo = await newVideo.save();
            if(!savedVideo)
            {
                throw new ApiError(500 ,"something went wrong while saving the video")
            }
            return res
            .status(200)
            .json(new Apiresponse(200, savedVideo, "video saved successfully"))

} catch (error) {
    console.log(error)
}
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}