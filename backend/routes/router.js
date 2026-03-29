const express = require('express');
const router = express.Router();

// A generic health check route to verify the API is up
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running smoothly!',
    timestamp: new Date().toISOString()
  });
});

// As your app grows, you can import modular route files here.
// Example:
// const userRoutes = require('./userRoutes');
// const productRoutes = require('./productRoutes');
// 
// router.use('/users', userRoutes);
// router.use('/products', productRoutes);

module.exports = router;
