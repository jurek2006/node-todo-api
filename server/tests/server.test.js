// server/tests/server.test.js
const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');
const {todos, populateTodos, users, populateUsers} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos',  () => {
    it('should create a new todo', done => {
        const text = 'Test todo text';

        request(app)
            .post('/todos')
            .send({text})
            .expect(200)
            .expect(res => {
                expect(res.body.text).toBe(text)
            })
            .end((err, res) => {
                if(err){
                   return done(err);
                }

                Todo.find({text}).then(todos => {
                    expect(todos.length).toBe(1);
                    expect(todos[0].text).toBe(text);
                    done();
                }).catch(err => done(err));
            });
    });

    it('should not create todo with invalid body data', done => {
        request(app)
            .post('/todos')
            .send({})
            .expect(400)
            .end((err, res) => {
                if(err){
                    return done(err);
                }
                 
                Todo.find().then(todos => {
                    expect(todos.length).toBe(2);
                    done();
                }).catch(err => done(err));
            });
    });
});

describe('GET /todos', () => {
    it('should get all todos', done => {
        request(app)
            .get('/todos')
            .expect(200)
            .expect(res => {
                expect(res.body.todos.length).toBe(2);
            })
            .end(done);
    });
});

// 1. jeśli podamy niewłaściwe id - otrzymamy 404
// 2. jeśli podamy właściwe id ale nie ma takiego elementu - otrzymamy 404
// 3. jeśli podamy id dla którego można znaleźć element - zostanie on zwrócony

describe('GET /todos/:id', () => {
    it('should get todo doc with matching id', done => {
        request(app)
            .get(`/todos/${todos[0]._id.toHexString()}`)
            .expect(200)
            .expect(res => {
                expect(res.body.todo.text).toBe(todos[0].text);
            })
            .end(done);
    });

    it('should return 404 if todo not found', done => {
        request(app)
            .get(`/todos/${new ObjectID().toHexString()}`)
            .expect(404)
            .end(done);
    });

    it('should return 404 for invalid id', done => {
        request(app)
            .get(`/todos/123`)
            .expect(404)
            .end(done);
    });
});

describe('DELETE /todos/:id', () => {
    it('should remove a todo', done => {

        request(app)
            .delete(`/todos/${todos[0]._id.toHexString()}`)
            .expect(200)
            .expect(res => {
                expect(res.body.todo._id).toBe(todos[0]._id.toHexString());
            })
            .end((err, res) => {
                if(err){
                    return done(err);
                }

                Todo.findById(todos[0]._id.toHexString()).then(todo => {
                    expect(todo).toNotExist();
                    done();
                }).catch(err => done(err));
            });
    });

    it('should return 404 if todo not found', done => {
        request(app)
            .delete(`/todos/${new ObjectID().toHexString()}`)
            .expect(404)
            .end(done);
    });

    it('should return 404 for invalid id', done => {
        request(app)
            .delete(`/todos/123`)
            .expect(404)
            .end(done);
    });
});

describe('PATCH /todos/:id', () => {
    it('should update the todo', done => {
        // grab id of first item
        const firstItemId = todos[0]._id.toHexString();
        const textAfterUptade = 'Updated text';

        request(app)
            .patch(`/todos/${firstItemId}`)
            // update text, set completed to true
            .send({text: textAfterUptade, completed: true})
            // 200
            .expect(200)
            .expect(res => {
                // text is changed, completed is true, completedAt is a number (.toBeA)
                expect(res.body.todo.text).toBe(textAfterUptade);
                expect(res.body.todo.completed).toBe(true);
                expect(res.body.todo.completedAt).toBeA('number');
            })
            .end(done);
    });

    it('should clear completedAt when todo is not completed', done => {
        // grab id of second item
        const secondItemId = todos[1]._id.toHexString();
        const textAfterUptade = 'Newly Updated text';

        request(app)
        .patch(`/todos/${secondItemId}`)
        // update test, set completed to false
        .send({text: textAfterUptade, completed: false})
        // 200
        .expect(200)
        .expect(res => {
            // text is changed, completed is false, completedAt is null (.toNotExist)
            expect(res.body.todo.text).toBe(textAfterUptade);
            expect(res.body.todo.completed).toBe(false);
            expect(res.body.todo.completedAt).toNotExist();
        })
        .end(done);
    });
});

describe('GET /users/me', () => {
    it('should return user if authenticated', done => {
        request(app)
            .get('/users/me')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect(res => {
                expect(res.body._id).toBe(users[0]._id.toHexString());
                expect(res.body.email).toBe(users[0].email);
            })
            .end(done)
    });

    it('should return 401 if not authenticated', done => {
        request(app)
            .get('/users/me')
            .expect(401)
            .expect(res => {
                expect(res.body).toEqual({});
            })
            .end(done)
    });
});

describe('POST /users', () => {
    it('should create a user', done => {
        const email = "nottaken@example.com";
        const password = "testingPass";

        request(app)
            .post('/users')
            .send({email, password})
            .expect(200)
            .expect(res => {
                expect(res.headers['x-auth']).toExist();
                expect(res.body._id).toExist();
                expect(res.body.email).toBe(email);
            })
            .end(err => {
                if(err){
                    return done(err);
                }

                User.findOne({email}).then(user => {
                    expect(user).toExist();
                    expect(user.password).toNotBe(password); //sprawdzamy czy hasło zostało shashowane
                    expect(user.password.length).toBeGreaterThan(0); //sprawdzam czy hasło (shashowane) jest niepuste
                    done();
                });
            });
    });

    it('should return validation errors if email invalid', done => {
        const email = "ertyuenexample.com";
        const password = "testingPass";

        request(app)
            .post('/users')
            .send({email, password})
            .expect(400)
            .end(err => {
                if(err){
                    return done(err);
                }

                User.findOne({email}).then(user => {
                    expect(user).toNotExist();
                    done();
                });
            });

    });

    it('should return validation errors if password too short', done => {
        const email = "sth@example.com";
        const password = "123";

        request(app)
            .post('/users')
            .send({email, password})
            .expect(400)
            .end(err => {
                if(err){
                    return done(err);
                }

                User.findOne({email}).then(user => {
                    expect(user).toNotExist();
                    done();
                });
            });

    });

    it('should not create user if email in use', done => {
        const password = "testingPass";

        request(app)
            .post('/users')
            .send({email: users[0].email , password})
            .expect(400)
            .end(done);
    });
});