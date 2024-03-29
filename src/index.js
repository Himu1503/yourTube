import connectDB from "./db/index.js"
import dotenv from "dotenv"
import express from "express"
import {app} from './app.js'

dotenv.config({
    path: './.env'
})


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 ,()=>{
        console.log(`Server is running ar port: ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("Mongo db connection failed !!!", err)
})

/*
import express from "express"

const app =express()

(async() => {

    try {
       await mongoose.connect(`${process.env.MONGOGB_URI}/${DB_NAME}`)

       app.on("error" , (error)=> {
        console.log("ERR: " , error);
        throw err 
       })

       app.listen(process.env.PORT, ()=>{
        console.log(`App is listening on port ${process.env.PORT}`)
       })
    } catch (error) {
        console.log("Error: ",error )
        throw err 
    }
})()

*/