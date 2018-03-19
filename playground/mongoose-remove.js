const {ObjectID} = require('mongodb');

const {mongoose} = require('./../server/db/mongoose');
const {Todo} = require('./../server/models/todo');
const {User} = require('./../server/models/user');

// Todo.remove({}).then(result => {
//     console.log(result);
    
// });

Todo.findByIdAndRemove('5aafb5b7cee3523c9cab3190').then(todo => {
    console.log(todo);
});