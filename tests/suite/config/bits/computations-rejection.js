// Use base computation but override interpreters.
var baseComputations = require('../../computations.js');
var Zp;

baseComputations.openInterpreter = 'OPEN';
baseComputations.mpcInterpreter = 'MPC';

// No sharing, but keep track of upper and lower bounds
baseComputations.shareParameters = function (jiff_instance, test, testInputs) {
  var keys = [];
  if (testInputs['upper'] != null) {
    keys.push('upper');
  }
  if (testInputs['lower'] != null) {
    keys.push('lower');
  }
  return { input: testInputs, senders: keys};
};
baseComputations.shareHook = function (jiff_instance, test, testInputs, input, threshold, receivers, senders) {
  return testInputs;
};

// Computing
baseComputations.singleCompute = function (jiff_instance, shareParameters, test, values, interpreter) {
  if (interpreter === baseComputations.openInterpreter) {
    return values;
  }

  return jiff_instance.protocols.bits.rejection_sampling(values['lower'], values['upper']);
};

// Opening bits
baseComputations.openHook = function (jiff_instance, test, share) {
  return share[0].jiff.protocols.bits.open_bits(share);
};

// Verification
baseComputations.verifyResultHook = function (test, mpcResult, expectedResult) {
  var lower = expectedResult['lower'] || 0;
  var upper = expectedResult['upper'] || Zp;
  return (mpcResult >= lower) && (mpcResult < upper);
};

exports.compute = function (jiff_instance, test, inputs, testParallel, done, testConfig) {
  Zp = jiff_instance.Zp;
  baseComputations.compute.apply(baseComputations, arguments);
};