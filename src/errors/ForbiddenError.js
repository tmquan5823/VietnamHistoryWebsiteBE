import { StatusCodes } from "http-status-codes";
class ForbiddenError extends Error{
    constructor(message){
        super(message);
        
        Error.captureStackTrace(this, this.constructor);
        
        this.name = this.constructor.name;
        this.statusCode = StatusCodes.FORBIDDEN;
    }

    statusCode(){
        return this.statusCode;
    }
}

export default ForbiddenError;