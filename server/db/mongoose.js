// mongoose.js
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
let connectPath, options;
//Check if we are on Heroku
if(process.env.PORT){
 connectPath = "mongodb://user:haslo@ds119049.mlab.com:19049/todo";
 options= {
     auth: {
         user: "user",
         password: "haslo"
     }
 }
}else{
 connectPath = "mongodb://localhost:27017/TodoApp";
 options = {}
}
mongoose.connect(connectPath, options);


module.exports = { mongoose }