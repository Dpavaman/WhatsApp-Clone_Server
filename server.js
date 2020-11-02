import express from 'express';
//This is enabled since we have added "type": "module" in package.json.
// else we need to use const express = require('express');
import mongoose from 'mongoose'
import Messages from './dbMessages.js'
import Pusher from 'pusher'
import cors from 'cors'
import pkg from 'mongoose'

const { isValidObjectId } = pkg


const app = express();
app.use(express.json());
app.use(cors());

const pusher = new Pusher({
    appId: '1093559',
    key: 'cc8ae74a9321195a8769',
    secret: '5a5c8d340aafdfbbbf58',
    cluster: 'ap2',
    encrypted: true
});

const dataBaseConnection_url = 'mongodb+srv://admin:5YzIoMidHiLyFwzh@cluster0.1nxva.mongodb.net/whatsAppDB?retryWrites=true&w=majority'

mongoose.connect(dataBaseConnection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection

db.once('open', () => {
    console.log("Connection Established with Database");

    const allMessages = db.collection('messagecontents');
    const changeStream = allMessages.watch()

    changeStream.on("change", (change) => {
        console.log(change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            /* in the below code pusher.trigger()   first attribute inside trigge is chanel and second attrbute is event which is "inserted" event in our case  */
            pusher.trigger('message', 'inserted', {
                _id: messageDetails._id,
                createdTime: messageDetails.createdTime,      /* 'message' has to be subscribed to in the front end using pusher.subscribe('my-channel') where my-cannel is 'message' */
                roomName: messageDetails.roomName,
                // conversations: messageDetails.conversations
            })
        } else if (change.operationType === 'update') {
            const target = change.updateDescription.updatedFields
            const dynamicKey = (Object.keys(target))[0];
            pusher.trigger('message', 'updated', target[`${dynamicKey}`])
        } else {
            console.log("Error triggering pusher");
        }
    })
})

const port = process.env.PORT || 8080;




app.get('/', (req, res) => {
    res.status(200).send("API is working Fine.")
})

app.post('/createRoom', (req, res) => {
    const room = req.body;
    Messages.create(room, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body;
    Messages.updateOne({ _id: dbMessage.toRoom }, { "$push": { "conversations": dbMessage } }, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
    // Messages.create(dbMessage, (err, data) => {
    //     if (err) {
    //         res.status(500).send(err);
    //     } else {
    //         res.status(201).send(data);
    //     }
    // })

})


app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

app.get('/messages/sync/:roomId', (req, res) => {
    Messages.findById({ _id: req.params.roomId }, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

app.listen(port, () => {
    console.log(`Server is Up and running on port ${port}`)
})