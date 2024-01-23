import mongoose , {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"



const userSchema = new mongoose.Schema ({

username:{
    type: String,
    required:true,
    unique:true,
    lowecase:true,
    trim:true,
    index:true
},
email:{
    type: String,
    required:true,
    unique:true,
    lowecase:true,
    trim:true,
},

fullName:{
    type: String,
    required:true,
    trim:true,
    index:true
},

avatar:{
    type: String, //cloundnaryURL
    required:true,
},

coverImage:{
    type: String, //CloundaryLink
},

watchHistory:[
    {
        type: Schema.Types.ObjectId,
        ref:"Video"
    }
],

password: {
    type:String,
    required: [true , "Password is required"]
},

refreshToken:{
    type: String
}



} ,{timestamps:true})



//Pre Hooks Middleware 

userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10 )
    next()
    
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}
userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id: this.id,
        email:this.email,
        username: this.username,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
    
    )
}

userSchema.methods.generateRefreshtToken =function(){
    return jwt.sign({
        _id: this.id,
        email:this.email,
        username: this.username,
        fullName:this.fullName
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
    
    )
}



export const User = mongoose.model("User",userSchema)