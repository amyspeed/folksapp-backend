'use strict';

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: 'smiley.png' }
});

UserSchema.methods.serialize = function() {
    return {
        id: this._id,
        username: this.username || '',
        firstName: this.firstName || '',
        lastName: this.lastName || '',
        description: this.description || '',
        image: this.image || 'smiley.png'
    };
};

UserSchema.methods.validatePassword = function(password) {
    return bcrypt.compare(password, this.password);
};

UserSchema.statics.hashPassword = function(password) {
    return bcrypt.hash(password, 10);
};

const User = mongoose.model('User', UserSchema);

module.exports = { User };

