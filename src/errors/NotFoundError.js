import { StatusCodes } from "http-status-codes";

class NotFoundError extends Error{
    constructor(message){
        super(message);
        
        Error.captureStackTrace(this, this.constructor);
        
        this.name = this.constructor.name;
        this.statusCode = StatusCodes.NOT_FOUND;
    }

    statusCode(){
        return this.statusCode;
    }
}

export default NotFoundError;