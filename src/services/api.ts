import axios from 'axios'

const api = axios.create({
  // baseURL: 'http://192.168.30.158:3333'
  baseURL: 'http://192.168.1.3:3400'
})
export default api
