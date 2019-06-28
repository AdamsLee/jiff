exports.generateUniform = function (test, options) {
  var max = options.max || options.Zp;
  return Math.floor(Math.random() * max);
};
exports.generateNonZeroUniform = function (test, options) {
  var max = options.max || options.Zp;
  return Math.floor(Math.random() * (max - 1)) + 1;
};
exports.generateBit = function (test, options) {
  return Math.random() < 0.5 ? 0 : 1;
};
exports.generateMultiple = function (test, options, factor) {
  var max = options.max || options.Zp;
  var coef = exports.generateUniform(test, { max: Math.floor(max / factor) });
  return coef * factor;
};
exports.generateDividend = function (test, options, divisor) {
  return exports.generateUniform(test, options);
};

// Generation API referred to from configuration JSON files

// Sharing/Opening test cases with no operations
exports.generateShareInputs = function (test, count, options) {
  var all_parties = [];
  for (var k = 1; k <= options.party_count; k++) {
    all_parties.push(k);
  }

  var inputs = [];
  // Generate test cases one at a time
  // A test case consists of
  // 1) input numbers
  // 2) sharing threshold
  // 3) array of senders
  // 4) array of receivers
  for (var t = 0; t < count; t++) {
    var oneTest = { numbers: {} };
    // Generate numbers
    for (var p = 1; p <= options.party_count; p++) {
      oneTest['numbers'][p] = exports.generateUniform(test, options);
    }
    // 1 <= Threshold <= party_count
    oneTest['threshold'] = Math.floor(Math.random() * options.party_count) + 1;

    // Generate senders/receivers
    var sn = Math.ceil(Math.random() * options.party_count); // At least one sender, at most all.
    var rn = oneTest['threshold'] + Math.floor(Math.random() * (options.party_count - oneTest['threshold'] + 1)); // At least as many receivers as threshold.

    // Generate actual receivers and senders arrays
    var senders = all_parties.slice();
    var receivers = all_parties.slice();

    // remove random parties until proper counts are reached.
    while (senders.length > sn) {
      senders.splice(Math.floor(Math.random() * senders.length), 1);
    }
    while (receivers.length > rn) {
      receivers.splice(Math.floor(Math.random() * receivers.length), 1);
    }
    oneTest['senders'] = senders;
    oneTest['receivers'] = receivers;

    inputs.push(oneTest);
  }
  return inputs;
};

// Arithmetic inputs: one for each party except for / and % where only two inputs are needed.
// | and ^ requires bits, while thr denominator for / and % must be non-zero.
exports.generateArithmeticInputs = function (test, count, options) {
  var party_count = options.party_count;
  var inputs = [];
  var t, p, oneInput;
  if (test.startsWith('/') || test === '%') {
    // division and mod: only two inputs, the second is non-zero.
    for (t = 0; t < count; t++) {
      oneInput = {};
      oneInput[2] = exports.generateNonZeroUniform(test, options);
      oneInput[1] = exports.generateDividend(test, options, oneInput[2]);
      inputs.push(oneInput);
    }
  } else if (test === '|' || test === '^') {
    // or and xor: inputs are binary
    for (t = 0; t < count; t++) {
      oneInput = {};
      for (p = 1; p <= party_count; p++) {
        oneInput[p] = exports.generateBit(test, options);
      }
      inputs.push(oneInput);
    }
  } else if (test === '!') {
    for (t = 0; t < count; t++) {
      oneInput = {};
      oneInput[1] = exports.generateBit(test, options);
      inputs.push(oneInput);
    }
    return inputs;
  } else {
    // otherwise no constraints
    for (t = 0; t < count; t++) {
      oneInput = {};
      for (p = 1; p <= party_count; p++) {
        oneInput[p] = exports.generateUniform(test, options);
      }
      inputs.push(oneInput);
    }
  }

  return inputs;
};

// Constant Arithmetic inputs: an input for the first party, and a constant input.
// | and ^ requires bits, while thr denominator for / and % must be non-zero.
exports.generateConstantArithmeticInputs = function (test, count, options) {
  var inputs = [];
  var t, oneInput;
  if (test.indexOf('/') > -1 || test.indexOf('%') > -1 || test === 'cdivfac') {
    // division and mod: only two inputs, the second is non-zero.
    for (t = 0; t < count; t++) {
      oneInput = {};
      oneInput['constant'] = exports.generateNonZeroUniform(test, options);
      if (test === 'cdivfac') {
        oneInput[1] = exports.generateMultiple(test, options, oneInput['constant']);
      } else {
        oneInput[1] = exports.generateDividend(test, options, oneInput['constant']);
      }

      if (test !== 'cdivfac' && test.startsWith('c')) {
        var tmp = oneInput['constant'];
        oneInput['constant'] = oneInput[1];
        oneInput[1] = tmp;
      }
      inputs.push(oneInput);
    }
  } else if (test === '|' || test === '^') {
    // or and xor: inputs are binary
    for (t = 0; t < count; t++) {
      oneInput = {};
      oneInput[1] = exports.generateBit(test, options);
      oneInput['constant'] = exports.generateBit(test, options);
      inputs.push(oneInput);
    }
  } else {
    // otherwise no constraints
    for (t = 0; t < count; t++) {
      oneInput = {};
      oneInput[1] = exports.generateUniform(test, options);
      oneInput['constant'] = exports.generateUniform(test, options);
      inputs.push(oneInput);
    }
  }

  return inputs;
};

// Constant Comparison inputs: two inputs for the first two parties only
// if using random numbers and large Zp, inputs will be very unlikely to be equal
// we must make it likely for the inputs to be equal manually for == and != checks
exports.generateComparisonInputs = function (test, count, options) {
  var inputs = [];
  var t, oneInput;
  if (test === '==' || test === '!=' || test === '<=' || test === '>=') {
    // equality checks: make it likely that the numbers are equal.
    for (t = 0; t < count; t++) {
      oneInput = {};
      oneInput[1] = exports.generateUniform(test, options);
      oneInput[2] = Math.random() < 0.5 ? oneInput[1] : exports.generateUniform(test, options);
      inputs.push(oneInput);
    }
  } else {
    // otherwise no constraints
    for (t = 0; t < count; t++) {
      oneInput = {};
      oneInput[1] = exports.generateUniform(test, options);
      oneInput[2] = exports.generateUniform(test, options);
      inputs.push(oneInput);
    }
  }

  return inputs;
};

// Constant Comparison inputs: an input for the first party, and a constant input.
// if using random numbers and large Zp, inputs will be very unlikely to be equal
// we must make it likely for the inputs to be equal manually for == and != checks
exports.generateConstantComparisonInputs = function (test, count, options) {
  var inputs = [];
  var t, oneInput;
  if (test === '==' || test === '!=' || test === '<=' || test === '>=') {
    // equality checks: make it likely that the numbers are equal.
    for (t = 0; t < count; t++) {
      oneInput = {};
      oneInput[1] = exports.generateUniform(test, options);
      oneInput['constant'] = Math.random() < 0.5 ? oneInput[1] : exports.generateUniform(test, options);
      inputs.push(oneInput);
    }
  } else {
    // otherwise no constraints
    for (t = 0; t < count; t++) {
      oneInput = {};
      oneInput[1] = exports.generateUniform(test, options);
      oneInput['constant'] = exports.generateUniform(test, options);
      inputs.push(oneInput);
    }
  }

  return inputs;
};
