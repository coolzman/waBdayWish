const { google } = require('googleapis');
const { create, Client } = require('@open-wa/wa-automate');
const Jimp = require('jimp');

// Replace with the path to your Google API credentials JSON file
const GOOGLE_API_CREDENTIALS = './path/to/your/credentials.json';

// Replace with the ID of your Google Sheet
const SHEET_ID = 'your-sheet-id-here';

// Replace with the name of the sheet tab
const SHEET_TAB = 'Sheet1';

// Replace with the group chat ID
const GROUP_CHAT_ID = 'group-chat-id-here';

// Initialize the Google Sheets API client
const auth = new google.auth.GoogleAuth({
  credentials: require(GOOGLE_API_CREDENTIALS),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

// Initialize the WhatsApp client
const options = {
  multiDevice: true, // for version not specified or 0.0.0
  blockCrashLogs: true,
  disableSpins: true,
  logConsole: false,
};

create(options)
  .then((client) => start(client))
  .catch((err) => console.error(err));

async function start(client) {
  const today = new Date().toLocaleDateString('en-GB');

  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A:B`,
    });

    const birthdayData = data.values.slice(1).filter((row) => row[1] === today);

    let message = 'Happy Birthday to:\n\n';
    for (const [name, birthday] of birthdayData) {
      message += `- ${name}\n`;
    }

    // Generate a random birthday wish image
    const image = await generateBirthdayImage(message);

    // Send the message and image to the group chat
    await client.sendImage(GROUP_CHAT_ID, image, 'birthday-wish.jpg', message);
    console.log('Birthday wishes sent to the group');
  } catch (err) {
    console.error('Error:', err);
  }

  client.close();
}

async function generateBirthdayImage(message) {
    // Specify the folder path containing the birthday background images
    const folderPath = './path/to/birthday/background/images';
  
    // Get a list of all files in the folder
    const files = fs.readdirSync(folderPath);
  
    // Filter the list to only include image files
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
    });
  
    // Choose a random image from the list
    const randomIndex = Math.floor(Math.random() * imageFiles.length);
    const randomImage = imageFiles[randomIndex];
  
    // Get the full path of the random image
    const randomImagePath = path.join(folderPath, randomImage);
  
    const image = await Jimp.read(randomImagePath);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
  
    const textWidth = image.bitmap.width - 100;
    const textHeight = image.bitmap.height - 100;
  
    image.print(font, 50, 50, {
      text: message,
      alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    }, textWidth, textHeight);
  
    const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);
    return buffer;
  }

  