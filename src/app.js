const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());

const router = require('./routers/router');
app.use(router);

module.exports = app;
