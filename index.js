require('dotenv').config();
const express = require('express');
const dns = require('dns');
const validUrl = require('valid-url');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// In-memory storage for URLs
let urlDatabase = {};
let urlCounter = 1;

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', function(req, res) {
  const url = req.body.url;

  // Check if the URL is valid
  if (!validUrl.isWebUri(url)) {
    return res.json({ error: 'invalid url' });
  }

  try {
    // Extract hostname from URL
    const hostname = new URL(url).hostname;

    // Verify the hostname using DNS resolve
    dns.lookup(hostname, (err) => {
      if (err) {
        console.error(`DNS lookup error for hostname: ${hostname}`, err);
        return res.json({ error: 'invalid url' });
      }

      // Generate a short URL
      const shortUrl = urlCounter++;
      urlDatabase[shortUrl] = url;

      // Respond with the original and short URL
      res.json({ original_url: url, short_url: shortUrl });
    });
  } catch (e) {
    console.error('Error parsing URL:', e);
    return res.json({ error: 'invalid url' });
  }
});

app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = req.params.short_url;
  const originalUrl = urlDatabase[shortUrl];

  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.json({ error: 'No short URL found for the given input' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
