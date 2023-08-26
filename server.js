const express = require('express');
const app = express();

const userRoutes = require('./routes/userRoutes')
const User = require('./models/User');
const Message = require('./models/Message')

const rooms = ['Family🤷‍♂️', 'OIST 6 SEM CSE😶', 'Sheriyansh N12😎', 'Freinds❤️' ,'Goa Trip😎'];
const cors = require('cors');

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors()); // to communicate with frontend to backend

app.use('/users', userRoutes)
 require('./connection')

const server = require('http').createServer(app);
const PORT = 5001;


const multer = require('multer');

// Set up multer to handle file uploads
const upload = multer({ dest: 'uploads/' });


app.post('/upload', upload.single('file'), (req, res) => {
  const { filename, mimetype, size } = req.file;
  res.json({ filename, mimetype, size });
});




const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})



//In summary, this function uses the Message model and MongoDB's aggregation framework to retrieve the last messages sent to a specified room and group them by date.
//

async function getLastMessagesFromRoom(room){
  let roomMessages = await Message.aggregate([
    //This line specifies the first step of the aggregation pipeline, which filters the messages by matching the to field with the specified room value.
    {$match: {to: room}},

    //which groups the messages by their date field and creates a new field messagesByDate that contains an array of all the messages with that date. The $$ROOT variable is used to include the entire document in the messagesByDate array.
    {$group: {_id: '$date', messagesByDate: {$push: '$$ROOT'}}}
  ])

  return roomMessages;
}


// this function takes an array of room messages and sorts them in ascending order based on their date. It converts the date components into a string in the format "YYYYMMDD" for easier comparison and uses Array.sort() with a comparison function to sort the messages by date.

function sortRoomMessagesByDate(messages){
  return messages.sort(function(a, b){
    let date1 = a._id.split('/');
    let date2 = b._id.split('/');

    date1 = date1[2] + date1[0] + date1[1]
    date2 =  date2[2] + date2[0] + date2[1];

    return date1 < date2 ? -1 : 1
  })
}


 const users1 = {};
// socket connection

io.on('connection', (socket)=> {
console.log("A user connecteds")

  //this code sets up a socket event listener for the 'new-user' event, and performs two actions when this event is received: it retrieves all user records from the database, and sends the resulting members array to all connected clients with the 'new-user' event.
  socket.on('new-user', async ()=> {
    const members = await User.find();
    io.emit('new-user', members)
  })



  //his code sets up a socket event listener for the 'join-room' event, and performs several actions when this event is received: it adds the client to a new room and removes them from the previous room, retrieves the last messages from the new room and sorts them by date, and sends the sorted messages to the client with the 'room-messages' event.

  socket.on('join-room', async(newRoom, previousRoom)=> {
    socket.join(newRoom);
    socket.leave(previousRoom);
    let roomMessages = await getLastMessagesFromRoom(newRoom);
    roomMessages = sortRoomMessagesByDate(roomMessages);
    socket.emit('room-messages', roomMessages)
  })


/**
 This code sets up a socket event listener for the event 'message-room'. When this event is received, the callback function will be executed with four parameters: room, content, sender, time, and date.

The first line of the callback function creates a new Message document in a database, using the Message model's create method. The Message document represents a new message that was sent to the room. The await keyword is used to ensure that the Message.create method completes before continuing.

The next line retrieves the last messages sent to the room from the database by calling the getLastMessagesFromRoom function. This function likely retrieves the last n messages sent to the room, where n is a predetermined number. The retrieved messages are then sorted by date using the sortRoomMessagesByDate function.

The following line emits a 'room-messages' event to all clients connected to the room. This event sends the roomMessages array, which contains the last n messages sent to the room, sorted by date. The io.to(room) method is used to emit the event to all clients connected to the room, while the emit method sends the event with the payload, roomMessages.

Finally, the last line emits a 'notifications' event to all clients connected to the server, except the current client. This event notifies clients that a new message has been sent to the room, and the room parameter is used to specify which room the message was sent to. The socket.broadcast.emit method is used to emit the event to all clients except the current client, while the emit method sends the event with the payload, room.
 */


  socket.on('message-room', async(room, content, sender, time, date) => {
    const newMessage = await Message.create({content, from: sender, time, date, to: room});
    let roomMessages = await getLastMessagesFromRoom(room);
    roomMessages = sortRoomMessagesByDate(roomMessages);
    // sending message to room
    io.to(room).emit('room-messages', roomMessages);
    socket.broadcast.emit('notifications', room)
  })


 
  
  
  /*This code defines an HTTP DELETE route at the endpoint '/logout'. When a request is made to this endpoint, the function defined inside the route handler is executed.

The function first extracts the _id and newMessages properties from the request body using destructuring assignment. It then uses the _id to find a user in the database using the User.findById() method.

Once the user is found, the function updates their status to "offline" and sets the newMessages property to the value passed in the request body. The changes to the user document are then saved to the database using the user.save() method.

The function then retrieves all users from the database using the User.find() method, and emits a 'new-user' event to all connected sockets using socket.broadcast.emit(). The 'new-user' event sends the updated list of all users to the connected clients.

Finally, the function sends a HTTP 200 status code to the client to indicate that the operation was successful, or a HTTP 400 status code if an error occurred during the execution of the function. */
  app.delete('/logout', async(req, res)=> {
    try {
      const {_id, newMessages} = req.body;
      const user = await User.findById(_id);
      user.status = "offline";
      user.newMessages = newMessages;
      await user.save();
      const members = await User.find();
      socket.broadcast.emit('new-user', members);
      res.status(200).send();
    } catch (e) {
      console.log(e);
      res.status(400).send()
    }
  })

})



app.get('/rooms', (req, res)=> {
  res.json(rooms)
})

server.listen(PORT, ()=> {
  console.log('listening to port', PORT)
})
