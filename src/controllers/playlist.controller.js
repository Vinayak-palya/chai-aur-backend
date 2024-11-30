import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {Apiresponse} from "../utils/Apiresponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    const {_id : userId} = req.user
    if(!name || !description){
        throw new ApiError(400, "name or description is missing")
    }
    //TODO: create playlist
    if(!userId || !mongoose.Types.ObjectId.isValid(userId))
    {
        throw new ApiError(400, "user not Authenticated")
    }

    const playlist = await Playlist.create(
        {
            name,
            description,
            owner:userId
        }
    )

    if(!playlist)
    {
        throw new ApiError(500, "unable to create Playlist")
    }

    return res
    .status(201)
    .json(new Apiresponse(201, playlist, "playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!userId || !mongoose.Types.ObjectId.isValid(userId))
    {
        throw new ApiError(400, "user not authenticated")
    }

    const playlists = await Playlist.aggregate([
        {
          $match:{
            owner:userId
          }
        },
    ])
    if(playlists.length === 0)
    {
        return res
        .status(200)
        .json(new Apiresponse(200, "no playlist of user yet"))
    }

    return res
    .status(200)
    .json(new Apiresponse(200, playlists, "playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    
    if(!playlistId || !mongoose.Types.ObjectId.isValid(playlistId))
    {
        throw new ApiError(400, "please provide a valid playlistId")
    }
    const playlist = await Playlist.findById(playlistId)

    if(!playlist)
    {
        return res
        .status(200)
        .json(new Apiresponse(200, "No playlist yet"))
    }

    return res
    .status(201)
    .json(new Apiresponse(201, playlist, "playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || !mongoose.Types.ObjectId.isValid(playlistId) || !videoId || !mongoose.Types.ObjectId.isValid(videoId))
    {
        throw new ApiError(400, "playlist or videoID is invalid")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist)
    {
        throw new ApiError(400, "no playlist for adding the video to it")
    }
    const result = await Playlist.updateOne(
        { _id: playlistId, videos: { $ne: videoId } }, // Ensure video is not already in the array
        { $push: { videos: videoId } }  // Add videoId to the videos array
    );

    if(result.nModified === 0) {
        throw new ApiError(400, "Video already present in the playlist or playlist not found");
    }

    // alternate way
    // if(playlist.videos.includes(videoId) !== -1)
    // {
    //     throw new ApiError(400, "video already present in an playlist")
    // }

    // playlist.videos.push(videoId)

    // const updatedPlaylist = await playlist.save()

    return res
    .status(201)
    .json(new Apiresponse(201, result, "playlit updated successfully"))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if(!playlistId || !mongoose.Types.ObjectId.isValid(playlistId) || !videoId || !mongoose.Types.ObjectId.isValid(videoId))
        {
            throw new ApiError(400, "playlist or videoID is invalid")
        }

        const playlist = await Playlist.findById(playlistId)

        if(!playlist)
        {
            throw new ApiError(404, "no playlist found")
        }
        if(playlist.videos.includes(videoId) === -1)
        {
            throw new ApiError(400, "video you wnat to remove is notin your playlist")
        }
        playlist.videos = playlist.videos.filter(video => video != videoId)

        const updatedPlaylist = await playlist.save()

        if(!updatedPlaylist)
        {
            throw new ApiError(500, "unable to update the playlist try again later")
        }

    return res
    .status(201)
    .json(new Apiresponse(201, updatedPlaylist, "playlist updated successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!playlistId || !mongoose.Types.ObjectId.isValid(playlistId))
    {
        throw new ApiError(400, "playlist or videoID is invalid")
    }
    const deletePlaylist = await Playlist.findOneAndDelete({_id:playlistId})
    if(!deletePlaylist)
    {
        throw new ApiError(500, "unable to delete Playlist")
    }

    return res
    .status()
    .json(new Apiresponse(201, deletePlaylist, "plylist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!playlistId || !mongoose.Types.ObjectId.isValid(playlistId))
    {
        throw new ApiError(400, "playlistId is invalid")
    }

    if(!name || name.trim() === "" || !description || description.trim() === "")
    {
        throw new ApiError(400, "name or description is missing")
    }
    const updateFields = {}
    updateFields.name = name
    updateFields.description = description
    const updatedPlaylist = await Playlist.findOneAndUpdate(
        {
            _id:playlistId
        },
        {
            $set:updateFields
        },
        {
            new:true,
            runValidators:true
        }
    )

    return res
    .status(200)
    .json(new Apiresponse(200, updatedPlaylist, "playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}