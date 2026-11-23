const express = require('express');
const router = express.Router();
const {
    getProjects,
    createProject
} = require('../controllers/projectController');
const apiKey = require('../middlewares/apiKey');

router.get('/', getProjects);
router.post('/', apiKey, createProject);

module.exports = router;
