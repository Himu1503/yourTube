import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import {ApiError} from "./utils/ApiError.js"
const app =express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//Limiting the JSON coming from request 
app.use(express.json({
    limit:"16kb"
}))

//URL Encoder to accept URL from Request 
app.use(express.urlencoded({extended:true,limit:"16kb"}))

//Static files.
app.use(express.static("public"))

app.use(cookieParser())


//Routes import 

import userRouter from './routes/user.routes.js'

//routes declaration 

app.use('/api/v1/users/', userRouter)

export {app}