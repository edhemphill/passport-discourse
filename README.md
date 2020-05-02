# passport-discourse
A Passport strategy for authenticating using a Discourse forum

### Usage

This implements the [Discourse](https://meta.discourse.org) SSO functionality if you want to make another site use Discourse's authentication. I'm no expert at Passport - so please send pull requests.

See more on this protocol in this [thread](https://meta.discourse.org/t/using-discourse-as-a-sso-provider/32974).

```javascript
...
var passportDiscourse = require("passport-discourse").Strategy,

...

app.get("/auth/discourse_sso", passport.authenticate("discourse"));
app.get(passportDiscourse.route_callback, passport.authenticate("discourse", {
  successRedirect: "/auth/done",
  failureRedirect: "/login"
}));

if (auth.discourse_sso.enabled) {
  var auth_discourse = new passportDiscourse({
    secret: "discourse sso secret",
    discourse_url: "https://discourse.example.com/",
    debug: false
  },function(accessToken, refreshToken, profile, done){
      //usedAuthentication("discourse");
      done(null, profile);
  });
  passport.use(auth_discourse);

  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

}


```
