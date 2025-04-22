import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const OTPSchema = new mongoose.Schema({
    otp: {type: String},
    createdAt: {type: Date},
    expiresAt: {type: Date},
});

const UserSchema = new mongoose.Schema({
    email: { type: String, require:true },
    password: { type: String, required: true },
    fullname: { type: String , require:true },
    role: { type: String , require:true },
    verified: {type: Boolean, require: true},
    avatar: {type: String},
    otpVerification: {type: OTPSchema},
    refreshToken: { type: String } ,
    isBanned: {type: Boolean}
}, {
    collection: 'user',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const User = mongoose.model("user", UserSchema);

export default User;
