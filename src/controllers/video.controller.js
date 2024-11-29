import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import { Apiresponse} from "../utils/Apiresponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {createPublicId, deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
try {
        const { page = 1, limit = 10, query ="", sortBy = "createdAt", sortType = 1, userId } = req.query
        //TODO: get all videos based on query, sort, pagination
        const pagenumber = parseInt(page) || 1
        const limits = parseInt(limit) || 10
    
        const skip = (pagenumber - 1)*limits
    
        const idValidate = isValidObjectId(userId)
        if(!idValidate)
        {
            throw new ApiError(400, "please provide a valid userId")
        }
        const videos = await Video.aggregate([
            {
                $match:{
                    $or:[
                        {
                            title:{
                                $regex:query,
                                options:i
                            }
                        },
                        {
                            description:{
                                $regex:query,
                                options:i
                            }
                        },
                    ]
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"channel"
                }
            },
            {
                $sort:{
                    [sortBy]: sortType === '1' ? 1: -1
                }
            },
            {
                $skip:skip
            },
            {
                $limit:limits
            }
        ])
        if(!videos || videos.length === 0)
        {
            throw new ApiError(404, "no video found matching the  query")
        }

        return res
        .status(200)
        .json(new Apiresponse(200, videos, "video fetched successfully"))
} catch (error) {
    console.log(error)
}
    
})

const publishAVideo = asyncHandler(async (req, res) => {
try {
        const { title, description} = req.body
        // TODO: get video, upload to cloudinary, create video
    
        const {_id:ownerId} = req.user;
        // getting a video
        const videoFilePath = req.files?.videoFile[0]?.path;
        const thumbNailPath = req.files?.thumbNail[0]?.path;
    
        if(!videoFilePath || !thumbNailPath){
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
    try {
        const { videoId } = req.params
        //TODO: get video by id
        const video = await Video.findById(videoId)
        if(!video)
        {
            throw new ApiError(404, "video not found")
        }
        return res
        .status(200)
        .json(new Apiresponse(200, video, "video fetched successfully"))
    } catch (error) {
        console.log(error)
    }

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Ensure videoId is provided
    if (!videoId) {
        throw new ApiError(404, "Video not found");
    }

    // const prevThumbNail = await Video.findById(req.video?._id)?.thumbNail
    // const public_id = createPublicId(prevThumbNail)
    // const result = deleteFromCloudinary(public_id)
    // console.log(result);
    const prevThumbNail = asyncHandler(async (req, res) => {
        try {
            // Ensure video exists
            const video = await Video.findById(req.video?._id);
            if (!video) {
                throw new ApiError(404, "Video not found");
            }
    
            const prevThumbNail = video.thumbNail;
    
            
                const public_id = createPublicId(prevThumbNail);
    
                // Ensure deletion is awaited
                const result = await deleteFromCloudinary(public_id);
                console.log("Cloudinary deletion result:", result);
                return result;

        } catch (error) {
            console.error("Error deleting previous thumbnail:", error);
            throw error; // Rethrow for global error handler
        }
    });
    
    prevThumbNail();
    
    const { title, description } = req.body;
    const thumbNailPath = req.files?.thumbNail?.[0]?.path;; // Extract thumbNailPath directly

    // Prepare update fields dynamically
    const updateFields = {};

    if (thumbNailPath) {
        // Upload thumbnail to Cloudinary
        const thumbNail = await uploadOnCloudinary(thumbNailPath);
        if (thumbNail?.url) {
            updateFields.thumbNail = thumbNail.url;
        }
    }

    if (title) updateFields.title = title;
    if (description) updateFields.description = description;

    // Update the video
    const video = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateFields },
        { new: true }
    );

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new Apiresponse(200, video, "Video updated successfully"));
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // TODO: delete video
    if (!videoId) {
        throw new ApiError(404, "Video not found");
    }

    // Helper function to delete the video from Cloudinary
    const deleteVideoFromCloudinary = asyncHandler(async (videoId) => {
        try {
            // Find the video document by ID
            const video = await Video.findById(videoId);
            if (!video) {
                throw new ApiError(404, "Video not found");
            }

            const videoUrl = video.video; // Extract the video URL
            if (!videoUrl) {
                console.log("No video URL to delete.");
                return null;
            }

            // Create the public ID and delete the video from Cloudinary
            const publicId = createPublicId(videoUrl);
            const result = await deleteFromCloudinary(publicId);

            console.log("Cloudinary deletion result:", result);
            return result;
        } catch (error) {
            console.error("Error deleting video from Cloudinary:", error);
            throw error; // Rethrow for global error handling
        }
    });

    // Delete video from Cloudinary
    await deleteVideoFromCloudinary(videoId);

    // Delete video from database
    try {
        const video = await Video.findByIdAndDelete(videoId);
        if (video) {
            console.log("Video deleted:", video);
        } else {
            console.log("No video found with the given video ID");
        }
    } catch (error) {
        console.error("Error deleting video from database:", error);
    }

    // Send response
    res.status(200).json(new Apiresponse(200, null, "Video deleted successfully"));
});


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    try {
        if(!videoId)
        {
            throw new ApiError(404, "video not found")
        }
        const video = await Video.findByIdAndUpdate(
            videoId,
            {
                $set:{
                    isPublished:!video.isPublished
                }
            },
            {new:true}
        )
        return res
        .status(200)
        .json(new Apiresponse(200, "video ispublished status updated successfully"))
    } catch (error) {
        console.log(error)
    }
    
    
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}