import { StatusCodes } from "http-status-codes";
class InternalServerError extends Error {
    constructor(message = 'Internal Server Error') {
      super(message); 
      this.statusCode = StatusCodes.InternalServerError;  
    }
  }
  
  export default InternalServerError;