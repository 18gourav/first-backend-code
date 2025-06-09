// const asyncHandler = () => {}


const asyncHandler = (fn) => async(req,res,next) => {
    try {
        await fn(req,res,next)
        
    } catch (err) {
        res.status(err.statusCode || err.status || 400).json({
            success: false,
            message: err.message
        })
        
    }
    }
    
    export default asyncHandler;
