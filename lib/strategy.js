// Load modules.
var passport = require('passport-strategy')
  , util = require('util')
  , Profile = require('./profile')
  , discourse_sso  = require("./discourse-sso.js");
  // , InternalOAuthError = require('passport-oauth2').InternalOAuthError
  // , APIError = require('./errors/apierror');

var log_debug = function() {

}

var log_debug_ON = function() {
    //var args = Array.prototype.slice.call(arguments);
    //args.unshift("WebDeviceSim");
    if(global.log)
        log.debug.apply(log,arguments);
    else {
        var args = Array.prototype.slice.call(arguments);
        args.unshift("DEBUG [passport-discourse]");
        console.log.apply(console,args);
    }
};

var Provider = null;

/**
 * `Strategy` constructor.
 *
 * The GitHub authentication strategy authenticates requests by delegating to
 * GitHub using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `cb`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your GitHub application's Client ID
 *   - `clientSecret`  your GitHub application's Client Secret
 *   - `callbackURL`   URL to which GitHub will redirect the user after granting authorization
 *   - `scope`         array of permission scopes to request.  valid scopes include:
 *                     'user', 'public_repo', 'repo', 'gist', or none.
 *                     (see http://developer.github.com/v3/oauth/#scopes for more info)
 *   — `userAgent`     All API requests MUST include a valid User Agent string.
 *                     e.g: domain name of your application.
 *                     (see http://developer.github.com/v3/#user-agent-required for more info)
 *
 * Examples:
 *
 *     passport.use(new GitHubStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/github/callback',
 *         userAgent: 'myapp.com'
 *       },
 *       function(accessToken, refreshToken, profile, cb) {
 *         User.findOrCreate(..., function (err, user) {
 *           cb(err, user);
 *         });
 *       }
 *     ));
 *
 * @constructor
 * @param {object} options
 * @param {function} verify
 * @access public
 */
function Strategy(options, verify) {
  options = options || {};
  if(typeof verify !== 'function') throw new TypeError("passport-discourse requires a verify callback");
  // options.authorizationURL = options.authorizationURL || 'https://github.com/login/oauth/authorize';
  // options.tokenURL = options.tokenURL || 'https://github.com/login/oauth/access_token';
  // options.scopeSeparator = options.scopeSeparator || ',';
  // options.customHeaders = options.customHeaders || {};

  if(options.debug) {
    log_debug = log_debug_ON;
  }

  if(!Provider) Provider = new discourse_sso(options);

  // if (!options.customHeaders['User-Agent']) {
  //   options.customHeaders['User-Agent'] = options.userAgent || 'passport-github';
  // }

  passport.Strategy.call(this);
  this.name = 'discourse';

  this.verify_cb = verify;

  // this.name = 'github';
  // this._userProfileURL = options.userProfileURL || 'https://api.github.com/user';
  // this._oauth2.useAuthorizationHeaderforGET(true);
  
  // // NOTE: GitHub returns an HTTP 200 OK on error responses.  As a result, the
  // //       underlying `oauth` implementation understandably does not parse the
  // //       response as an error.  This code swizzles the implementation to
  // //       handle this condition.
  // var self = this;
  // var _oauth2_getOAuthAccessToken = this._oauth2.getOAuthAccessToken;
  // this._oauth2.getOAuthAccessToken = function(code, params, callback) {
  //   _oauth2_getOAuthAccessToken.call(self._oauth2, code, params, function(err, accessToken, refreshToken, params) {
  //     if (err) { return callback(err); }
  //     if (!accessToken) {
  //       return callback({
  //         statusCode: 400,
  //         data: JSON.stringify(params)
  //       });
  //     }
  //     callback(null, accessToken, refreshToken, params);
  //   });
  // }
}

// Inherit from `OAuth2Strategy`.
util.inherits(Strategy, passport.Strategy);

var route_callback = Strategy.route_callback = "/discourse_sso/verify_discourse_sso";

/**
 * Retrieve user profile from GitHub.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `github`
 *   - `id`               the user's GitHub ID
 *   - `username`         the user's GitHub username
 *   - `displayName`      the user's full name
 *   - `profileUrl`       the URL of the profile for the user on GitHub
 *   - `emails`           the user's email addresses
 *
 * @param {string} accessToken
 * @param {function} done
 * @access protected
 */
