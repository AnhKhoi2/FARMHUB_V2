import mongoose from 'mongoose';


const PlaceSchema = new mongoose.Schema(
{
query: { type: String, index: true }, // chuỗi user nhập
name: String,
country: String,
admin1: String,
latitude: Number,
longitude: Number
},
{ timestamps: true }
);


export default mongoose.model('Place', PlaceSchema);