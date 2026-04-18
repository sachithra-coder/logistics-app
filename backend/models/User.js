const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minLength: 6 },
    role: { type: String, enum: ['customer', 'dispatcher', 'driver', 'manager'], required: true },
    phone: { type: String, trim: true },
    notificationPreference: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false }
    },
    // Driver specific
    vehcileNumber: { type: String },
    isAvailable: { type: Boolean, default: true },
    currentLocation: {
        lat: { type: Number },
        lng: { type: Number },
        updateAt: { type: Date },
    },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.matchPassword = function(enterPassword) {
    return bcrypt.compare(enterPassword, this.password);
};

userSchema.methods.toJson = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model('User', userSchema);

