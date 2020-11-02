import mongoose from 'mongoose';

const messagesSchema = mongoose.Schema({
    createdTime: String,
    roomName: String,
    conversations: [
        { message: String, sender: String, timestamp: String, received: Boolean, toRoom: String }
    ]

    // message: String,
    // sender: String,
    // timestamp: String,
    // received: Boolean,    
})

export default mongoose.model('messagecontents', messagesSchema);