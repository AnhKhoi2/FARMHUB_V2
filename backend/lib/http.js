import axios from 'axios';


export const http = axios.create({ timeout: 15000 });


export class ApiError extends Error {
constructor(status, message) {
super(message);
this.status = status || 500;
}
}