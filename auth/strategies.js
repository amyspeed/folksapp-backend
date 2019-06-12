'use strict';

const { Strategy: LocalStategy } = require('passport-local');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');

const { User } = require('../users/models');
const { JWT_SECRET } = require('../config');

const localStategy = new LocalStategy((username, password, callback) => {
    let user;
    User
        .findOne({ username: username })
        .then(_user => {
            user = _user;
            if(!user) {
                return Promise.reject({
                    reason: 'LoginError',
                    message: 'Incorrect username or password'
                });
            }
            return user.validatePassword(password);
        })
        .then(isValid => {
            if(!isValid) {
                return Promise.reject({
                    reason: 'Login Error',
                    message: 'Incorrect username or password'
                });
            }
            return callback(null, user);
        })
        .catch(err => {
            if(err.reason === 'LoginError') {
                return callback(null, false, err);
            }
            return callback(err, false);
        });
});

const jwtStrategy = new JwtStrategy(
    {
        secretOrKey: JWT_SECRET,
        //Bearer auth header:
        jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
        //Only HS256 token
        algorithms: ['HS256']
    },
    (payload, done) => {
        done(null, payload.user);
    }
);

module.exports = { localStategy, jwtStrategy };