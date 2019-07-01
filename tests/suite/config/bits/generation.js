// Reuse base generation but with different underlying generation methods
var baseGeneration = require('../base/generation.js');

baseGeneration.generateDecomposition = function (test, count, options) {
  var max = options.max || options.Zp;

  var inputs = [];
  for (var t = 0; t < count; t++) {
    var oneInput = { 1: baseGeneration.generateUniform(test, options, max) };
    inputs.push(oneInput);
  }
  return inputs;
};

var oldArithmeticInputs = baseGeneration.generateArithmeticInputs;
var oldConstantArithmeticInputs = baseGeneration.generateConstantArithmeticInputs;

baseGeneration.generateArithmeticInputs = function (test, count, options) {
  if (test !== '-') {
    return oldArithmeticInputs(test, count, options);
  }

  var max = options.max || options.Zp;
  var inputs = [];
  var party_count = options.party_count;
  for (var t = 0; t < count; t++) {
    // First input is free
    var aggregate = baseGeneration.generateUniform(test, options, max);
    var oneInput = {1: aggregate};

    // Other inputs must never cause negative numbers
    for (var p = 2; p < party_count; p++) {
      oneInput[p] = baseGeneration.generateUniform(test, options, aggregate);
      aggregate = aggregate - oneInput[p];
    }

    // Last input can cause negative number
    oneInput[party_count] = baseGeneration.generateUniform(test, options, max);
    inputs.push(oneInput);
  }

  return inputs;
};

baseGeneration.generateConstantArithmeticInputs = function (test, count, options) {
  if (test !== 'c/' && test !== 'c%') {
    return oldConstantArithmeticInputs(test, count, options);
  }

  var max = options.max || options.Zp;
  var cmax = options.cmax || max;

  // division and mod: only two inputs, the second is non-zero.
  var inputs = [];
  for (var t = 0; t < count; t++) {
    var oneInput = {};
    oneInput[1] = baseGeneration.generateNonZeroUniform(test, options, max);
    oneInput['constant'] = baseGeneration.generateDividend(test, options, cmax, oneInput[1]);
    inputs.push(oneInput);
  }

  return inputs;
};

module.exports = baseGeneration;