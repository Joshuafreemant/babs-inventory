import axios from 'axios';
export const apiInstance = axios.create({
	// Configuration
	// baseURL: "http://localhost:3000/api",
	baseURL: "/api",

    withCredentials: true,
	headers: {
		Accept: 'application/json',
	},
});