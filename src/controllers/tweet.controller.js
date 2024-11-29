import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {Apiresponse} from "../utils/Apiresponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    const {_id : userId} = req.user

    if(!content)
    {
        throw new ApiError(400, "content is required")
    }
    const tweet = await Tweet.create(
        {
            content,
            owner:userId
        }
    )
    if(!tweet)
    {
        throw new ApiError(500, "unable to create tweet, internal server error")
    }

    return res
    .status(201)
    .json(new Apiresponse(201, tweet, "tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {_id:userId} = req.user

    const tweets = await Tweet.aggregate([
        {
            $match:{
                owner:userId
            }
        }
    ])
    if(tweets.length === 0)
    {
        return res
        .status(404)
        .json(new Apiresponse(404, "No tweets found for the current user"))
    }
    return res
    .status(200)
    .json(new Apiresponse(200, tweets, "tweets fteched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {content} = req.body
    const {tweetId} = req.params

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Please provide content for the update");
    }

    const updatedTweet = await Tweet.findOneAndUpdate(
        {
            _id:tweetId,
            content:content
        }
    )

    if(!updatedTweet)
    {
        throw new ApiError(500, "unable to update tweet")
    }

    return res
    .status(200)
    .json(new Apiresponse(200, updatedTweet, "tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }
    const deletedTweet = await Tweet.findOneAndDelete(
        {
            _id:tweetId
        }
    )
    if(!deletedTweet)
    {
        throw new ApiError(500, "unable to delete the tweet")
    }

    return res
    .status(200)
    .json(new Apiresponse(200, deletedTweet, "tweet delted succesfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}