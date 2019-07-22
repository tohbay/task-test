import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export default {
  /**
   * @param {Object} dirtyObj may take an object of undefined values
   * @returns {Object} returns an object void of undefined values
   */
  stripNull(dirtyObj) {
    let cleanObj = {};

    Object.keys(dirtyObj).forEach(key => {
      const newVal = dirtyObj[key];
      cleanObj = newVal ? { ...cleanObj, [key]: newVal } : cleanObj;
    });

    return cleanObj;
  },

  /**
   * @param {string} pwd
   * @returns {string} hash password
   */
  hashPassword(pwd) {
    const salt = bcrypt.genSaltSync(15);
    const hashPass = bcrypt.hashSync(pwd, salt);
    return hashPass;
  },

  /**
   * @param {*} payload - payload for jwt
   * @returns {string} - return jwt token
   */
  jwtSigner(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
  },

  /**
   * @param {*} password
   * @param {*} userPassword
   * @returns {boolean} - return a boolean
   */
  verifyPassword(password, userPassword) {
    const isValid = bcrypt.compareSync(password, userPassword);
    return isValid;
  }
};
