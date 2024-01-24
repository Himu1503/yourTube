import mongoose,{Schema} from "mongoose";

const subsciptionSchema = new Schema({

    subscriber:{
        type:Schema.Types.ObjectId,
        ref:"Users"
    },

    channel:{
        type: Schema.Types.ObjectId,
        ref:"Users"
    }
},{timestamps:true})


export const Subsciption = mongoose.model("Subscription", subsciptionSchema)