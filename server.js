const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const saveDir = path.join(__dirname, 'savegames');
if (!fs.existsSync(saveDir)){
    fs.mkdirSync(saveDir);
}

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('saveGame', (data) => {
    fs.writeFile(path.join(saveDir, 'savegame.json'), JSON.stringify(data, null, 2), (err) => {
      if (err) {
        console.error('Error saving game:', err);
        socket.emit('saveError', 'Failed to save game.');
      } else {
        console.log('Game saved successfully.');
        socket.emit('saveSuccess', 'Game saved successfully.');
      }
    });
  });

  socket.on('loadGame', () => {
    fs.readFile(path.join(saveDir, 'savegame.json'), 'utf8', (err, data) => {
      if (err) {
        console.error('Error loading game:', err);
        socket.emit('loadError', 'Failed to load game.');
      } else {
        console.log('Game loaded successfully.');
        try {
          const parsedData = JSON.parse(data);
          socket.emit('loadedGame', parsedData);
        } catch (parseErr) {
          console.error('Error parsing savegame:', parseErr);
          socket.emit('loadError', 'Failed to parse save game.');
        }
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

http.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
