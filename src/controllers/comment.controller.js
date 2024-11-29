import mongoose from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {Apiresponse} from "../utils/Apiresponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const pages = parseInt(page) || 1
    const limits = parseInt(limit) || 10
    
    const skip = (pages - 1)*limits

    if(!videoId)
        {
            throw new ApiError(404, "video Id not found")
        } 
    const video = await Video.findById(videoId)
    if(!video)
    {
        throw new ApiError(404, "video not found")
    }
    const comments = await Comment.aggregate([
        {
            $match:{
                video: mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $skip:skip
        },
        {
            $limit:limits
        }
    ])
    if(comments.length === 0)
    {
        throw new ApiError(404, "No comments found for the video")
    }
    return res
           .status(200)
           .json(new Apiresponse(200, comments, "comments fetched successfully")) 
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    const { content } = req.body
    const { videoId } = req.params
    const { userId } = req.user?._id

    if(!content)
    {
        throw new ApiError(404, "content is missing ")
    }
    if(!videoId){
        throw new ApiError(404, "video not found")
    }
    if(!userId){
        throw new ApiError(404, "user not authenticated not found")
    }
    
    const comment = await Comment.create(
        {
            content,
            owner:userId,
            video:videoId
        }
    )
    if(!comment)
    {
        throw new ApiError(404, "no content provided")
    }

    return res
           .status(200)
           .json(new Apiresponse(200, "comment created")) 
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body
    if(!commentId){
        throw new ApiError(404, "comment id not found")
    }
    if(!content){
        throw new ApiError(400, "please provide a content for your content")
    }
    const updatedComment = await Comment.findOneAndUpdate(
        {
            _id:commentId,
            owner:req.user._id
        },
        {
            content:content,
        },
        {
            new:true
        }
    
    )
    if(!updatedComment)
    {
        throw new ApiError(500, "unable to updateComment")
    }
    return res
            .status(200)
            .json(new Apiresponse(200, updatedComment, "comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    if(!commentId){
        throw new ApiError(404, "comment id not found")
    }
    const findComment = await Comment.findById(commentId)
    if(!findComment)
    {
        throw new ApiError(404, "no comment found to delete")
    }
    if(!findComment)
    {
        throw new ApiError(404, "comment not found")
    }
    const deleteComment = await Comment.findByIdAndDelete(
        {
            _id:commentId,
            owner:req.user._id
        }
    )
    return res
           .status(200)
           .json(new Apiresponse(200, deleteComment ,"comment has been deleted successfuly")) 
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }