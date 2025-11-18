import mongoose from 'mongoose';


const AirSnapshot = new mongoose.Schema(
{
lat: { type: Number, index: true },
lon: { type: Number, index: true },
payload: {},
},
{ timestamps: { createdAt: true, updatedAt: false } }
);


export default mongoose.model('AirSnapshot', AirSnapshot);