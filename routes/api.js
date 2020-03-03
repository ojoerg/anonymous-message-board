/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var mongoose = require("mongoose")
var mongo = require("mongodb")

mongoose.connect(process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

var Schema = mongoose.Schema;
var threadSchema = new Schema({ text: String, 
                                created_on: Date, 
                                bumped_on: Date, 
                                reported: Boolean, 
                                delete_password: String, 
                                replies: [{ text: String, 
                                            created_on: Date, 
                                            delete_password: String, 
                                            reported: Boolean
                                          }],
                                board_id: { type: Schema.Types.ObjectId, ref: 'Board' }
                        });

var boardSchema = new Schema ({ name: String })

var Thread = mongoose.model('Thread', threadSchema);
var Board = mongoose.model('Board', boardSchema);

async function findBoard(board) {
  var result = await Board.findOne({ name: board })
  return result;
}

async function findThreadById(threadId) {
  var result = await Thread.findOne({ _id: threadId })
  return result;
}

async function find10ThreadsByBumpedOn(boardId) {
  var result = await Thread.find({}).where("board_id", boardId).sort({'bumped_on': "desc"}).slice('replies', -3).limit(10).select('-reported -delete_password -__v -replies.reported -replies.delete_password');
  return result;
}

async function findSingleThreadById(threadId) {
  var result = await Thread.findOne({ _id: threadId }).select('-reported -delete_password -__v -replies.reported -replies.delete_password');
  return result;
}

async function findReply(threadId, replyId) {
  var result = await Thread.findOne({ _id: threadId, replies: { $elemMatch: { _id: replyId } } });
  return result;
}

async function createBoard(board) {
  var result = new Board({ name: board }).save();
  return result;
}

async function createThread(boardId, text, deletePassword, date , reported, replies) {
  var result = new Thread ({ text: text, 
                               created_on: date, 
                               bumped_on: date, 
                               reported: false, 
                               delete_password: deletePassword, 
                               replies: [],
                               board_id: boardId }).save();
  return result;
}

async function addReply(threadId, replies, date) {
  var result = Thread.findOneAndUpdate({ _id: threadId}, { replies: replies, bumped_on: date})
  return result;
}

async function deleteOneThread(threadId) {
  var result = await Thread.deleteOne({ _id: threadId })
  return result;
}

async function updateReplyTextToDeleted(threadId, replyId) {
  var result = await Thread.updateOne({ "_id": threadId, "replies._id": replyId }, { "$set": { "replies.$.text": "[deleted]" } })
  return result;
}

async function reportThread(threadId) {
  var result = await Thread.updateOne({ "_id": threadId }, { "$set": { reported: true } })
  return result;
}

async function reportReply(threadId, replyId) {
  var result = await Thread.updateOne({ "_id": threadId, "replies._id": replyId }, { "$set": { "replies.$.reported": true } })
  return result;
}



async function postThread(res, board, text, deletePassword, date , reported, replies) {
  try {
    var boardFound = await findBoard(board);
    
    if (boardFound === null){
      var boardCreate = await createBoard(board);
      boardFound = boardCreate;
    }
    
    var threadCreate = await createThread(boardFound._id, text, deletePassword, date , reported, replies);
    
    res.redirect("/b/" + board);
    
  } catch(error){
    console.log(error)
    res.status(400)
    res.send("invalid data")
  }
}

async function postReply(res, threadId, text, deletePassword, reported, date, board) {
  try{
    var threadFound = await findThreadById(threadId);
    if (threadFound === null) {
      res.status(400)
      res.send("thread not found")
    } else {
      threadFound.replies = [...threadFound.replies, { text: text, created_on: date, delete_password: deletePassword, reported: reported }]
      var replyAdd = await addReply(threadId, threadFound.replies, date)
      res.redirect("/b/" + board + "/" + threadId)
    }
    
  } catch (error){
    console.log(error)
    res.status(400)
    res.send("invalid data")
  }
}

async function getThreads(res, board) {
  try {
    var boardFound = await findBoard(board);
    var boardId = boardFound._id

    if (boardFound === null) {
      res.status(400)
      res.send("board not found")
    } else {
      var threads = await find10ThreadsByBumpedOn(boardId);
      res.json(threads)
    }
  } catch (error){
    console.log(error)
    res.status(400)
    res.send("invalid data")
  }
}

async function getSingleThread(res, board, threadId) {
  try {
    var threadFound = await findSingleThreadById(threadId);
    if (threadFound === null) {
      res.status(400)
      res.send("thread not found")
    } else {
      res.json([threadFound])  
    }
  } catch (error){
    console.log(error)
    res.status(400)
    res.send("invalid data")
  }
}

async function deleteThread(res, threadId, deletePassword) {
  try {
    var threadFound = await findThreadById(threadId);
    if (threadFound === null) {
      res.status(400)
      res.send("thread not found")
    } else if (threadFound.delete_password !== deletePassword) {
      res.status(400)
      res.send("incorrect password")
    } else {
      var thread = await deleteOneThread(threadId);
      res.status(200)
      res.send("success")      
    }
  } catch (error){
    console.log(error)
    res.status(400)
    res.send("invalid data")
  }
}

async function deleteReply(res, threadId, replyId, deletePassword) {
  try {
    var threadFound = await findReply(threadId, replyId);
    if (threadFound === null) {
      res.status(400)
      res.send("thread/reply not found")
    } else {
      var replyFound = false;
      
      for (var i = 0; i < threadFound.replies.length; i++) {
        if (threadFound.replies[i].delete_password === deletePassword) {
          replyFound = true;
        }
      }
      
      if (replyFound === false) {
        res.status(400)
        res.send("incorrect password")
      } else {
        var reply = await updateReplyTextToDeleted(threadId, replyId);
        res.status(200)
        res.send("success")      
      }
    }
  } catch (error){
    console.log(error)
    res.status(400)
    res.send("invalid data")
  } 
}

async function putThread(res, threadId) {
  try{
    var threadFound = await findSingleThreadById(threadId);
    if (threadFound === null) {
      res.status(400)
      res.send("thread not found")
    } else {
      var threadReport = reportThread(threadId)
      res.status(200)
      res.send("success")
    }
  } catch (error){
    console.log(error)
    res.status(400)
    res.send("invalid data")
  } 
}

async function putReply(res, threadId, replyId) {
  try{
    var threadFound = await findReply(threadId, replyId);
    if (threadFound === null) {
      res.status(400)
      res.send("thread/reply not found")
    } else {     
      var reply = await reportReply(threadId, replyId);
      res.status(200)
      res.send("success")      
    }
  } catch (error){
    console.log(error)
    res.status(400)
    res.send("invalid data")
  } 
}



module.exports = function (app) {

  app.route('/api/threads/:board')
    .post(function(req, res){
      //text, created_on(date&time), bumped_on(date&time, starts same as created_on), reported(boolean), delete_password, & replies(array).
      var board = req.params.board;
      var text = req.body.text;
      var deletePassword = req.body.delete_password;
      var date = new Date();
      var reported = false;
      var replies = [];
    
      if (board === null || board === undefined || text === null || text === undefined || deletePassword === null || deletePassword === undefined) {
        res.status(400);
        res.send("invalid data");
      } else {
        postThread(res, board, text, deletePassword, date , reported, replies);
      }
    })
  
    .get(function(req, res) {
      // I can GET an array of the most recent 10 bumped threads on the board with only the most recent 3 replies from /api/threads/{board}. 
      // The reported and delete_passwords fields will not be sent.
      var board = req.params.board;
      
      if (board === null || board === undefined) {
        res.status(400);
        res.send("invalid data");
      } else {
        getThreads(res, board);
      }
    })
  
    .delete(function(req, res) {
      // I can delete a thread completely if I send a DELETE request to /api/threads/{board} and pass along the thread_id & delete_password. (Text response will be 'incorrect password' or 'success')
      var board = req.params.board;
      var threadId = req.query.thread_id;
      var deletePassword = req.query.delete_password;
      
      if (board === null || board === undefined || threadId === null || threadId === undefined || deletePassword === null || deletePassword === undefined ) {
        res.status(400);
        res.send("invalid data");
      } else {
        deleteThread(res, threadId, deletePassword);
      }
    })
  
    .put(function (req, res) {
      // I can report a thread and change it's reported value to true by sending a PUT request to /api/threads/{board} and pass along the thread_id. 
      // (Text response will be 'success')
      var board = req.params.board;
      var threadId = req.query.thread_id;
    
      if (board === null || board === undefined || threadId === null || threadId === undefined) {
        res.status(400);
        res.send("invalid data");
      } else {
        putThread(res, threadId);
      }
    })
    
  app.route('/api/replies/:board')
    .post(function(req, res) {
      //I can POST a reply to a thead on a specific board by passing form data text, delete_password, & thread_id to /api/replies/{board} and it will also update the bumped_on date to the comments date.
      //(Recomend res.redirect to thread page /b/{board}/{thread_id}) 
      // In the thread's 'replies' array will be saved _id, text, created_on, delete_password, & reported.

      var board = req.params.board;
      var text = req.body.text;
      var deletePassword = req.body.delete_password;
      var threadId = req.body.thread_id;
      var reported = false;
      var date = new Date();
    
      if (board === null || board === undefined || text === null || text === undefined || deletePassword === null || deletePassword === undefined || threadId === null || threadId === undefined) {
        res.status(400);
        res.send("invalid data");
      } else {
        postReply(res, threadId, text, deletePassword, reported, date, board);
      }
    })
    
    .get(function (req, res) {
      // I can GET an entire thread with all it's replies from /api/replies/{board}?thread_id={thread_id}
      // Also hiding the same fields.
      var board = req.params.board;
      var threadId = req.query.thread_id;
      
      if (board === null || board === undefined || threadId === null || threadId === undefined ) {
        res.status(400);
        res.send("invalid data");
      } else {
        getSingleThread(res, board, threadId);
      }
    })
    
    .delete(function (req, res) {
      // I can delete a post(just changing the text to '[deleted]') if I send a DELETE request to /api/replies/{board} and pass along the thread_id, reply_id, & delete_password. 
      // (Text response will be 'incorrect password' or 'success')
      var board = req.params.board;
      var threadId = req.query.thread_id;
      var replyId = req.query.reply_id;
      var deletePassword = req.query.delete_password;
      
      if (board === null || board === undefined || threadId === null || threadId === undefined || replyId === null || replyId === undefined || deletePassword === null || deletePassword === undefined ) {
        res.status(400);
        res.send("invalid data");
      } else {
        deleteReply(res, threadId, replyId, deletePassword);
      }
      
    })
  
    .put(function (req, res) {
      // I can delete a post(just changing the text to '[deleted]') if I send a DELETE request to /api/replies/{board} and pass along the thread_id, reply_id, & delete_password. 
      // (Text response will be 'incorrect password' or 'success')
      var board = req.params.board;
      var threadId = req.query.thread_id;
      var replyId = req.query.reply_id;
      
      if (board === null || board === undefined || threadId === null || threadId === undefined || replyId === null || replyId === undefined ) {
        res.status(400);
        res.send("invalid data");
      } else {
        putReply(res, threadId, replyId);
      }
      
    })
};
