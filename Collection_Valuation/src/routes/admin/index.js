const express = require('express');

const router = express.Router();

const admin = require('./admin');

// router.get('/', (req, res) => {
//   res.redirect('/admin/login');
// });

router.use('/admin', admin);

module.exports = router;
