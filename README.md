# passport-discourse
A Passport strategy for authenticating using a Discourse forum

### Usage

This implements the [Discourse](https://meta.discourse.org) SSO functionality if you want to make another site use Discourse's authentication. I'm no expert at Passport - so please send pull requests.

See more on this protocol in this [thread](https://meta.discourse.org/t/using-discourse-as-a-sso-provider/32974).

```javascript
...
var passportDiscourse = require("../../passport-discourse").Strategy,

...

router.get("/auth/discourse_sso", passport.authenticate("discourse"));
router.get(passportDiscourse.route_callback, passport.authenticate("discourse", {
  successRedirect: proxyPath + "/auth/done",
  failureRedirect: proxyPath + "/login"
}));

if (auth.discourse_sso.enabled) {
  var auth_discourse = new passportDiscourse({
    secret: auth.discourse_sso.discourse_secret,
    discourse_url: auth.discourse_sso.discourse_url,
    debug: auth.discourse_sso.debug
  },function(accessToken, refreshToken, profile, done){
      usedAuthentication("discourse");
      done(null, profile);
  });
  passport.use(auth_discourse);
}


```
