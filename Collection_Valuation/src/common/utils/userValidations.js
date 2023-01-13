module.exports = {
  signUp: {
    type: 'object',
    properties: {
      firstName: {
        type: 'string',
        required: true,
      },
      lastName: {
        type: 'string',
        required: true,
      },
      email: {
        type: 'string',
        required: true,
      },
      phone: {
        type: 'string',
        required: true,
      },
      gender: {
        type: 'string',
        required: true,
      },
      dob: {
        type: 'string',
        required: true,
      },
      userName: {
        type: 'string',
        required: true,
      },
      loginType: {
        type: 'string',
        required: true,
      },
    },
  },
  loginValidation: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
      },
      phone: {
        type: 'string',
      },
    },
  },
  forgotPwd: {
    type: 'object',
    properties: {
      phone: {
        type: 'string',
        required: true,
      },
      countryCode: {
        type: 'string',
        required: true,
      }
    },
  },

  otpVerifyDTO: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        required: true,
        enum: ['verifyPhone', 'verifyEmail', 'forgotPassword']
      },
      otp: {
        type: 'number',
        required: true,
      },
      countryCode: {
        type: 'string',
      },
      phone: {
        type: 'string',
      },
      email: {
        type: 'number',
      },
    },
  },


  resetPasswordDTO: {
    type: 'object',
    properties: {
      referenceToken: {
        type: 'string',
        required: true
      },
      newPassword: {
        type: 'string',
        required: true,
      }
    },
  },
};
