'use strict';

exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://amyspeed:Password123@ds335957.mlab.com:35957/folksapp';
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'mongodb://localhost/test-folksapp';
exports.PORT = process.env.PORT || 8080;
exports.JWT_SECRET = process.env.JWT_SECRET;
exports.JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';