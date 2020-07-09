(function (exports, node) {
  var saved_instance;
  var jiff_restAPI;

  /**
   * Connect to the server and initialize the jiff instance
   */
  exports.connect = function (hostname, computation_id, options) {
    var opt = Object.assign({}, options);
    opt.crypto_provider = true;

    if (node) {
      // eslint-disable-next-line no-undef
      JIFFClient = require('../../lib/jiff-client');
      jiff_restAPI = require('../../lib/ext/jiff-client-restful.js');
    }

    // eslint-disable-next-line no-undef
    saved_instance = new JIFFClient(hostname, computation_id, opt);
    saved_instance.apply_extension(jiff_restAPI, opt);
    saved_instance.connect();
    return saved_instance;
  };

  /**
   * The MPC computation
   */
  exports.compute = function (input, jiff_instance) {
    console.log('connected and computing;');
    if (jiff_instance == null) {
      jiff_instance = saved_instance;
    }

    // The MPC implementation should go *HERE*
    var shares = jiff_instance.share(input);
    var sum = shares[1];
    for (var i = 2; i <= jiff_instance.party_count; i++) {
      sum = sum.sadd(shares[i]);
    }

    // Return a promise to the final output(s)
    return jiff_instance.open(sum);
  };
}((typeof exports === 'undefined' ? this.mpc = {} : exports), typeof exports !== 'undefined'));
