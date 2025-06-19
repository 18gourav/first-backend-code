import mongoose,{Schema} from 'mongoose'

const likeModel = new Schema({
    comment:{
        type:Schema.Types.ObjectId,
        ref:'Comment'
    },
    likedBy:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    Tweet:{
        type:Schema.Types.ObjectId,
        ref:'Tweet'
    },
    video:{
        type:Schema.Types.ObjectId,
        ref:'Video'
    }
},{timestamps:true})

export const Like = mongoose.model('Like', likeModel)