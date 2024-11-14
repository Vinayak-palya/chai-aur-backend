import {asyncHandler} from "../utils/asyncHandler.js"
import  {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Apiresponse } from "../utils/Apiresponse.js"

const generateAccessandRefreshTokens = async (userId) => 
{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false})
    } catch (error) {
        throw new ApiError(500 , "Something went wrong while generating refresh and access token")
    }
    return {accessToken, refreshToken}
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
    if(!username || !email)
    {
        throw ApiError(400 , "username or email  is required")
    }

    const user  = user.findOne({
        $or:[{username, email}]
    })

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
            $set:{
                refreshToken:undefined
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

export {
    registerUser,
    loginUser,
    logoutUser
}