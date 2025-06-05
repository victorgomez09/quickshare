import { API_URL } from "@/constants"
import axios from "axios"

export const getMe = async () => {
    return await axios.get(`${API_URL}/v2/my/self`, { withCredentials: true })
}