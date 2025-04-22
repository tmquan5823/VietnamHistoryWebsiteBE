import { StatusCodes } from "http-status-codes";
class UnauthorizedError extends Error{
    constructor(message){
        super(message);
        
        Error.captureStackTrace(this, this.constructor);
        
        this.name = this.constructor.name;
        this.statusCode = StatusCodes.UNAUTHORIZED;
    }

    statusCode(){
        return this.statusCode;
    }
}

export default UnauthorizedError;