import { StatusCodes } from "http-status-codes";

class ValidationError extends Error {
    constructor(message = 'Validation Error') {
      super(message); 
      this.statusCode = StatusCodes.UNPROCESSABLE_ENTITY; 
    }
  }
  
  export default ValidationError;