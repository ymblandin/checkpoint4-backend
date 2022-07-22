const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const axios = require('axios');

// Generate a random string with letters and numbers as per required by the Spotify API
var generateRandomString = function (length) {
  var text = '';
  var possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

// Login to accounts.spotify.com in order to get a code
function login(req, res) {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  // Ask for all the scopes this way no limitation
  const scope =
    'streaming user-modify-playback-state user-follow-modify user-read-recently-played user-read-playback-position playlist-read-collaborative user-read-playback-state user-read-email user-top-read playlist-modify-public user-library-modify user-follow-read user-read-currently-playing user-library-read playlist-read-private user-read-private playlist-modify-private';

  const queryParams = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    state: state,
    scope: scope,
  }).toString();
  res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
}

// Once the code has been retrieved from Spotify make a post request to request an access token and a refresh token
function callback(req, res) {
  const code = req.query.code || null;

  axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    data: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
    }).toString(),
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${new Buffer.from(
        `${CLIENT_ID}:${CLIENT_SECRET}`
      ).toString('base64')}`,
    },
  })
    .then((response) => {
      // if the response is a success redirect to the frontend with the access token and refresh token as query params
      if (response.status === 200) {
        const { access_token, refresh_token, expires_in } = response.data;

        const queryParams = new URLSearchParams({
          access_token: access_token,
          refresh_token: refresh_token,
          expires_in: expires_in,
        }).toString();

        // redirect to React app
        // pass along tokens in query params
        res.redirect(`http://127.0.0.1:5173/?${queryParams}`);
      } else {
        // If the response is not a success redirect to the frontend with an error
        res.redirect(
          `http://127.0.0.1:5173/?${new URLSearchParams({
            error: 'invalid_token',
          }).toString()}`
        );
      }
    })
    .catch((error) => {
      res.send(error);
    });
}

function refreshToken(req, res) {
  const { refresh_token } = req.query;

  axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    data: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token,
    }).toString(),
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${new Buffer.from(
        `${CLIENT_ID}:${CLIENT_SECRET}`
      ).toString('base64')}`,
    },
  })
    .then((response) => {
      res.send(response.data);
    })
    .catch((error) => {
      res.send(error);
    });
}

module.exports = { login, callback, refreshToken };
