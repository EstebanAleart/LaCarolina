require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

async function testCalendar() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    console.log('🔍 Listando eventos...');
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    console.log('✅ Eventos encontrados:', response.data.items?.length || 0);
    console.log(JSON.stringify(response.data.items, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Detalles:', error.response?.data || error);
  }
}

testCalendar();