const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    try {
        // Token'ı header'dan al
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access token not found'
            });
        }

        // "Bearer " kısmını çıkar
        const token = authHeader.split(' ')[1];

        // Token'ı doğrula
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // User bilgisini request'e ekle
        req.user = decoded;
        
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

module.exports = { protect };