import axios from 'axios';

const FAST2SMS_API_KEY = 'Te9I6q3rgkWhOAZ0iMDl4HytcsdjFVa7Q1nR5uSvLxK2N8zJEwgXzok3p1wC0eODnyrNJa5Pu2tc4EIj';

export const sendSMS = async (phone: string, message: string , date: string) => {
    try {
        const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}&route=dlt&sender_id=RCTCAB&message=178071&variables_values=${message}|${date}&flash=0&numbers=${phone}`;

        const response = await axios.get(url);
        console.log("SMS API Response:", response.data);

        if (response.data.return === true) {
            return { success: true };
        } else {
            throw new Error(response.data.message || 'SMS sending failed');
        }
    } catch (error: any) {
        console.error('SMS sending error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.message);
    }
}; 

export const sendEmergencySMS = async (phones: string[], message: string , ) => {
    try {
        const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}&route=dlt&sender_id=RCTCAB&message=178374&variables_values=${message}&flash=0&numbers=${phones.join(',')}`;

        const response = await axios.get(url);
        console.log("Emergency SMS API Response:", response.data);

        if (response.data.return === true) {
            return { success: true };
        } else {
            throw new Error(response.data.message || 'Emergency SMS sending failed');
        }
    } catch (error: any) {
        console.error('Emergency SMS sending error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.message);
    }
}; 

