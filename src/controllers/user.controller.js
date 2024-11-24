import {asyncHandler} from "../utils/asyncHandler.js"
import  {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import { uploadOnCloudinary, deleteFromCloudinary, createPublicId } from "../utils/cloudinary.js"
import { Apiresponse } from "../utils/Apiresponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessandRefreshTokens = async (userId) => 
{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false})
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500 , "Something went wrong while generating refresh and access token")
    }
    
}

const registerUser = asyncHandler(async (req , res) => {
    //  get user details from frontend
    // validation :all possible validation
    // check if user already exist:username , email
    // check for images  , check for avatar
    // upload them on cloudinary , avatar
    // create user object,create entry in db
    // remove password and refresh token field from  response 
    // check for user creation 
    // return res


    const {fullName, email, username, password} = req.body
    
    

    // if(fullName === ""){
    //     throw new ApiError(400 , "fullname is required")
    // }
    if(
        [fullName, email,  username, password].some((field) => 
        field?.trim() === "")
    ){
        throw new ApiError(400,  "All fields are required")
    }
    const existeduser = await User.findOne({
        $or:[{username},{email}]
    })

    // console.log(existeduser)
    if(existeduser){
        throw new ApiError(409 , "User with email or username already exists")
    }

    
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImagePath = req.files?.coverImage[0]?.path;
    let coverImagePath = req.files.coverImage[0].path ;
    
    // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage[0].length > 0)
    // {
    //     coverImagePath = req.files.coverImage[0].path;
    // }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
        
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImagePath);

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }
    (avatar , coverImage);
    
    
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url,
        email,
        password,
        username: username?.toLowerCase()

    });
    


    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500 ,"something went wrong while registering the user ")
    }
    return res.status(201).json(
        new Apiresponse(200 , createdUser, "user registered successfully")
    )
})

const loginUser = asyncHandler(async (req , res) => {
    /*
    Todos for login of user are
    1->taking the input from the user 
    2->check for the minimum no of required fields those we cannot ommit
    3->validation of user if already exist or not, 
    if not then we have to to redirect it to create account page
    4->if user already exist then we have to to generate access token as well 
    as the refresh token for the user and the refresh token for the server as well 
    5->if users details are according to those stored in the database then redirect it to 
    home page 
    6->from next time if the users refresh token is not expired then directly land  him to the to
    the home page if refresh token is expired then ask fr login and then repeat 
    the whole procedure again 

    */
   /*
   (according to the hitesh sir)
   req-body // data
   user//email
    check for user
    password
    generate access and refresh token
   */

    const {email, username, password} = req.body;
    // console.log(email);
    if(!username && !email)
    {
        throw ApiError(400 , "username or email  is required")
    }

    const user  = await User.findOne({
        $or:[{username}, {email}]
    })
    console.log(user)
    if(!user)
    {
        throw new ApiError(404, "User not found");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!user)
        {
            throw new ApiError(404, "Invalid user credentails");
        }
    const{accessToken, refreshToken} = await generateAccessandRefreshTokens(user._id);
        const loggedInUser = await User.findById(user._id).
        select("-password -refreshToken")
    const options = {
        httpOnly:true,
        secure:true,
    }
    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new Apiresponse(
            200 ,
            {user:loggedInUser , accessToken, refreshToken},
            "userLoggedinSuccessFully"
        )
    )
})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate
    (
        req.user._id,
        {
            // $set:{
            //     refreshToken:undefined
            // }
            $unset: {
                refreshToken:1//this removes the field from document
            }
        },
        {
            new:true
        }
    )
    const options = {
        httpOnly:true,
        secure:true,
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .json(new Apiresponse(200, {}, "UserLogged Out"))
})

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken)
    {
        throw new ApiError(401 , "Unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401 , "invalid refresh Token")
        }
        if(incomingRefreshToken !== user?.refreshToken)
        {
            throw new ApiError(401 , "Refresh Token expired or used")
        }
        const options = {
            httpOnly:true,
            secure:true
        }
        const {accessToken , newRefreshToken} = await generateAccessandRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken" , accessToken , options)
        .cookie("refreshToken", newRefreshToken , options)
        .json(
            new Apiresponse(
                200,
                {
                    accessToken,
                    refreshToken:newRefreshToken,
                },
                "Access Token refreshed "
            )
        )
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid refreshToken")
    }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid Password")
    }

    user.password = newPassword  // database is always in other continent
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new Apiresponse(200, {}, "password changed succesfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {

    return res
    .status(200)
    .json(new Apiresponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if(!fullName || !email)
    {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,// we can do it as shown instead of this fullName:fullName  due to es-6 syntax
                email:email
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new Apiresponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath)
    {
        throw new ApiError(400, "avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    // TODO:delete old image ->assignment

    const oldAvatar = User.findById(req.user?._id).avatar
    const public_id = createPublicId(oldAvatar);
    const result = deleteFromCloudinary(public_id)
    console.log(result);

    if(!avatar.url)
    {
        throw new ApiError(400, "error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new Apiresponse(200, user,"Account avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath)
    {
        throw new ApiError(400, "avatar file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url)
    {
        throw new ApiError(400, "error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new Apiresponse(200, user,"Account coverImage updated successfully"))
})

const getUserChannelProfile = asyncHandler(async(req,res)=> {
    const {userName} = req.params

    if(!userName.trim())
    {
        throw new ApiError(400, "userName")
    }
    const channel = User.aggregate([
        {
            $match:{
                userName:userName?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in: [req.user?._id, "$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                userName:1,
                subscriberCount:1,
                channelsSubscribedToCount:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])
    console.log(channel)

    if(!channel.length)
    {
        throw new ApiError(404, "channel does not exist")
    }

    return res
    .status(200)
    .json(
        new Apiresponse(200, channel[0], "data fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectID(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        uerName:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(new Apiresponse(200, user[0].watchHistory, "watch History is fetched successfully"))
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory

}