Strategy.prototype.userProfile = function(accessToken, done) {
  var self = this;

  // this._oauth2.get(this._userProfileURL, accessToken, function (err, body, res) {
  //   var json;
    
  //   if (err) {
  //     if (err.data) {
  //       try {
  //         json = JSON.parse(err.data);
  //       } catch (_) {}
  //     }
      
  //     if (json && json.message) {
  //       return done(new APIError(json.message));
  //     }
  //     return done(new InternalOAuthError('Failed to fetch user profile', err));
  //   }
    
  //   try {
  //     json = JSON.parse(body);
  //   } catch (ex) {
  //     return done(new Error('Failed to parse user profile'));
  //   }
    
  //   var profile = Profile.parse(json);
  //   profile.provider  = 'github';
  //   profile._raw = body;
  //   profile._json = json;


  //   if (self._scope && self._scope.indexOf('user:email') !== -1) {
  //     self._oauth2._request('GET', self._userProfileURL + '/emails', { 'Accept': 'application/vnd.github.v3+json' }, '', accessToken, function(err, body, res) {
  //       if (err) {
  //         // If the attempt to fetch email addresses fails, return the profile
  //         // information that was obtained.
  //         return done(null, profile);
  //       }
        
  //       var json;
  //       try {
  //         json = JSON.parse(body);
  //       } catch (_) {
  //         // If the attempt to parse email addresses fails, return the profile
  //         // information that was obtained.
  //         return done(null, profile);
  //       }
        
        
  //       if (!json.length) {
  //         return done(null, profile);
  //       }
        
  //       profile.emails = profile.emails || [];
  //       var publicEmail = profile.emails[0];
        
  //       (json).forEach(function(email) {
  //         if (publicEmail && publicEmail.value == email.email) {
  //           profile.emails[0].primary = email.primary;
  //           profile.emails[0].verified = email.verified;
  //         } else {
  //           profile.emails.push({ value: email.email, primary: email.primary, verified: email.verified })
  //         }
  //       });
  //       done(null, profile);
  //     });
  //   }
  //   else {
  //     done(null, profile);
  //   }
  // });
}

Strategy.prototype.authenticate = function(req, options) {
  var self = this;

  if(!options) options = {};
  // options._passportReq = {
  //   success: self.success,
  //   fail: self.fail
  // };

  console.log("*************************************************");
  console.dir(this);
  console.log(req.originalUrl);
  console.log("*************************************************");


  function _verify_discourse_sso(req,res) {
    log_debug("VERIFY -------------------------------------------------",req.originalUrl);
    log_debug("req:",req);
    var ret = Provider.validateAuth(req.originalUrl);
    var profile = {};
    if(ret) {
      profile.username = ret.username;
      profile.email = ret.email;
      profile.displayName = ret.name;
    }
    self.verify_cb(null,null,profile,function(){
      if(ret) {
          self.success(profile); // ,info ?
      } else {
          self.fail("Failed to validate user"); // ,info ?
      }
    });
  }

  var s = req.originalUrl.split(route_callback);
  if(s.length > 1 && s[0].length == 0) {
    _verify_discourse_sso(req);
  } else {
    var m = Provider.valid_server_re.exec(req.headers.referer);
    var referal_url = "";
    if(m && m.length > 1) {
      referal_url = m[1] + "://" + m[2] + "/discourse_sso/verify_discourse_sso"; 
    } else {
      throw "Bad referal from login / discourse_sso"; 
    }
    var argz = arguments;
    var auth_req = Provider.generateAuthRequest(referal_url,options).then(function(ret){
      log_debug("redirect to:",ret.url_redirect);
      log_debug("argz:",argz);
      log_debug("REDIRECT ------------------------------------------------");
      self.redirect(ret.url_redirect);
    });    
  }

  // var self = this;
  
  // function verified(err, user, info) {
  //   if (err) { return self.error(err); }
  //   if (!user) { return self.fail(info); }
  //   self.success(user, info);
  // }
  
  // try {
  //   if (self._passReqToCallback) {
  //     this._verify(req, username, password, verified);
  //   } else {
  //     this._verify(username, password, verified);
  //   }
  // } catch (ex) {
  //   return self.error(ex);
  // }

}

// Expose constructor.
module.exports = Strategy;
