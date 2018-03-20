// server/config/config.js
const env = process.env.NODE_ENV || 'development';

if(env === 'development'){
    process.env.PORT = 3000;
    process.env.MONGODB_URI = 'mongodb://localhost:27017/TodoApp';
} else if (env === 'test'){
    process.env.PORT = 3000;
    process.env.MONGODB_URI = 'mongodb://localhost:27017/TodoAppTest';
} else if(env === 'production'){
    process.env.MONGODB_URI = 'mongodb://user:haslo@ds119049.mlab.com:19049/todo';
}