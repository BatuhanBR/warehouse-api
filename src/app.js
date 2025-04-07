const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const locationRoutes = require('./routes/locationRoutes');
const stockMovementRoutes = require('./routes/stockMovementRoutes');
const shelfRoutes = require('./routes/shelfRoutes');
const rackRoutes = require('./routes/rackRoutes');

// Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/stock-movements', stockMovementRoutes);
app.use('/api/shelves', shelfRoutes);
app.use('/api/racks', rackRoutes); 