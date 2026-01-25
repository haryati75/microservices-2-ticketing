import axios from 'axios';

const buildClient = ({ req }) => {
  if (typeof window === 'undefined') {
    // We are on the server
    return axios.create({
      baseURL: process.env.INGRESS_BASE_URL || 'http://ingress-nginx-srv',
      headers: req.headers,
    });
  } else {
    // We are on the client
    return axios.create({
      baseURL: '/',
    });
  }
};

export default buildClient;
