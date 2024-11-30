import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import { Apiresponse } from "../utils/Apiresponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    const {_id:userId}  = req.user

    if(!mongoose.Types.ObjectId.isValidObjectId(channelId) || !channelId)
    {
        throw new ApiError(404, "Channel not found")
    }
    const exist = await User.findById(mongoose.Types.ObjectId(userId))
    if(!exist)
    {
        throw new ApiError(400, "user not authenticated")
    }

    const subscribe = await Subscription.findOne(
        {
            subscriber:userId,
            channel:channelId
        }
    )
    if(!subscribe)
    {
        const createSubscribe = await Subscription.create(
            {
                channel:channelId,
                subscriber:userId
            }
        )
        if(!createSubscribe)
        {
            throw new ApiError(500, "failed to subscribe")
        }
        return res
        .status(201)
        .json(new Apiresponse(201, createSubscribe, "create subscrive succesfully"))
    }
    const deleteSubscribe = await Subscription.findOneAndDelete(
        {
            subscriber:userId,
            channel:channelId
        }
    )
    if(!deleteSubscribe)
    {
        throw new ApiError(500, "unable to unsubscribe")
    }
    return res
    .status(200)
    .json(new Apiresponse(200, deleteSubscribe, "unsubscribed sucessfully"))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!mongoose.Types.ObjectId.isValid(channelId) || !channelId)
        {
            throw new ApiError(404, "Channel not found")
        }
        const subscribers = await Subscription.aggregate([
            {
                $match: { channel: mongoose.Types.ObjectId(channelId) }, // Filter by channelId
            },
            {
               $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscribersDetails"
               }
            },
            {
                $unwind:"subscribersDetails"
            },
            {
                $project: {
                    subscriberId: "$subscriberDetails._id",  // Include subscriber's _id as subscriberId
                    name: "$subscriberDetails.name",         // Include name
                    email: "$subscriberDetails.email",       // Include email
                    subscribedAt: "$createdAt",              // Include subscription date
                    _id: 0                                    // Exclude _id
                  }
            }
        ])
        if(!subscribers)
        {
            return res
            .status(404)
            .json(new ApiError(200, "No subscriber found"))
        }
        return res
        .status(200)
        .json(new Apiresponse(201, subscribers, "subscribers fetched succesffully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!subscriberId || !mongoose.Types.ObjectId.isValid(subscriberId))
    {
        throw new ApiError(404, "subscriber not found")
    }
    const SubscribedChannels = await Subscription.aggregate([
        {
            $match:{
                subscriber:subscriberId
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channels"
            }
        },
        {
            $unwind:"channels"
        },
    ])
    if(!SubscribedChannels)
    {
        throw new ApiError(404, "no subscribed channels yet")
    }

    return res
    .status(200)
    .json(new Apiresponse(200, SubscribedChannels, "channels fetched successfuly"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}