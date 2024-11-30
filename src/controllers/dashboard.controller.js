import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import { Apiresponse } from "../utils/Apiresponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const info = await Video.aggregate([
        {
            $match:{
                owner:req.user._id
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"liked"
            }
        },
        {
            $addFields:{
                totalLikes:{
                    $size:"$liked"
                }
            }
        },
        {
            $group:{
                _id:null,
                totalLikes:{
                    $sum:"$totalLikes"
                },
                totalVideos:{
                    $count:{}
                }
            }
        }
    ])
    const totalSubscriber = await Subscription.aggregate([
        {
            $match: {
                channel: req.user._id // Filter subscriptions by the channel ID (user's channel)
            }
        },
        {
            $lookup: {
                from: "users", // Join with the 'users' collection
                localField: "subscriber", // Field in the 'subscriptions' collection that refers to subscriber ID
                foreignField: "_id", // Field in the 'users' collection that matches the subscriber ID
                as: "subscriberCount" // Store the matched users in an array field called 'subscriberCount'
            }
        },
        {
            $addFields: {
                subscriberCount: { $size: "$subscriberCount" } // Calculate the number of subscribers (size of the 'subscriberCount' array)
            }
        },
        {
            $group: {
                _id: null, // No specific grouping, just aggregate everything
                totalSubscribers: { $sum: "$subscriberCount" } // Sum up the total subscribers
            }
        }
    ]);
    
    const infoarr=[]
    infoarr.push(info)
    infoarr.push(totalSubscriber)

    return res
    .status(200)
    .json(new Apiresponse(200, infoarr, "info of channel fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const totalVideos = await Video.aggregate([
        {
            $match:{
                owner:req.user._id
            },
        },
        {
        $group:{
            _id:null,
            total:{
                $count:{}
            }
        }

        }
    ])
    return res.status(200)
    .json(new Apiresponse(200, totalVideos, "toalVideosfetched"))
})

export {
    getChannelStats, 
    getChannelVideos
    }