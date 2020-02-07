const crypto = require('crypto');
const querystring = require('querystring');

var valid_server_re = /(https?):\/\/((?:[a-zA-Z0-9@:%_\.\+~#=\-]{2,256}\.[a-z]{2,6})|(?:[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}(?:\:[0-9]{1,5})?))(?:\/([-a-zA-Z0-9@:%_\+~#?&//=]*)){0,1}/;

var log_debug = function() {

}

var log_debug_ON = function() {
    //var args = Array.prototype.slice.call(arguments);
    //args.unshift("WebDeviceSim");
    if(global.log)
        log.debug.apply(log,arguments);
    else {
        var args = Array.prototype.slice.call(arguments);
        args.unshift("DEBUG [discourse-sso]");
        console.log.apply(console,args);
    }
};

var log_err = function() {
    if(global.log)
        log.error.apply(log,arguments);
    else {
        var args = Array.prototype.slice.call(arguments);
        args.unshift("ERROR [discourse-sso]");
        console.error.apply(console,args);
    }

};

var log_warn = function() {
    if(global.log)
        log.warn.apply(log,arguments);
    else {
        var args = Array.prototype.slice.call(arguments);
        args.unshift("WARN  [discourse-sso]");
        console.warn.apply(console,args);
    }
};

var sso = function(config) {
	if(typeof config !== 'object' || 
		typeof config.discourseURL !== 'string' ||
		!config.discourseURL.match(valid_server_re) ||
		typeof config.secret !== 'string' ||
		typeof config.callbackURL !== 'string') {
		throw "Bad configuration for discourse SSO";
	}

	if(config.debug) {
		log_debug = log_debug_ON;
	}

	this.config = config;

	this.NONCE_TABLE = {};
}

sso.prototype.valid_server_re = valid_server_re;

sso.prototype.generateAuthRequest = function(opts) {
	var self = this;
	return new Promise(function(resolve,reject){
		var ret = { opts: opts };
		var hmac = crypto.createHmac('sha256', self.config.secret);

		crypto.randomBytes(16, function(err,buf){
			if(err) throw err;

			ret._created_at = new Date();
			ret.nonce = buf.toString('hex');

			var payload = "nonce="+ret.nonce + "&return_sso_url="+self.config.callbackURL;

			var payload_b64 = new Buffer(payload).toString('base64');
			hmac.update(payload_b64);

			ret.hex_sig = hmac.digest('hex');
			ret.urlenc_payload_b64 = encodeURIComponent(payload_b64);
			ret.url_redirect = self.config.discourseURL+"/session/sso_provider?sso="+ret.urlenc_payload_b64+"&sig="+ret.hex_sig;
			self.NONCE_TABLE[ret.nonce] = ret;

			log_debug("STORING NONCE ",ret.nonce,ret);

			resolve(ret);
		});

	});
}

var get_qstring_re = /.*\?(.*)/;

sso.prototype.validateAuth = function(url) {
	var self = this;
	var ret = null;
	var m = get_qstring_re.exec(url);

	if(m && m.length > 0) {
		var obj = querystring.parse(m[1]);
		log_debug("Query was:",obj);

		if(obj.sso && obj.sig) {
			var hmac = crypto.createHmac('sha256', self.config.secret);
			var decoded_sso = decodeURIComponent(obj.sso);
			hmac.update(decoded_sso);
			var hash = hmac.digest('hex');

			if(obj.sig == hash) {
				var b = new Buffer(obj.sso,'base64');
				var inner_qstring = b.toString('utf8');
				ret = querystring.parse(inner_qstring);
				var orig_req = self.NONCE_TABLE[ret.nonce];

				if(ret.nonce && orig_req) {
					ret.opts = self.NONCE_TABLE[ret.nonce].opts;
					delete self.NONCE_TABLE[ret.nonce];
					log_debug("AUTH was successful");
					return ret;
				} else {
					log_warn("Invalid Auth - Nonce does not match a known request.");
					return null;
				}
	 		} else {
	 			log_warn("Invalid Auth - non-matching sig / sso keys");
	 			return null;
	 		}
		} else {
			throw "Bad Param - discourse sso";
		}		
	} else {
		throw "Bad URL - discourse sso";
	}
}

module.exports = sso;
