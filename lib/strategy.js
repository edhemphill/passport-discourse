// Load modules.
var passport = require('passport-strategy')
  , util = require('util')
//  , Profile = require('./profile')
  , discourse_sso  = require("./discourse-sso.js");

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
util.inherits(Strategy, passport.Strategy);
var route_callback = Strategy.route_callback = "/discourse_sso/verify_discourse_sso";

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
  options.secret = options.secret || null;
  options.discourseURL = options.discourseURL || null;
  options.callbackURL = options.callbackURL || null;
  options.debug = options.debug || false;

  if(typeof verify !== 'function') throw new TypeError("passport-discourse requires a verify callback");

  if(options.debug) {
    log_debug = log_debug_ON;
  }

  if(!Provider) Provider = new discourse_sso(options);

  passport.Strategy.call(this);
  this.name = 'discourse';

  this.verify_cb = verify;
}

Strategy.prototype.authenticate = function(req, options) {
  var self = this;

  if(!options) options = {};

  function _verify_discourse_sso(req,res) {
    log_debug("VERIFY -------------------------------------------------",req.originalUrl);
    var ret = Provider.validateAuth(req.originalUrl);
    var profile = {};
    if(ret) {
      profile.provider = "discourse";
      profile.id = ret.external_id;
      profile.displayName = ret.name;
      profile.username = ret.username;
      profile.email = ret.email;
      profile.photos = [{ value: ret.avatar_url }];  
       
    }

    self.verify_cb(null,null,profile,function(err, user){
      if(!err) {
        self.success(user); // ,info ?
      } else {
          self.fail(err); // ,info ?
      }
    });
  }

  if(typeof req._parsedOriginalUrl.query === 'string' &&
      req._parsedOriginalUrl.query.startsWith("sso")) {
    _verify_discourse_sso(req);
  } else {
    var auth_req = Provider.generateAuthRequest(options).then(function(ret){
      log_debug("redirect to:",ret.url_redirect);
      log_debug("REDIRECT ------------------------------------------------");
      self.redirect(ret.url_redirect);
    });    
  }


}

// Expose constructor.
module.exports = Strategy;
