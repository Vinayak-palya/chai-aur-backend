// require('dotenv').config({path:"/.env"})-->first method 
import dotenv from "dotenv"
import mongoose from "mongoose";
import connectDB from "./db/index.js";



// -->latest syntax
dotenv.config({
    path:'/.env'
})



connectDB();














// import express from "express";
// const app = express();
// ;(async() => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/
//             ${DB_NAME}`)
//             app.on("error" , (error)=>{
//                 console.log(error)
//                 throw error
//             })
//             app.listen(process.env.PORT , () => {
//                 console.log(`APP is listening on port ${process.env.PORT}`)
//             })
//     } catch (error) {
//         console.error("ERROR: " , error)
//     }
// })()