// server.js
require('./config/config');

const {ObjectID} = require('mongodb');

const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');

const {mongoose} = require('./db/mongoose');
const {Todo} = require('./models/todo');
const {User} = require('./models/user');
const {authenticate} = require('./middleware/authenticate');

const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

// route dodawania to-do
app.post('/todos', authenticate, (req, res) => { 
    console.log(req.body);
    const todo = new Todo({
        text: req.body.text,
        completed: req.body.completed,
        _creator: req.user.id
    });

    todo.save()
        .then(doc => {
            res.send(doc);
        })
        .catch(err => {
            res.status(400).send(err);
        });
});

// route pobierania wszystkich to-do
app.get('/todos', authenticate, (req, res) => {
    Todo.find({
        _creator: req.user._id
    }).then((todos) => {
        res.send({todos});
    }, err => {
        res.status(400).send(err);
    });
});

// route pobierania to-do o zadanym id
app.get('/todos/:id', (req, res) => {
    const id = req.params.id;

    if(!ObjectID.isValid(id)){
        return res.status(404).send();
    }

    Todo.findById(id).then(todo => {
        if(!todo) {
            return res.status(404).send();
        }
        res.send({todo});
    }).catch(err => res.status(400).send());
});

// route usuwania to-do o zadanym id
app.delete('/todos/:id', (req, res) => {
    const id = req.params.id;

    if(!ObjectID.isValid(id)){
        return res.status(404).send();
    }

    Todo.findByIdAndRemove(id).then(todo => {
        if(!todo){
            res.status(404).send();
        }
        res.status(200).send({todo});
    }).catch(err => res.status(404).send());

});

// route uaktualniająca zadanie o zadanym id 
app.patch('/todos/:id', (req, res) => {
    const id = req.params.id;
    const body = _.pick(req.body, ['text', 'completed']);

    if(!ObjectID.isValid(id)){
        return res.status(404).send();
    }

    if(_.isBoolean(body.completed) && body.completed)
    {
        body.completedAt = new Date().getTime();
    } else {
        body.completed = false;
        body.completedAt = null;
    }

    Todo.findByIdAndUpdate(id, {$set: body}, {new: true}).then(todo => {
        if(!todo){
            return res.status(404).send();
        }

        res.send({todo});
    }).catch(err => { res.status(400).send(); });
});

// route tworząca użytkowika o podanym email i haśle (ze sprawdzaniem czy email jest poprawny, a hasło ma minimum 6 znaków)
app.post('/users', (req, res) => {
    const user = new User(_.pick(req.body, ['email', 'password']));

    user.save()
        .then(user => {
            return user.generateAuthToken();
        })
        .then(token => {
            res.header('x-auth', token).send(user);
        })
        .catch(err => {
            res.status(400).send(err);
        });
});


// route GET /users/me - route wymagająca autentykacji
// jeśli użytkownik niezautentykowany zwraca 401 Unauthorised
// musi mieć przekazany w headers token x-auth
app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
});

// route POST /users/login - logowanie użytkownika
// zwraca w header token x-auth potrzebny do autentyfikacji
app.post('/users/login', (req, res) => {
    const body = _.pick(req.body, ['email', 'password']);

    // weryfikowanie, czy użytkownik o takim email i haśle istnieje
    User.findByCredentials(body.email, body.password).then(user => {
        return user.generateAuthToken().then(token => {
            res.header('x-auth', token).send(user);
        })
    }).catch(err => {
        res.status(400).send();
    })
});

// route DELETE /users/me/token - wylogowywanie (musi mieć przekazany x-auth)
app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send();
    }, () => {
        res.status(400).send();
    });
});

if(!module.parent){
    app.listen(port, () => {
        console.log(`Started on port ${port}`);
    });
}

module.exports = {app};