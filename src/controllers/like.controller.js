import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import { Apiresponse } from "../utils/Apiresponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const { _id: userId } = req.user;

    if(!userId)
    {
        throw new ApiError(400, "user is not authenticated")
    }

    if(!videoId)
    {
        throw new ApiError(404, "please provide a valid videoId")
    }
    const existingLike = await Like.findOne({ video: videoId, user: userId });
    if(!existingLike)
    {
        const like = await Like.create({ video: videoId, user: userId });

        if(!like)
        {
            throw new ApiError(500, "Unable to create like")
        }
        return res
        .status(200)
        .json(new Apiresponse(200, "video is liked by the user"))
    }

    const delLike = await Like.findOneAndDelete( {video: videoId, user: userId} )
    if(!delLike)
    {
        throw new ApiError(500, "Unable to unlike")
    }

    return res
    .status(204)
    .json(new Apiresponse(204, delLike, "unliked the video"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment


    const { _id: userId } = req.user;

    if(!userId)
    {
        throw new ApiError(400, "user is not authenticated")
    }

    if(!commentId)
    {
        throw new ApiError(404, "please provide a valid commentId")
    }
    const existingLike = await Like.findOne({ comment: commentId, user: userId });
    if(!existingLike)
    {
        const like = await Like.create({ comment: commentId, user: userId });

        if(!like)
        {
            throw new ApiError(500, "Unable to create like")
        }
        return res
        .status(200)
        .json(new Apiresponse(200, "comment is liked by the user"))
    }

    const delLike = await Like.findOneAndDelete( {comment: commentId, user: userId} )

    if(!delLike)
    {
        throw new ApiError(500, "Unable to unlike")
    }

    return res
    .status(204)
    .json(new Apiresponse(204, delLike, "unliked the comment"))


})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    const { _id: userId } = req.user;

    if(!userId)
    {
        throw new ApiError(400, "user is not authenticated")
    }

    if(!tweetId)
    {
        throw new ApiError(404, "please provide a valid TweetId")
    }
    const existingLike = await Like.findOne({ tweet: tweetId, user: userId });
    if(!existingLike)
    {
        const like = await Like.create({ tweet: tweetId, user: userId });

        if(!like)
        {
            throw new ApiError(500, "Unable to create like")
        }
        return res
        .status(200)
        .json(new Apiresponse(200, "tweet is liked by the user"))
    }

    const delLike = await Like.findOneAndDelete( {tweet: tweetId, user: userId} )

    if(!delLike)
    {
        throw new ApiError(500, "Unable to unlike")
    }

    return res
    .status(204)
    .json(new Apiresponse(204, delLike, "unliked the tweet"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const { _id: userId } = req.user;

    const videos = await Like.aggregate([
        {
            $match:{
                $and:[
                    {video:{$ne:null}},
                    {user:userId},
                ]
            }
        }
    ])
    if(videos.length === 0)
    {
        return res.status(404).json(new Apiresponse(404, "No video was liked by the user"));
    }
    return res
    .status(204)
    .json(new Apiresponse(204, videos, "Liked Video fetched successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}