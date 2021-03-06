/**
 * Author: Umayr Shahid <umayrr@hotmail.co.uk>,
 * Created: 05:43, 09/03/15.
 */

'use strict';

import validator from 'validator';

import * as extensions from '../utils/extensions';
import * as utils from '../utils/index';

import ValidationItem from './item';
import ValidationResult from './result';

const DEFAULTS = {
  progressive: false
};

export default class Uranus {
  /**
   * Creates new instance of Uranus.
   *
   * @param options
   * @constructor
   */
  constructor(options) {
    this.options = Object.assign({}, DEFAULTS, options);

    this.validator = validator;
    this._registerExtensions();
  }

  /**
   * Registers all extra extension methods to validator instance.
   *
   * @private
   */
  _registerExtensions() {
    for (let [key, value] of utils.entries(extensions)) {
      this.validator.extend(key, value);
    }
  }

  /**
   * Inner method that perform single validation.
   *
   * @param value
   * @param test
   * @param rule
   * @returns {*}
   * @private
   */
  _exec(value, test, rule) {
    if (typeof this.validator[rule] !== 'function') throw new Error(`Invalid validator function: ${rule}`);

    let validatorArgs = test.args || test;

    if (!Array.isArray(validatorArgs)) {
      if (rule === 'isIP') validatorArgs = [];
      else validatorArgs = [validatorArgs];
    }
    else validatorArgs = validatorArgs.slice(0);
    return this.validator[rule].apply(validator, [value].concat(validatorArgs));
  }

  /**
   * Inner method to perform validation over an array.
   *
   * @param src
   * @returns {ValidationResult}
   * @private
   */
  _validateArray(src) {
    let _validity = true;
    let _items = [];
    src.map((item, index) => {
      [_validity, _items[index]] = this._validateOne(item.value, item.rules);
    });
    return new ValidationResult(_validity, _items);
  }

  /**
   * Inner method to perform validation over a single item.
   * @param value
   * @param rules
   * @returns {*[]}
   * @private
   */
  _validateOne(value, rules) {
    let _validity = true;
    let _result = {};
    for (let [rule, test] of utils.entries(rules)) {
      if (['isUrl', 'isURL', 'isEmail'].indexOf(rule) !== -1) {
        if (typeof test === 'object' && test !== null && test.msg) test = {msg: test.msg};
        else if (test) test = {};
      }

      if (!this._exec(value, test, rule)) {
        _validity = false;
        _result[rule] = new ValidationItem(false, test.msg || `Validation \`${rule}\` failed.`);
        if (this.options.progressive) break;
      }
      else _result[rule] = new ValidationItem(true);
    }
    return [_validity, _result];
  }

  _validateObject(src, rules) {
    let _validity = true;
    let _items = [];

    for (let [key, tests] of utils.entries(rules)) {
      [_validity, _items[key]] = this._validateOne(src[key], tests);
    }
    return new ValidationResult(_validity, _items);
  }

  /**
   * Method to perform validation.
   *
   * @param src
   * @returns {*}
   */
  validateAll(src) {
    if (Array.isArray(src)) return this._validateArray(...arguments);
    else if (src instanceof Object) return this._validateObject(...arguments);
    else throw new Error('Uranus only support array at the moment. Usage: https://github.com/umayr/uranus/blob/develop/README.md#usage');
  }

  /**
   * Performs validation over a single value.
   * @param value
   * @param rules
   * @returns {ValidationResult}
   *
   * @example
   *  var value = 'foo@email.com';
   *  var rules = {
   *     isEmail: true,
   *     notNull: true
   *  };
   *
   *  validator.validateOne(value, rules);
   */
  validateOne(value, rules) {
    return new ValidationResult(...this._validateOne(value, rules));
  }

  /**
   * Syntactic static sugar over `validateAll` instance method.
   *
   * @param src
   * @param options
   * @returns {ValidationResult}
   */
  static validateAll(src) {
    let args = Array.from(arguments);
    let options;

    if (Array.isArray(src) && typeof args[1] !== 'undefined') {
      options = args[1];
      args.pop();
    }
    if (src instanceof Object && typeof args[2] !== 'undefined') {
      options = args[2];
      args.pop();
    }
    let instance = new Uranus(options);
    return instance.validateAll(...args);
  }

  /**
   * Syntactic static sugar over `validateOne` instance method.
   *
   * @param src
   * @param options
   * @returns {*}
   */
  static validateOne(value, rules, options) {
    let instance = new Uranus(options);
    return instance.validateOne(value, rules);
  }
}
