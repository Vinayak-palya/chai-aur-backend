import {asyncHandler} from "../utils/asyncHandler.js"
import  {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Apiresponse } from "../utils/Apiresponse.js"

const registerUser = asyncHandler(async (req , res) => {
    //  get user details from frontend
    // validation :all possible validation
    // check if user already exist:username , email
    // check for images  , check for avatar
    // upload them on cloudinary , avatar
    // create user object,create entry in db
    // remove password and refresh token field from  response 


    const {fullName, email, userName, password} = req.body
    console.log("email: ",email);

    // if(fullName === ""){
    //     throw new ApiError(400 , "fullname is required")
    // }
    if(
        [fullName, email,  userName, password].some((field) => 
        field?.trim() === "")
    ){
        throw new ApiError(400, )
    }
    const existeduser = User.findOne({
        $or:[{userName},{email}]
    })
    console.log(existeduser)
    if(existeduser){
        throw new ApiError(409 , "User with email or username already exists")
    }
    console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImagePath = req.files?.coverImage[0]?.$or
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
        
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImagePath);

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        userName:userName.toLowerCase()

    })
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


export {registerUser}